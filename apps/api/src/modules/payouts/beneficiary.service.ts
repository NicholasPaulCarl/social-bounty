import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PayoutProviderFactory } from './payout-provider.factory';

const ALGORITHM = 'aes-256-gcm';

export interface BeneficiaryInput {
  accountHolderName: string;
  bankCode: string;
  accountNumber: string;
  accountType: string;
}

@Injectable()
export class BeneficiaryService {
  private readonly logger = new Logger(BeneficiaryService.name);
  private readonly key: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: PayoutProviderFactory,
    private readonly config: ConfigService,
  ) {
    // R29 hardening (batch 14A, 2026-04-15).
    //
    // When `PAYOUTS_ENABLED=true` the outbound rail is live and we are
    // writing real bank account numbers at rest. BENEFICIARY_ENC_KEY MUST
    // be explicitly set — no JWT_SECRET fallback, because re-using the
    // token-signing secret means one key compromise decrypts every
    // beneficiary row. Missing = boot failure (thrown from the constructor
    // so the Nest DI container surfaces it during module init).
    //
    // When `PAYOUTS_ENABLED=false` (current pre-TradeSafe state, ADR 0008)
    // the fallback is preserved for dev ergonomics — no live encryption is
    // happening because no live beneficiary rows are being written.
    const explicit = this.config.get<string>('BENEFICIARY_ENC_KEY');
    const payoutsEnabled = this.config.get<string>('PAYOUTS_ENABLED') === 'true';

    if (payoutsEnabled && !explicit) {
      throw new Error(
        'Configuration error: BENEFICIARY_ENC_KEY is required when PAYOUTS_ENABLED=true. Set a dedicated 32+ character secret in the environment; JWT_SECRET fallback is not permitted with live payouts (R29, ADR 0008).',
      );
    }

    let secret: string;
    if (explicit) {
      secret = explicit;
    } else {
      this.logger.warn(
        'BENEFICIARY_ENC_KEY unset — using JWT_SECRET derivation. ONLY VALID WITH PAYOUTS_ENABLED=false.',
      );
      secret = this.config.get<string>('JWT_SECRET', 'dev-only-key');
    }

    this.key = scryptSync(secret, 'stitch-beneficiary', 32);
  }

  /**
   * ADR 0011 — TradeSafe unified rail. The `StitchClient`-backed local-fallback
   * branch has been removed; `PayoutProviderFactory` always resolves to the
   * TradeSafe adapter (mock mode for dev). TradeSafe returns a real provider
   * id in all environments; the local-synthetic `local:<userId>` fallback
   * is gone.
   *
   * The `StitchBeneficiary` Prisma model name is retained until agent 1B
   * renames the schema; semantically these rows now store TradeSafe
   * beneficiary ids.
   */
  async upsertForUser(userId: string, input: BeneficiaryInput) {
    if (!/^\d{6,20}$/.test(input.accountNumber)) {
      throw new BadRequestException('accountNumber must be 6-20 digits');
    }
    const existing = await this.prisma.stitchBeneficiary.findUnique({ where: { userId } });
    if (existing) {
      this.logger.log(`beneficiary already exists for user ${userId}; reusing`);
      return existing;
    }

    const provider = this.providerFactory.getProvider();
    const result = await provider.createBeneficiary({
      accountHolderName: input.accountHolderName,
      bankCode: input.bankCode,
      accountNumber: input.accountNumber,
      accountType: input.accountType,
      externalReference: userId,
    });
    const providerBeneficiaryId = result.id;

    // Fail-loud guard: if a live rail returns a synthetic id, something
    // is misconfigured and we would silently misroute funds.
    const paymentsProvider = this.config.get<string>('PAYMENTS_PROVIDER', 'none');
    if (
      paymentsProvider === 'tradesafe_live' &&
      providerBeneficiaryId.startsWith('local:')
    ) {
      throw new BadRequestException(
        'Beneficiary creation returned a local fallback id in live mode. Check TradeSafe provider configuration (ADR 0011).',
      );
    }

    return this.prisma.stitchBeneficiary.create({
      data: {
        userId,
        stitchBeneficiaryId: providerBeneficiaryId,
        accountHolderName: input.accountHolderName,
        bankCode: input.bankCode,
        accountNumberEnc: this.encrypt(input.accountNumber),
        accountType: input.accountType,
      },
    });
  }

  decryptAccountNumber(encrypted: string): string {
    return this.decrypt(encrypted);
  }

  private encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
  }

  private decrypt(payload: string): string {
    const [ivHex, tagHex, dataHex] = payload.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
