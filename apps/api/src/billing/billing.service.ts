import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) this.stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  }

  async createCheckoutSession(userId: string, email: string) {
    if (!this.stripe) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { planTier: PlanTier.PREMIUM },
      });
      await this.prisma.subscription.create({
        data: {
          userId,
          planName: 'premium',
          status: SubscriptionStatus.ACTIVE,
          stripeId: 'demo',
        },
      });
      return { url: `${this.config.get('FRONTEND_URL')}/subscription?demo=1` };
    }

    const priceId = this.config.get<string>('STRIPE_PRICE_ID_PREMIUM');
    if (!priceId) throw new Error('STRIPE_PRICE_ID_PREMIUM not configured');

    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({ email, metadata: { userId } });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get('FRONTEND_URL')}/subscription?success=1`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/subscription?canceled=1`,
      metadata: { userId },
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) return;

    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) return;

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      this.logger.warn(`Webhook signature failed: ${err}`);
      return;
    }

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const session = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;
      const userId =
        (session as Stripe.Checkout.Session).metadata?.userId ||
        (session as Stripe.Subscription).metadata?.userId;
      if (userId) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { planTier: PlanTier.PREMIUM },
        });
        await this.prisma.subscription.create({
          data: {
            userId,
            planName: 'premium',
            status: SubscriptionStatus.ACTIVE,
            stripeId: (session as { id: string }).id,
          },
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { planTier: PlanTier.FREE },
        });
      }
    }
  }
}
