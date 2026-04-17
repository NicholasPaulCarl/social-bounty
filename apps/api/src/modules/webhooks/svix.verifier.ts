import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

export class SvixVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SvixVerificationError';
  }
}

export interface SvixHeaders {
  id: string;
  timestamp: string;
  signature: string;
}

@Injectable()
export class SvixVerifier {
  /**
   * Verifies a Svix webhook signature per https://docs.svix.com/receiving/verifying-payloads/how-manual.
   * Pass in the RAW request body (Buffer or string) — JSON-parsing and re-serializing will break verification.
   *
   * The secret is whsec_<base64> as issued by Svix. We strip the prefix and base64-decode to get the HMAC key.
   */
  verify(rawBody: string | Buffer, headers: SvixHeaders, secret: string): void {
    if (!headers.id) throw new SvixVerificationError('missing svix-id header');
    if (!headers.timestamp) throw new SvixVerificationError('missing svix-timestamp header');
    if (!headers.signature) throw new SvixVerificationError('missing svix-signature header');
    if (!secret) throw new SvixVerificationError('webhook secret not configured');

    this.assertTimestampFresh(headers.timestamp);

    const key = this.decodeSecret(secret);
    const payload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
    const toSign = `${headers.id}.${headers.timestamp}.${payload}`;
    const expected = createHmac('sha256', key).update(toSign).digest('base64');

    // svix-signature is space-separated entries, each of the form "v1,<sig>".
    const sigs = headers.signature
      .split(/\s+/)
      .filter(Boolean)
      .map((entry) => {
        const [version, sig] = entry.split(',');
        return version === 'v1' ? sig : '';
      })
      .filter(Boolean);

    if (sigs.length === 0) {
      throw new SvixVerificationError('no v1 signatures present');
    }

    const expectedBuf = Buffer.from(expected, 'utf8');
    for (const sig of sigs) {
      const sigBuf = Buffer.from(sig, 'utf8');
      if (sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)) {
        return;
      }
    }
    throw new SvixVerificationError('signature mismatch');
  }

  private assertTimestampFresh(timestamp: string): void {
    const ts = Number.parseInt(timestamp, 10);
    if (!Number.isFinite(ts)) {
      throw new SvixVerificationError('invalid svix-timestamp');
    }
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > MAX_TIMESTAMP_SKEW_SECONDS) {
      throw new SvixVerificationError('svix-timestamp outside tolerance');
    }
  }

  private decodeSecret(secret: string): Buffer {
    const stripped = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
    return Buffer.from(stripped, 'base64');
  }
}
