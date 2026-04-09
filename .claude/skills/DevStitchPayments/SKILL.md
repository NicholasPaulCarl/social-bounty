---
name: DevStitchPayments
description: Developer role skilled in integrating Stitch Express payment gateway and Svix webhooks. Use this skill when building payment flows, handling payouts, managing subscriptions, processing refunds, or debugging payment/webhook issues.
metadata:
  author: Social Bounty
  version: "1.0.0"
  date: April 2026
  abstract: Integration guide for Stitch Express payment API and Svix webhook verification. Covers authentication, payment links, card consents, subscriptions, refunds, withdrawals, and webhook event handling for the Social Bounty platform.
---

# Stitch Express Payment Integration

## Role

You are a developer specializing in Stitch Express payment gateway integration. You handle payment flows, webhook processing, refund management, and troubleshooting payment-related bugs.

## Credentials (Test Environment)

- **Client ID:** `test-f254f830-e370-46c2-9cf4-47da332b33e6`
- **Client Secret:** `0ARNSf6ryv6Bqo4xWcQxF/+TC1r+G2thX4Y4YI5cjBWb5Z10xPK1/TOpahJ0OxYn`

## Quick Reference

| Resource | URL |
|----------|-----|
| API Base URL | `https://express.stitch.money` |
| API Docs | https://express.stitch.money/api-docs |
| Webhook Docs (Svix) | https://docs.svix.com/receiving/introduction |
| Token Endpoint | `POST /api/v1/token` |

## Authentication

All API calls require a Bearer token. Tokens are valid for **15 minutes**.

```typescript
const response = await fetch('https://express.stitch.money/api/v1/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId: 'test-f254f830-e370-46c2-9cf4-47da332b33e6',
    clientSecret: '0ARNSf6ryv6Bqo4xWcQxF/+TC1r+G2thX4Y4YI5cjBWb5Z10xPK1/TOpahJ0OxYn',
    scope: 'client_paymentrequest',
  }),
});
const { accessToken } = await response.json();
// Use: Authorization: Bearer <accessToken>
```

## Key Concepts

- **Amounts are in cents** (e.g., R50.00 = 5000)
- **Currency:** ZAR (South African Rand)
- **Payment statuses:** PENDING → PAID → SETTLED
- **Refund reasons:** DUPLICATE, FRAUD, REQUESTED_BY_CUSTOMER
- **Withdrawal types:** INSTANT (within 1 hour), DEFAULT (3 business days)

## Core Endpoints

See `references/api-endpoints.md` for full endpoint documentation.
See `references/webhooks.md` for webhook verification and event handling.

## When to Use

- Implementing payment collection for bounties
- Processing payouts/withdrawals to hunters
- Handling payment status webhooks
- Managing refunds for disputed submissions
- Setting up recurring subscription payments
- Debugging payment failures or webhook delivery issues

## Error Handling

```json
{
  "success": false,
  "generalErrors": ["Error message"],
  "fieldErrors": { "amount": ["Must be positive"] }
}
```

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Validation error |
| 401 | Missing/invalid auth |
| 403 | Token expired |
| 404 | Resource not found |
| 500 | Server error |

## Supported Banks

ABSA, CAPITEC, FNB, NEDBANK, STANDARD_BANK, TYMEBANK, INVESTEC, MERCANTILE, ACCESS_BANK, DISCOVERY_BANK, BANK_ZERO, BIDVEST, SASFIN, AL_BARAKA_BANK
