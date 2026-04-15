import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StitchClient } from '../stitch/stitch.client';

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
    private readonly stitch: StitchClient,
    private readonly config: ConfigService,
  ) {
    const secret =
      this.config.get<string>('BENEFICIARY_ENC_KEY') ??
      this.config.get<string>('JWT_SECRET', 'dev-only-key');
    this.key = scryptSync(secret, 'stitch-beneficiary', 32);
  }

  // TRADESAFE MIGRATION (ADR 0008): the local-fallback branch (synthetic
  // `local:{userId}` id when Stitch is disabled) is removed when TradeSafe is
  // integrated — TradeSafe's beneficiary API returns a real provider id in all
  // environments, so `stitchBeneficiaryId` becomes `tradesafeBeneficiaryId`.
  // Adapter target: modules/payouts/payout-provider.interface.ts (ADR 0009).
  async upsertForUser(userId: string, input: BeneficiaryInput) {
    if (!/^\d{6,20}$/.test(input.accountNumber)) {
      throw new BadRequestException('accountNumber must be 6-20 digits');
    }
    const existing = await this.prisma.stitchBeneficiary.findUnique({ where: { userId } });
    if (existing) {
      this.logger.log(`beneficiary already exists for user ${userId}; reusing`);
      return existing;
    }

    let stitchBeneficiaryId: string;
    if (this.stitch.isEnabled()) {
      // Real call in live/sandbox; in unit tests this module is mocked.
      const result = await this.stitch.createBeneficiary(input);
      stitchBeneficiaryId = (result as any).id ?? `local:${userId}`;
    } else {
      stitchBeneficiaryId = `local:${userId}`;
    }

    // KB R12/R13 — silent-local-fallback antipattern.
    //
    // StitchClient.createBeneficiary always mints a synthetic `local:<...>`
    // id because Stitch Express has no beneficiary endpoint (see ADR 0008 —
    // TradeSafe migration pending). That is acceptable in
    // dev / stitch_sandbox because payouts in those envs are exercised
    // against the local flow / test doubles. In production
    // (`PAYMENTS_PROVIDER=stitch_live`) a synthetic id is useless: the
    // downstream `POST /api/v1/withdrawal` call would silently pay the
    // merchant's single verified bank account instead of the hunter's,
    // which is a Critical financial-impact failure.
    //
    // Fail loud BEFORE we insert the row so the hunter sees a clear error
    // instead of a silent break at payout time.
    const provider = this.config.get<string>('PAYMENTS_PROVIDER', 'none');
    if (provider === 'stitch_live' && stitchBeneficiaryId.startsWith('local:')) {
      throw new BadRequestException(
        'Beneficiary creation requires a real TradeSafe beneficiary id but the provider returned a local fallback. ADR 0008: TradeSafe integration pending — payouts are not yet supported in stitch_live.',
      );
    }

    return this.prisma.stitchBeneficiary.create({
      data: {
        userId,
        stitchBeneficiaryId,
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
