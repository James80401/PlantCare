import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { effectivePlanTier, premiumPriceLabel, premiumTrialDays } from '../config/premium-policy';
import { freePlanLimits, IDENTIFY_WINDOW_DAYS } from './billing-limits';

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
      throw new ServiceUnavailableException('Stripe is not configured');
    }

    const priceId = this.config.get<string>('STRIPE_PRICE_ID_PREMIUM');
    if (!priceId) throw new ServiceUnavailableException('Stripe premium price is not configured');

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
      subscription_data: {
        metadata: { userId },
        trial_period_days: premiumTrialDays(this.config),
      },
    });

    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer found for this account');
    }
    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.config.get('FRONTEND_URL')}/garden/subscription`,
    });
    return { url: session.url };
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        planTier: true,
        stripeCustomerId: true,
        identifyCountThisMonth: true,
        identifyCountResetAt: true,
        _count: { select: { plants: true } },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            planName: true,
            status: true,
            stripeId: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          },
        },
      },
    });
    if (!user) throw new BadRequestException('User not found');

    const planTier = effectivePlanTier(this.config, user.planTier);
    const now = new Date();
    const identifyResetAt =
      user.identifyCountResetAt <= now
        ? new Date(now.getTime() + IDENTIFY_WINDOW_DAYS * 24 * 60 * 60 * 1000)
        : user.identifyCountResetAt;
    const identifyCount = user.identifyCountResetAt <= now ? 0 : user.identifyCountThisMonth;

    return {
      planTier,
      isPremium: planTier === PlanTier.PREMIUM,
      subscription: user.subscriptions[0] ?? null,
      limits: freePlanLimits(),
      usage: {
        plants: user._count.plants,
        identifications: identifyCount,
        identifyResetAt,
      },
      priceLabel: premiumPriceLabel(this.config),
      trialDays: premiumTrialDays(this.config),
      canManageSubscription: Boolean(this.stripe && user.stripeCustomerId),
    };
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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && typeof session.customer === 'string') {
        await this.prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: session.customer },
        });
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await this.applySubscription(event.data.object as Stripe.Subscription);
    }

    if (event.type === 'invoice.payment_failed') {
      await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
    }
  }

  /**
   * A failed renewal invoice doesn't always arrive with a corresponding
   * customer.subscription.updated event in the same instant (Stripe's dunning/retry
   * settings can delay the subscription's own status transition), so re-fetch and
   * reapply the subscription here too rather than assuming another event will cover it.
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId =
      typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    if (!subscriptionId || !this.stripe) return;

    this.logger.warn(
      `Stripe invoice payment failed for subscription ${subscriptionId} (invoice ${invoice.id})`,
    );

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    await this.applySubscription(subscription);
  }

  private async applySubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const active = subscription.status === 'active' || subscription.status === 'trialing';
    const status = this.mapSubscriptionStatus(subscription.status);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { planTier: active ? PlanTier.PREMIUM : PlanTier.FREE },
      });

      const existing = await tx.subscription.findFirst({
        where: { stripeId: subscription.id },
      });
      const data = {
        userId,
        planName: 'premium',
        status,
        stripeId: subscription.id,
        endDate: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
      };
      if (existing) {
        await tx.subscription.update({ where: { id: existing.id }, data });
      } else {
        await tx.subscription.create({ data });
      }
    });
  }

  private mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    if (status === 'active') return SubscriptionStatus.ACTIVE;
    if (status === 'trialing') return SubscriptionStatus.TRIALING;
    if (status === 'canceled') return SubscriptionStatus.CANCELED;
    return SubscriptionStatus.PAST_DUE;
  }
}
