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
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
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
    return `"Dr. Plant" <${user}>`;
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
        headers: {
          // SendGrid click tracking rewrites auth links through a branded tracking
          // domain. Keep verification/reset links direct so TLS must match drplant.app.
          'X-SMTPAPI': JSON.stringify({
            filters: {
              clicktrack: { settings: { enable: 0 } },
            },
          }),
          ...mail.headers,
        },
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
      subject: 'Verify your Dr. Plant account',
      text: `${greeting}\n\nConfirm your email: ${url}\n\nThis link expires in 24 hours.`,
      html: this.wrapHtml(
        'Welcome to Dr. Plant',
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
      subject: `Join ${gardenName} on Dr. Plant`,
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

  async sendAdminRegistrationPendingEmail(
    adminTo: string,
    registrantEmail: string,
    registrantName: string | null,
  ): Promise<SendResult> {
    const reviewUrl = this.frontendUrl('/admin/registrations');
    const who = registrantName ? `${registrantName} (${registrantEmail})` : registrantEmail;
    return this.deliver({
      to: adminTo,
      subject: 'Dr. Plant — new registration awaiting approval',
      text: `A user completed email verification and needs approval:\n${who}\n\nReview: ${reviewUrl}`,
      html: this.wrapHtml(
        'Registration pending',
        `
        <p>A user completed email verification and is waiting for admin approval:</p>
        <p><strong>${who}</strong></p>
        <p style="text-align:center;margin:24px 0">
          <a href="${reviewUrl}" style="${EmailService.buttonStyle}">Review registrations</a>
        </p>
      `,
      ),
    });
  }

  async sendAccountApprovedEmail(to: string, name: string | null): Promise<SendResult> {
    const loginUrl = this.frontendUrl('/login');
    const greeting = name ? `Hi ${name},` : 'Hi,';
    return this.deliver({
      to,
      subject: 'Your Dr. Plant account is approved',
      text: `${greeting}\n\nYour account was approved. You can sign in now: ${loginUrl}`,
      html: this.wrapHtml(
        'Account approved',
        `
        <p>${greeting}</p>
        <p>Your Dr. Plant account was approved. You can sign in and start using the app.</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${loginUrl}" style="${EmailService.buttonStyle}">Sign in</a>
        </p>
      `,
      ),
    });
  }

  async sendPasswordResetEmail(to: string, name: string | null, token: string): Promise<SendResult> {
    const url = this.frontendUrl(`/reset-password/${token}`);
    const greeting = name ? `Hi ${name},` : 'Hi,';
    return this.deliver({
      to,
      subject: 'Reset your Dr. Plant password',
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

  async sendNotificationEmail(
    to: string,
    subject: string,
    text: string,
  ): Promise<SendResult> {
    const escapedText = text
      .split('\n')
      .map((line) => this.escapeHtml(line))
      .join('<br>');
    return this.deliver({
      to,
      subject,
      text,
      html: this.wrapHtml(subject, `<p>${escapedText}</p>`),
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

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
