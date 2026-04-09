# Stitch Express Troubleshooting Guide

## Authentication Issues

### 401 Unauthorized
- **Cause:** Missing or malformed `Authorization` header
- **Fix:** Ensure header is `Authorization: Bearer <token>` (not `Token` or `Basic`)

### 403 Forbidden
- **Cause:** Token expired (tokens last 15 minutes)
- **Fix:** Request a new token before each batch of API calls, or cache with expiry tracking

```typescript
class StitchTokenManager {
  private token: string | null = null;
  private expiresAt = 0;

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt) {
      return this.token;
    }
    const res = await fetch('https://express.stitch.money/api/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: process.env.STITCH_CLIENT_ID,
        clientSecret: process.env.STITCH_CLIENT_SECRET,
        scope: 'client_paymentrequest',
      }),
    });
    const data = await res.json();
    this.token = data.accessToken;
    this.expiresAt = Date.now() + 14 * 60 * 1000; // 14 min buffer
    return this.token!;
  }
}
```

## Payment Link Issues

### Payment stuck in PENDING
- Check `expiresAt` — the link may have expired
- Verify the payer actually completed the bank redirect flow
- Check webhook delivery logs in Svix dashboard

### Amount mismatch
- All amounts are in **cents**, not rands
- R50.00 = `5000`, not `50`

### merchantReference validation
- Max 50 characters
- Must be unique per payment for your reconciliation

## Webhook Issues

### Signature verification failing
1. **Raw body required** — If your framework parses JSON, the re-serialized body won't match. Use `rawBody` option in NestJS or `express.raw()` in Express
2. **Wrong secret** — Ensure you're using the webhook secret (starts with `whsec_`), not your API client secret
3. **Clock skew** — Server time must be within 5 minutes. Run `ntpdate` or check NTP sync

### Webhooks not arriving
1. Check your endpoint returns `2xx` within 15 seconds
2. Ensure CSRF protection is disabled on the webhook route
3. Verify the webhook URL is registered via `POST /api/v1/webhook`
4. Check Svix dashboard for delivery logs and retry status
5. For local development, use Svix CLI tunnel: `npx svix listen http://localhost:3001/...`

### Duplicate webhook events
- Svix retries on failure — make your handler **idempotent**
- Use `svix-id` header to deduplicate
- Store processed event IDs in Redis with a TTL

```typescript
async handleEvent(svixId: string, event: any) {
  const key = `webhook:processed:${svixId}`;
  const already = await redis.get(key);
  if (already) return; // Skip duplicate

  await redis.set(key, '1', 86400); // 24h TTL
  // Process event...
}
```

## Refund Issues

### Refund fails
- Can only refund PAID or SETTLED payments
- Refund amount cannot exceed original payment amount
- Partial refunds: ensure remaining amount is valid

### Refund status stays FAILED
- Check if the bank rejected the refund
- Verify the payer's bank account is still active
- Contact Stitch support with the refund ID

## Withdrawal Issues

### Insufficient balance
- Check `GET /api/v1/account/balance` first
- Balance is net of pending refunds and fees

### INSTANT withdrawal not available
- INSTANT may not be available for all account types
- Fall back to DEFAULT (3 business days)

## Common Patterns

### Idempotent payment creation
```typescript
// Use merchantReference as idempotency key
const existing = await db.payment.findFirst({
  where: { merchantReference: `bounty-${bountyId}-${userId}` },
});
if (existing) return existing;

const link = await stitch.createPaymentLink({
  amount: bounty.rewardValue * 100, // Convert to cents
  merchantReference: `bounty-${bountyId}-${userId}`,
  // ...
});
```

### Polling as webhook fallback
```typescript
// If webhook is delayed, poll payment status
async checkPaymentStatus(paymentId: string) {
  const res = await stitch.getPayment(paymentId);
  if (res.status === 'PAID' || res.status === 'SETTLED') {
    await this.handlePaymentComplete(res);
  }
}
```
