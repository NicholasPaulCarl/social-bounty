# DevStitchPayments

## Structure

```
DevStitchPayments/
  SKILL.md                        # Main skill file — read this first
  CLAUDE.md                       # This navigation guide
  references/
    api-endpoints.md              # Full Stitch Express API reference
    webhooks.md                   # Svix webhook verification & handling
    troubleshooting.md            # Common issues and debugging patterns
```

## Usage

1. Read `SKILL.md` for authentication, credentials, and quick reference
2. Read `references/api-endpoints.md` for full endpoint documentation
3. Read `references/webhooks.md` for webhook setup and verification
4. Read `references/troubleshooting.md` when debugging payment issues

## When to Apply

- Building payment collection flows (payment links)
- Processing payouts/withdrawals to users
- Handling Stitch webhook events (payment status changes)
- Managing refunds
- Setting up recurring subscriptions
- Debugging payment or webhook failures

## Key Facts

- **API Base:** `https://express.stitch.money`
- **Auth:** Bearer token via `POST /api/v1/token` (15-min expiry)
- **Amounts:** Always in cents (R50.00 = 5000)
- **Webhooks:** Svix-powered, verify with `svix` npm package
- **Test Client ID:** `test-f254f830-e370-46c2-9cf4-47da332b33e6`
