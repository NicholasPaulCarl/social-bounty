# Webhook Verification (Svix)

Stitch Express uses Svix to deliver webhooks. All incoming webhooks must be verified before processing.

## Why Verify

- Attackers can impersonate services by sending fake webhooks to your endpoint
- Svix signs every webhook with a unique key so you can confirm authenticity
- Timestamps prevent replay attacks (5-minute tolerance)

## Headers

Every Svix webhook includes three headers:

| Header | Purpose |
|--------|---------|
| `svix-id` | Unique message identifier |
| `svix-timestamp` | Unix timestamp of message creation |
| `svix-signature` | HMAC SHA256 signature (`v1,<base64>`) |

## Verification with Library (Recommended)

Install the Svix library:

```bash
npm install svix
```

### NestJS Example

**Important:** Enable `rawBody` in NestJS bootstrap:

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  rawBody: true,
});
```

**Webhook controller:**

```typescript
import { Controller, Post, Req, Res, RawBodyRequest } from '@nestjs/common';
import { Request, Response } from 'express';
import { Webhook } from 'svix';

@Controller('webhooks')
export class WebhookController {
  private readonly wh: Webhook;

  constructor() {
    // The webhook secret from Stitch/Svix (starts with whsec_)
    this.wh = new Webhook(process.env.STITCH_WEBHOOK_SECRET!);
  }

  @Post('stitch')
  async handleStitchWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const payload = req.rawBody?.toString() ?? '';
    const headers = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    try {
      const event = this.wh.verify(payload, headers);
      // Process the verified event
      await this.processEvent(event);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  private async processEvent(event: any) {
    // Handle different event types
    switch (event.type) {
      case 'payment.completed':
        // Update payment status in database
        break;
      case 'payment.settled':
        // Mark payment as settled
        break;
      case 'refund.processed':
        // Update refund status
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
  }
}
```

### Express Example

```typescript
import express from 'express';
import { Webhook } from 'svix';

const app = express();

// IMPORTANT: Use raw body parser for webhook endpoint
app.post('/webhooks/stitch',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const wh = new Webhook(process.env.STITCH_WEBHOOK_SECRET!);

    try {
      const event = wh.verify(req.body.toString(), {
        'svix-id': req.headers['svix-id'] as string,
        'svix-timestamp': req.headers['svix-timestamp'] as string,
        'svix-signature': req.headers['svix-signature'] as string,
      });
      // Process event...
      res.json({ received: true });
    } catch (err) {
      res.status(400).json({ error: 'Invalid signature' });
    }
  }
);
```

## Manual Verification (Without Library)

If you cannot use the Svix library:

1. **Extract signature:** Parse the `svix-signature` header. It contains versioned signatures separated by spaces (e.g., `v1,<base64sig> v1,<base64sig2>`)

2. **Build signed content:** Concatenate `svix-id`, `.`, `svix-timestamp`, `.`, and the raw request body:
   ```
   signedContent = `${svix_id}.${svix_timestamp}.${body}`
   ```

3. **Compute HMAC:** Use HMAC SHA256 with the webhook secret (base64-decoded, without the `whsec_` prefix):
   ```typescript
   import { createHmac } from 'crypto';

   const secretBytes = Buffer.from(secret.split('_')[1], 'base64');
   const signature = createHmac('sha256', secretBytes)
     .update(signedContent)
     .digest('base64');
   ```

4. **Compare:** Check if `v1,${signature}` matches any signature in the header

5. **Validate timestamp:** Reject if timestamp differs from current time by more than 5 minutes

## Critical Implementation Notes

1. **Use raw request body** — JSON parsing and re-stringifying will break signature verification
2. **Disable CSRF protection** on webhook endpoints
3. **Return 2xx within 15 seconds** — Svix considers anything else a failure and will retry
4. **Keep server clock synchronized** via NTP for timestamp validation
5. **Process asynchronously** — Return 200 immediately, process the event in background if needed

## Retry Behavior

Svix retries failed webhook deliveries with exponential backoff. Ensure your endpoint is idempotent — use the `svix-id` header to deduplicate.

## Testing

Use the Svix CLI or webhook debugger during development:

```bash
npx svix listen http://localhost:3001/api/v1/webhooks/stitch
```
