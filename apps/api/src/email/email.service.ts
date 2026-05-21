import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';

export interface SendResult {
  success: boolean;
  skipped?: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {}

  private smtpPassword(): string {
    return (this.config.get<string>('SMTP_PASS') ?? '').trim().replace(/\s+/g, '');
  }

  isConfigured(): boolean {
    const user = this.config.get<string>('SMTP_USER')?.trim();
    return Boolean(user && this.smtpPassword());
  }

  onModuleInit() {
    if (!this.isConfigured()) {
      this.logger.warn(
        'SMTP not configured (SMTP_USER / SMTP_PASS). Verification and password-reset emails are skipped; new users are auto-verified in dev.',
      );
      return;
    }
    const transport = this.buildTransporter();
    transport.verify((err) => {
      if (err) {
        this.logger.error(`SMTP verify failed: ${err.message}`);
        this.logger.error(
          'Gmail: use an App Password (https://myaccount.google.com/apppasswords), not your account password.',
        );
      } else {
        this.logger.log(
          `SMTP ready (${this.config.get('SMTP_HOST', 'smtp.gmail.com')}:${this.config.get('SMTP_PORT', '587')})`,
        );
      }
      transport.close();
    });
  }

  private buildTransporter(): Transporter {
    const port = parseInt(this.config.get<string>('SMTP_PORT', '587'), 10);
    return nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: {
        user: this.config.get<string>('SMTP_USER')!.trim(),
        pass: this.smtpPassword(),
      },
    });
  }

  private fromAddress(): string {
    const configured = this.config.get<string>('EMAIL_FROM')?.trim();
    if (configured) return configured;
    const user = this.config.get<string>('SMTP_USER')!.trim();
    return `"Plant Care" <${user}>`;
  }

  private frontendUrl(path: string): string {
    const base = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '');
    return `${base}${path}`;
  }

  private async deliver(mail: nodemailer.SendMailOptions): Promise<SendResult> {
    if (!this.isConfigured()) {
      return { success: false, skipped: true, error: 'SMTP not configured' };
    }

    const transporter = this.buildTransporter();
    try {
      const info = await transporter.sendMail({
        from: this.fromAddress(),
        ...mail,
      });
      transporter.close();
      return { success: true, messageId: info.messageId };
    } catch (err) {
      transporter.close();
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Email send failed: ${message}`);
      return { success: false, error: message };
    }
  }

  async sendVerificationEmail(to: string, name: string | null, token: string): Promise<SendResult> {
    const url = this.frontendUrl(`/verify-email/${token}`);
    const greeting = name ? `Hi ${name},` : 'Hi,';
    return this.deliver({
      to,
      subject: 'Verify your Plant Care account',
      text: `${greeting}\n\nConfirm your email: ${url}\n\nThis link expires in 24 hours.`,
      html: this.wrapHtml(
        'Welcome to Plant Care',
        `
        <p>${greeting}</p>
        <p>Thanks for signing up. Please confirm your email address:</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${url}" style="${EmailService.buttonStyle}">Verify email</a>
        </p>
        <p style="font-size:13px;color:#666">Or copy this link:<br><a href="${url}">${url}</a></p>
        <p style="font-size:13px;color:#666">Expires in 24 hours. If you did not create an account, ignore this email.</p>
      `,
      ),
    });
  }

  async sendHouseholdInviteEmail(
    to: string,
    inviterName: string | null,
    gardenName: string,
    role: string,
    token: string,
  ): Promise<SendResult> {
    const url = this.frontendUrl(`/garden/household?invite=${encodeURIComponent(token)}`);
    const greeting = inviterName ? `${inviterName} invited you` : 'You have been invited';
    const roleLabel = role === 'VIEWER' ? 'viewer' : 'caregiver';
    return this.deliver({
      to,
      subject: `Join ${gardenName} on Plant Care`,
      text: `${greeting} to help with plants in "${gardenName}" as a ${roleLabel}.\n\nAccept invite: ${url}\n\nExpires in 7 days.`,
      html: this.wrapHtml(
        'Household invite',
        `
        <p>${greeting} to join <strong>${gardenName}</strong> as a <strong>${roleLabel}</strong>.</p>
        <p>Accept the invite to see shared plants and help with care tasks.</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${url}" style="${EmailService.buttonStyle}">Accept invite</a>
        </p>
        <p style="font-size:13px;color:#666">Or copy this link:<br><a href="${url}">${url}</a></p>
        <p style="font-size:13px;color:#666">Expires in 7 days.</p>
      `,
      ),
    });
  }

  async sendPasswordResetEmail(to: string, name: string | null, token: string): Promise<SendResult> {
    const url = this.frontendUrl(`/reset-password/${token}`);
    const greeting = name ? `Hi ${name},` : 'Hi,';
    return this.deliver({
      to,
      subject: 'Reset your Plant Care password',
      text: `${greeting}\n\nReset your password: ${url}\n\nExpires in 1 hour.`,
      html: this.wrapHtml(
        'Password reset',
        `
        <p>${greeting}</p>
        <p>We received a request to reset your password.</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${url}" style="${EmailService.buttonStyle}">Reset password</a>
        </p>
        <p style="font-size:13px;color:#666">Or copy this link:<br><a href="${url}">${url}</a></p>
        <p style="font-size:13px;color:#666"><strong>Expires in 1 hour.</strong> If you did not request this, ignore this email.</p>
      `,
      ),
    });
  }

  private static buttonStyle =
    'display:inline-block;padding:12px 28px;background:#047857;color:#fff;text-decoration:none;border-radius:8px;font-weight:600';

  private wrapHtml(title: string, body: string): string {
    const d = 'div';
    return [
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head>',
      `<body style="font-family:system-ui,Arial,sans-serif;line-height:1.6;color:#1f2937">`,
      `<${d} style="max-width:560px;margin:24px auto">`,
      `<${d} style="background:#047857;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center">`,
      `<h1 style="margin:0;font-size:22px">${title}</h1>`,
      `</${d}>`,
      `<${d} style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">`,
      body,
      `</${d}>`,
      `</${d}>`,
      '</body></html>',
    ].join('');
  }
}
