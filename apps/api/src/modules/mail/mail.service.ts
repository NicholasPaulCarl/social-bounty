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

/**
 * Data required for the "your bounty is live" transactional email.
 * Sent to each brand admin (BrandMember) whose own bounty just transitioned
 * DRAFT → LIVE — either automatically via the TradeSafe FUNDS_RECEIVED
 * webhook or via a manual super-admin status flip. Per INCIDENT-RESPONSE.md
 * §5.7 this stays addressed to the recipient about an account-state change
 * they (or the system on their behalf) caused; it is not broadcast and is
 * not direct marketing.
 */
export interface BountyPublishedEmailData {
  firstName: string;
  bountyTitle: string;
  shortDescription: string;
  rewardValue: string;
  currency: string;
  bountyUrl?: string;
}

/** Data required for post-removed (visibility auto-refund) brand emails */
export interface PostRemovedBrandEmailData {
  brandName: string;
  hunterName: string;
  bountyTitle: string;
  visibilityRule: string;
  failureReason: string;
  consecutiveFailures: number;
  actionUrl?: string;
}

/** Data required for post-removed (visibility auto-refund) hunter emails */
export interface PostRemovedHunterEmailData {
  userName: string;
  bountyTitle: string;
  visibilityRule: string;
  failureReason: string;
  actionUrl?: string;
}

/**
 * Data required for the first-failure visibility warning sent to the
 * hunter. Distinct from PostRemovedHunterEmailData because the messaging
 * is "we noticed an issue, please check" rather than "we issued a
 * refund". Sent on the 0→1 transition of consecutiveVisibilityFailures
 * by the SubmissionVisibilityScheduler (Phase 3A, ADR 0010 §2).
 */
export interface PostVisibilityWarningHunterEmailData {
  hunterName: string;
  bountyTitle: string;
  channel: string;
  url: string;
  errorMessage: string;
  actionUrl?: string;
}

/** Data required for dispute-opened emails */
export interface DisputeOpenedEmailData {
  disputeNumber: string;
  category: string;
  description: string;
  bountyTitle: string;
  disputeUrl: string;
}

/** Data required for dispute-status-change emails */
export interface DisputeStatusChangeEmailData {
  disputeNumber: string;
  oldStatus: string;
  newStatus: string;
  bountyTitle: string;
  disputeUrl: string;
}

/** Data required for dispute-resolved emails */
export interface DisputeResolvedEmailData {
  disputeNumber: string;
  resolution: string;
  resolutionSummary: string;
  bountyTitle: string;
  disputeUrl: string;
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
  private otpTemplate!: Handlebars.TemplateDelegate;
  private submissionStatusTemplate!: Handlebars.TemplateDelegate;
  private payoutNotificationTemplate!: Handlebars.TemplateDelegate;
  private bountyPublishedTemplate!: Handlebars.TemplateDelegate;
  private postRemovedBrandTemplate!: Handlebars.TemplateDelegate;
  private postRemovedHunterTemplate!: Handlebars.TemplateDelegate;
  private postVisibilityWarningHunterTemplate!: Handlebars.TemplateDelegate;

  constructor(private config: ConfigService) {
    const port = this.config.get<number>('SMTP_PORT', 1025);
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', 'localhost'),
      port,
      secure: port === 465,
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
    this.verifySmtpConnection();
  }

  /**
   * Probe the SMTP transport at boot so misconfiguration fails loudly in
   * deploy logs instead of silently on the first send. We log instead of
   * throwing because:
   *   - dev environments routinely run without SMTP (the Mailpit default
   *     is fine); crashing boot would block local work.
   *   - in prod, OTP sends are fire-and-forget (auth.service.ts:123) so
   *     a silent SMTP failure surfaces as "users never receive the OTP",
   *     which is exactly the failure mode we want a loud signal for.
   *
   * Verification is async and non-blocking — we don't await it in
   * `onModuleInit` so a slow SMTP host can't delay app boot. The verify
   * call itself has a built-in 10s timeout in nodemailer's defaults.
   */
  private verifySmtpConnection(): void {
    const host = this.config.get<string>('SMTP_HOST', 'localhost');
    const port = this.config.get<number>('SMTP_PORT', 1025);
    const hasAuth = Boolean(this.config.get('SMTP_USER'));

    this.transporter
      .verify()
      .then(() => {
        this.logger.log({
          message: 'SMTP transport verified at boot',
          host,
          port,
          authenticated: hasAuth,
        });
      })
      .catch((error) => {
        this.logger.error({
          message:
            'SMTP transport verification FAILED at boot — emails will not send. ' +
            'Check SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS env vars.',
          host,
          port,
          authenticated: hasAuth,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }

  // ── Template Loading ──────────────────────────────────

  private loadTemplates(): void {
    const templatesDir = path.join(__dirname, 'templates');

    this.baseTemplate = this.compileTemplate(templatesDir, 'base.hbs');
    this.otpTemplate = this.compileTemplate(templatesDir, 'otp.hbs');
    this.submissionStatusTemplate = this.compileTemplate(templatesDir, 'submission-status.hbs');
    this.payoutNotificationTemplate = this.compileTemplate(templatesDir, 'payout-notification.hbs');
    this.bountyPublishedTemplate = this.compileTemplate(templatesDir, 'bounty-published.hbs');
    this.postRemovedBrandTemplate = this.compileTemplate(templatesDir, 'post-removed-brand.hbs');
    this.postRemovedHunterTemplate = this.compileTemplate(templatesDir, 'post-removed-hunter.hbs');
    this.postVisibilityWarningHunterTemplate = this.compileTemplate(
      templatesDir,
      'post-visibility-warning-hunter.hbs',
    );

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

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const subject = 'Your verification code - Social Bounty';
    const contentHtml = this.otpTemplate({ otp });
    const html = this.renderWithLayout(contentHtml, subject);

    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to: email,
      subject,
      html,
    });

    this.logger.log({
      message: 'OTP email sent',
      to: email,
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
    const subject = `Your bounty is live: "${data.bountyTitle}" - Social Bounty`;

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

  // ── Post-Removed (visibility auto-refund) Email Methods ──

  async sendPostRemovedBrandEmail(
    to: string,
    data: PostRemovedBrandEmailData,
  ): Promise<void> {
    const subject = `Auto-refund issued for "${data.bountyTitle}" — post no longer accessible - Social Bounty`;
    const contentHtml = this.postRemovedBrandTemplate(data);
    const html = this.renderWithLayout(contentHtml, subject);

    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to,
      subject,
      html,
    });

    this.logger.log({
      message: 'Post-removed (brand) email sent',
      to,
      bountyTitle: data.bountyTitle,
    });
  }

  async sendPostRemovedHunterEmail(
    to: string,
    data: PostRemovedHunterEmailData,
  ): Promise<void> {
    const subject = `Your submission for "${data.bountyTitle}" was auto-refunded - Social Bounty`;
    const contentHtml = this.postRemovedHunterTemplate(data);
    const html = this.renderWithLayout(contentHtml, subject);

    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to,
      subject,
      html,
    });

    this.logger.log({
      message: 'Post-removed (hunter) email sent',
      to,
      bountyTitle: data.bountyTitle,
    });
  }

  /**
   * First-failure hunter notification (ADR 0010 §2). Fired by the
   * SubmissionVisibilityScheduler on the 0→1 transition of
   * `consecutiveVisibilityFailures` to give the hunter ~6h to confirm
   * their post is still live before the second tick triggers an
   * auto-refund. Brand is intentionally NOT notified here — the noise
   * case (one bad scrape) shouldn't reach their inbox.
   */
  async sendPostVisibilityWarningHunterEmail(
    to: string,
    data: PostVisibilityWarningHunterEmailData,
  ): Promise<void> {
    const subject = `We couldn't reach your post for "${data.bountyTitle}" - Social Bounty`;
    const contentHtml = this.postVisibilityWarningHunterTemplate(data);
    const html = this.renderWithLayout(contentHtml, subject);

    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to,
      subject,
      html,
    });

    this.logger.log({
      message: 'Post-visibility warning (hunter) email sent',
      to,
      bountyTitle: data.bountyTitle,
      channel: data.channel,
    });
  }

  // ── Dispute Email Methods ─────────────────────────────

  async sendDisputeOpenedEmail(
    to: string,
    data: DisputeOpenedEmailData,
  ): Promise<void> {
    const subject = `Dispute ${data.disputeNumber} opened for "${data.bountyTitle}" - Social Bounty`;
    const frontendUrl = this.config.get('CORS_ORIGIN', 'http://localhost:3000');
    const fullUrl = `${frontendUrl}${data.disputeUrl}`;

    const html = `
      <h2>Dispute Opened: ${data.disputeNumber}</h2>
      <p>A new dispute has been filed regarding the bounty <strong>${data.bountyTitle}</strong>.</p>
      <p><strong>Category:</strong> ${data.category.replace(/_/g, ' ')}</p>
      <p><strong>Description:</strong></p>
      <p>${data.description.substring(0, 500)}${data.description.length > 500 ? '...' : ''}</p>
      <p><a href="${fullUrl}" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">View Dispute</a></p>
    `;

    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to,
      subject,
      html,
    });

    this.logger.log({
      message: 'Dispute opened email sent',
      to,
      disputeNumber: data.disputeNumber,
    });
  }

  async sendDisputeStatusChangeEmail(
    to: string,
    data: DisputeStatusChangeEmailData,
  ): Promise<void> {
    const subject = `Dispute ${data.disputeNumber} status updated - Social Bounty`;
    const frontendUrl = this.config.get('CORS_ORIGIN', 'http://localhost:3000');
    const fullUrl = `${frontendUrl}${data.disputeUrl}`;

    const html = `
      <h2>Dispute Status Update: ${data.disputeNumber}</h2>
      <p>The status of your dispute for bounty <strong>${data.bountyTitle}</strong> has changed.</p>
      <p><strong>Previous Status:</strong> ${data.oldStatus.replace(/_/g, ' ')}</p>
      <p><strong>New Status:</strong> ${data.newStatus.replace(/_/g, ' ')}</p>
      <p><a href="${fullUrl}" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">View Dispute</a></p>
    `;

    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to,
      subject,
      html,
    });

    this.logger.log({
      message: 'Dispute status change email sent',
      to,
      disputeNumber: data.disputeNumber,
      newStatus: data.newStatus,
    });
  }

  async sendDisputeResolvedEmail(
    to: string,
    data: DisputeResolvedEmailData,
  ): Promise<void> {
    const subject = `Dispute ${data.disputeNumber} resolved - Social Bounty`;
    const frontendUrl = this.config.get('CORS_ORIGIN', 'http://localhost:3000');
    const fullUrl = `${frontendUrl}${data.disputeUrl}`;

    const html = `
      <h2>Dispute Resolved: ${data.disputeNumber}</h2>
      <p>The dispute for bounty <strong>${data.bountyTitle}</strong> has been resolved.</p>
      <p><strong>Resolution:</strong> ${data.resolution.replace(/_/g, ' ')}</p>
      <p><strong>Summary:</strong></p>
      <p>${data.resolutionSummary}</p>
      <p><a href="${fullUrl}" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">View Dispute</a></p>
    `;

    await this.sendWithRetry({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to,
      subject,
      html,
    });

    this.logger.log({
      message: 'Dispute resolved email sent',
      to,
      disputeNumber: data.disputeNumber,
      resolution: data.resolution,
    });
  }
}
