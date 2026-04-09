# Stitch Express API Endpoints

Base URL: `https://express.stitch.money`

All endpoints require `Authorization: Bearer <token>` header.

---

## Authentication

### POST /api/v1/token

Get access token (valid 15 minutes).

```json
{
  "clientId": "test-f254f830-e370-46c2-9cf4-47da332b33e6",
  "clientSecret": "0ARNSf6ryv6Bqo4xWcQxF/+TC1r+G2thX4Y4YI5cjBWb5Z10xPK1/TOpahJ0OxYn",
  "scope": "client_paymentrequest"
}
```

**Scopes:** `client_paymentrequest`, `client_recurringpaymentconsentrequest`

**Response:** `{ "accessToken": "..." }`

---

## Account

### GET /api/v1/account/balance

Returns account balance in cents.

### GET /api/v1/account/bank-details

Returns verified merchant bank details.

---

## Payment Links

### POST /api/v1/payment-links

Create a payment link for collecting payment.

```json
{
  "amount": 5000,
  "merchantReference": "bounty-payment-abc123",
  "expiresAt": "2026-04-15T00:00:00Z",
  "payerName": "John Doe",
  "payerEmailAddress": "john@example.com",
  "payerPhoneNumber": "+27821234567",
  "collectDeliveryDetails": false,
  "skipCheckoutPage": false,
  "deliveryFee": 0
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amount | integer | yes | In cents (5000 = R50.00) |
| merchantReference | string | yes | Max 50 chars |
| expiresAt | datetime | yes | ISO 8601 |
| payerName | string | yes | Max 40 chars |
| payerEmailAddress | string | no | Valid email |
| payerPhoneNumber | string | no | E.164 format |
| collectDeliveryDetails | boolean | no | |
| skipCheckoutPage | boolean | no | Default false |
| deliveryFee | integer | no | In cents |

**Response:** Returns payment link with `id`, `url`, `status`.

**Statuses:** PENDING, EXPIRED, PAID, SETTLED, CANCELLED

### GET /api/v1/payment-links

Query payment links with filters.

| Query Param | Type | Description |
|-------------|------|-------------|
| startTime | datetime | Filter from date |
| endTime | datetime | Filter to date |
| status | string | PENDING/EXPIRED/PAID/SETTLED/CANCELLED |
| limit | integer | Max results |
| merchantReference | string | Filter by reference |
| payerName | string | Filter by payer |

### GET /api/v1/payment-links/{paymentId}

Retrieve a specific payment link by ID.

### POST /api/v1/payment-links/{paymentId}/delivery-detail

Add delivery details to a payment link.

### GET /api/v1/payment-links/{paymentId}/delivery-detail

Fetch delivery details for a payment link.

---

## Card Consents

### POST /api/v1/card-consents

Create a card consent request (save card for future charges).

```json
{
  "payerFullName": "John Doe",
  "email": "john@example.com",
  "payerId": "user-uuid",
  "initialAmount": 5000
}
```

**Statuses:** PENDING, CONSENTED

### GET /api/v1/card-consents/{consentRequestId}

Retrieve consent by ID.

### POST /api/v1/card-consents/{consentRequestId}/initiate-payment

Charge a saved card.

---

## Subscriptions

### POST /api/v1/subscriptions

Create a recurring subscription.

```json
{
  "amount": 35000,
  "merchantReference": "sub-hunter-pro",
  "startDate": "2026-04-10T00:00:00Z",
  "endDate": "2027-04-10T00:00:00Z",
  "payerFullName": "John Doe",
  "email": "john@example.com",
  "payerId": "user-uuid",
  "recurrence": {
    "frequency": "Monthly",
    "interval": 1,
    "byMonthDay": 1
  },
  "initialAmount": 35000
}
```

**Recurrence options:**
- `Weekly`: frequency, interval, byWeekDay (MO-SU)
- `Monthly`: frequency, interval, byMonthDay (1-31)
- `Yearly`: frequency, interval, byMonth (1-12), byMonthDay (1-31)

**Statuses:** AUTHORISED, UNAUTHORISED, EXPIRED, FAILED, CANCELLED

### GET /api/v1/subscriptions

List all subscriptions.

### POST /api/v1/subscriptions/{subscriptionId}/cancel

Cancel a subscription.

---

## Payments

### GET /api/v1/payment

Query all payments with filters.

### GET /api/v1/payment/{paymentId}

Retrieve a specific payment.

**Payment response:**
```json
{
  "id": "payment-uuid",
  "amount": "5000",
  "paidAt": "2026-04-09T12:00:00Z",
  "status": "PAID",
  "type": "LINK",
  "fee": {
    "id": "fee-uuid",
    "type": "PAYMENT_LINKS",
    "amount": "150",
    "paymentId": "payment-uuid",
    "createdAt": "2026-04-09T12:00:00Z"
  },
  "cardDetail": {
    "last4": "1234",
    "bin": "411111",
    "expiryMonth": "12",
    "expiryYear": "2028"
  }
}
```

**Statuses:** PAID, SETTLED
**Types:** SUBSCRIPTION, CONSENT, LINK

---

## Refunds

### POST /api/v1/payment/{paymentId}/refund

Create a refund for a payment.

```json
{
  "amount": 5000,
  "reason": "REQUESTED_BY_CUSTOMER"
}
```

**Reasons:** DUPLICATE, FRAUD, REQUESTED_BY_CUSTOMER
**Statuses:** PROCESSED, FAILED

### GET /api/v1/payment/{paymentId}/refund

Get refunds for a specific payment.

### GET /api/v1/refunds

List all merchant refunds.

### GET /api/v1/refunds/{refundId}

Get a specific refund.

---

## Fees

### GET /api/v1/fees

Retrieve fees charged to account.

**Fee types:** PAYMENT_LINKS, WITHDRAWAL

---

## Withdrawals

### POST /api/v1/withdrawal

Withdraw a specified amount.

```json
{
  "amount": 50000,
  "withdrawalType": "DEFAULT"
}
```

| Type | Speed |
|------|-------|
| INSTANT | Within 1 hour |
| DEFAULT | Within 3 business days |

### POST /api/v1/withdrawal/max

Withdraw full available balance.

---

## Redirect URLs

### POST /api/v1/redirect-urls

Create a redirect URL (max 5 per client).

### GET /api/v1/redirect-urls

List all redirect URLs.

### DELETE /api/v1/redirect-urls

Remove a redirect URL.

---

## Webhooks

### POST /api/v1/webhook

Register a webhook URL for event notifications. Webhooks are delivered via Svix. See `webhooks.md` for verification details.

---

## Response Format

**Success:**
```json
{
  "success": true,
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "generalErrors": ["Error message"],
  "fieldErrors": { "amount": ["Must be a positive number"] }
}
```
