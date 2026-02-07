import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

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

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${this.config.get('CORS_ORIGIN')}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to: email,
      subject: 'Reset your password - Social Bounty',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.config.get('CORS_ORIGIN')}/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to: email,
      subject: 'Verify your email - Social Bounty',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email address.</p>`,
    });
  }

  async sendSubmissionStatusChange(
    email: string,
    bountyTitle: string,
    newStatus: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@socialbounty.com'),
      to: email,
      subject: `Submission update: ${bountyTitle} - Social Bounty`,
      html: `<p>Your submission for "<strong>${bountyTitle}</strong>" has been updated to: <strong>${newStatus}</strong>.</p>`,
    });
  }
}
