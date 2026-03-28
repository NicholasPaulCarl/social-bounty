import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

/** Data required for submission-status emails */
export interface SubmissionStatusEmailData {
  userName: string;
  bountyTitle: string;
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFO';
  reviewerNote?: string;
  actionUrl?: string;
}

/** Data required for payout-notification emails */
export interface PayoutNotificationEmailData {
  userName: string;
  bountyTitle: string;
  amount: string;
  currency: string;
}

/** Data required for bounty-published emails */
export interface BountyPublishedEmailData {
  bountyTitle: string;
  shortDescription: string;
  rewardValue: string;
  currency: string;
  bountyUrl?: string;
}

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_MORE_INFO: 'Needs More Info',
};

const STATUS_SUBJECTS: Record<string, string> = {
  APPROVED: 'Your submission has been approved',
  REJECTED: 'Your submission has been reviewed',
  NEEDS_MORE_INFO: 'Additional information requested',
};

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  private baseTemplate!: Handlebars.TemplateDelegate;
  private submissionStatusTemplate!: Handlebars.TemplateDelegate;
  private payoutNotificationTemplate!: Handlebars.TemplateDelegate;
  private bountyPublishedTemplate!: Handlebars.TemplateDelegate;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', 'localhost'),
      port: this.config.get<number>('SMTP_PORT', 1025),
      auth: this.config.get('SMTP_USER')
        ? {
            user: this.config.get('SMTP_USER'),
            pass: this.config.get('SMTP_PASS'),
          }
        : undefined,
    });
  }

  onModuleInit() {
    this.loadTemplates();
  }

  // ── Template Loading ──────────────────────────────────

  private loadTemplates(): void {
    const templatesDir = path.join(__dirname, 'templates');

    this.baseTemplate = this.compileTemplate(templatesDir, 'base.hbs');
    this.submissionStatusTemplate = this.compileTemplate(templatesDir, 'submission-status.hbs');
    this.payoutNotificationTemplate = this.compileTemplate(templatesDir, 'payout-notification.hbs');
    this.bountyPublishedTemplate = this.compileTemplate(templatesDir, 'bounty-published.hbs');

    // Register the "eq" helper for conditional status styling
    Handlebars.registerHelper('eq', (a: string, b: string) => a === b);

    this.logger.log('Email templates loaded successfully');
  }

  private compileTemplate(dir: string, filename: string): Handlebars.TemplateDelegate {
    const filePath = path.join(dir, filename);
    const source = fs.readFileSync(filePath, 'utf-8');
    return Handlebars.compile(source);
  }

  // ── Rendering ─────────────────────────────────────────

  private renderWithLayout(contentHtml: string, subject: string): string {
    return this.baseTemplate({
      subject,
      content: contentHtml,
      year: new Date().getFullYear(),
      unsubscribeUrl: `${this.config.get('CORS_ORIGIN', 'http://localhost:3000')}/settings/notifications`,
    });
  }

  // ── Retry Logic ───────────────────────────────────────

  private async sendWithRetry(
    mailOptions: nodemailer.SendMailOptions,
    retries = 3,
  ): Promise<void> {
    const backoffMs = [1000, 2000, 4000];

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.transporter.sendMail(mailOptions);
        return;
      } catch (error) {
        const isLastAttempt = attempt === retries - 1;

        this.logger.warn({
          message: 'Email send attempt failed',
          attempt: attempt + 1,
          to: mailOptions.to,
          subject: mailOptions.subject,
          error: error instanceof Error ? error.message : String(error),
        });

        if (isLastAttempt) {
          this.logger.error({
            message: 'Email send failed after all retries',
            to: mailOptions.to,
            subject: mailOptions.subject,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }

        await this.delay(backoffMs[attempt]);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── Existing Methods (preserved) ──────────────────────

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${this.config.get('CORS_ORIGIN')}/reset-password?token=${token}`;
    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to: email,
      subject: 'Reset your password - Social Bounty',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.config.get('CORS_ORIGIN')}/verify-email?token=${token}`;
    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to: email,
      subject: 'Verify your email - Social Bounty',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email address.</p>`,
    });
  }

  // ── Legacy method (kept for backward compatibility) ───

  async sendSubmissionStatusChange(
    email: string,
    bountyTitle: string,
    newStatus: string,
  ): Promise<void> {
    await this.sendSubmissionStatusEmail(email, {
      userName: 'Participant',
      bountyTitle,
      status: newStatus as SubmissionStatusEmailData['status'],
    });
  }

  // ── New Template-Based Methods ────────────────────────

  async sendSubmissionStatusEmail(
    to: string,
    data: SubmissionStatusEmailData,
  ): Promise<void> {
    const statusLabel = STATUS_LABELS[data.status] || data.status;
    const subject = `${STATUS_SUBJECTS[data.status] || 'Submission update'} - Social Bounty`;

    const contentHtml = this.submissionStatusTemplate({
      ...data,
      statusLabel,
    });
    const html = this.renderWithLayout(contentHtml, subject);

    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to,
      subject,
      html,
    });

    this.logger.log({
      message: 'Submission status email sent',
      to,
      bountyTitle: data.bountyTitle,
      status: data.status,
    });
  }

  async sendPayoutNotificationEmail(
    to: string,
    data: PayoutNotificationEmailData,
  ): Promise<void> {
    const subject = `Payout processed for "${data.bountyTitle}" - Social Bounty`;

    const contentHtml = this.payoutNotificationTemplate(data);
    const html = this.renderWithLayout(contentHtml, subject);

    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to,
      subject,
      html,
    });

    this.logger.log({
      message: 'Payout notification email sent',
      to,
      bountyTitle: data.bountyTitle,
      amount: data.amount,
      currency: data.currency,
    });
  }

  async sendBountyPublishedEmail(
    to: string,
    data: BountyPublishedEmailData,
  ): Promise<void> {
    const subject = `New bounty live: "${data.bountyTitle}" - Social Bounty`;

    const contentHtml = this.bountyPublishedTemplate(data);
    const html = this.renderWithLayout(contentHtml, subject);

    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to,
      subject,
      html,
    });

    this.logger.log({
      message: 'Bounty published email sent',
      to,
      bountyTitle: data.bountyTitle,
    });
  }
}
