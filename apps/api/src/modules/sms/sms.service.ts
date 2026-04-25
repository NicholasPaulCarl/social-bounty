import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private readonly enabled: boolean;
  private readonly apiKey: string | undefined;
  private readonly sender: string | undefined;
  private readonly defaultRegion: string;

  constructor(private readonly config: ConfigService) {
    this.enabled =
      this.config.get<boolean>('SMS_ENABLED', false) === true ||
      this.config.get<string>('SMS_ENABLED') === 'true';
    this.apiKey = this.config.get<string>('BREVO_API_KEY');
    this.sender = this.config.get<string>('BREVO_SMS_SENDER');
    this.defaultRegion = this.config.get<string>('BREVO_SMS_DEFAULT_REGION', 'ZA');
  }

  onModuleInit(): void {
    if (this.enabled) {
      this.logger.log(`SMS rail enabled — Brevo, sender=${this.sender ?? '(none)'}`);
    } else {
      this.logger.log('SMS rail disabled (SMS_ENABLED=false)');
    }
  }

  async sendOtpSms(phoneNumber: string, otp: string): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('SMS send skipped — rail disabled (SMS_ENABLED=false)');
      return;
    }
    if (!this.apiKey || !this.sender) {
      this.logger.error('SMS rail enabled but BREVO_API_KEY or BREVO_SMS_SENDER missing');
      return;
    }

    const content = `Your Social Bounty code: ${otp}. Valid 5 min. Don't share.`;

    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: this.sender,
        recipient: phoneNumber,
        content,
        type: 'transactional',
        tag: 'auth-otp',
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '<unreadable>');
      this.logger.error(
        `Brevo SMS send failed: status=${response.status} body=${errBody.slice(0, 500)}`,
      );
      throw new Error(`Brevo SMS send failed (${response.status})`);
    }

    const result = (await response.json().catch(() => ({}))) as {
      messageId?: string | number;
    };
    this.logger.log(
      `SMS sent — messageId=${result.messageId ?? 'unknown'} recipient=${this.maskPhone(phoneNumber)}`,
    );
  }

  private maskPhone(phone: string): string {
    return phone.length <= 4 ? phone : `${phone.slice(0, 4)}****`;
  }
}
