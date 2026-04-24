import { Injectable, Logger, NotImplementedException } from '@nestjs/common';

/**
 * Beneficiary (hunter bank account) management — **Phase 4 deferred**.
 *
 * The `stitch_beneficiaries` table was dropped as part of the
 * single-rail Stitch-deletion cutover (2026-04-24, ADR 0011). TradeSafe
 * manages beneficiary details inside its own system via the SELLER user
 * token — our local beneficiary table is not needed in the unified
 * architecture. Proper wiring lands in Phase 4.
 */
@Injectable()
export class BeneficiaryService {
  private readonly logger = new Logger(BeneficiaryService.name);

  async upsertForUser(
    _userId: string,
    _input: {
      accountHolderName: string;
      bankCode: string;
      accountNumber: string;
      accountType: string;
    },
  ): Promise<never> {
    throw new NotImplementedException(
      'Hunter beneficiary management is Phase 4 of the TradeSafe cutover (ADR 0011). TradeSafe stores bank details on its own side via the SELLER user token; our local beneficiary table was dropped in the 2026-04-24 single-rail cutover.',
    );
  }

  decryptAccountNumber(_encrypted: string): string {
    throw new NotImplementedException(
      'Beneficiary decryption is Phase 4 deferred (no local beneficiary rows exist post-Stitch-deletion).',
    );
  }
}
