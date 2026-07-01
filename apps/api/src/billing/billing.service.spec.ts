import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  function createService(stripe?: Record<string, unknown>) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          planTier: PlanTier.FREE,
          stripeCustomerId: stripe ? 'cus_123' : null,
          identifyCountThisMonth: 2,
          identifyCountResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          _count: { plants: 4 },
          subscriptions: [],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      subscription: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    (prisma as { $transaction?: unknown }).$transaction = jest.fn((callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
    );
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        const values: Record<string, string> = {
          FRONTEND_URL: 'https://drplant.app',
          STRIPE_PRICE_ID_PREMIUM: 'price_123',
          PREMIUM_PRICE_LABEL: '$4.99/month',
          PREMIUM_TRIAL_DAYS: '14',
        };
        return values[key] ?? fallback;
      }),
    };
    const service = new BillingService(config as never, prisma as never);
    if (stripe) {
      (service as unknown as { stripe: unknown }).stripe = stripe;
    }
    return { service, prisma, config };
  }

  it('reports free usage and configured price text', async () => {
    const { service } = createService();

    await expect(service.getStatus('user-1')).resolves.toMatchObject({
      planTier: PlanTier.FREE,
      isPremium: false,
      usage: { plants: 4, identifications: 2 },
      limits: { plants: 5, identificationsPerWindow: 3, identifyWindowDays: 30 },
      priceLabel: '$4.99/month',
      trialDays: 14,
      canManageSubscription: false,
    });
  });

  it('requires Stripe for checkout', async () => {
    const { service } = createService();

    await expect(service.createCheckoutSession('user-1', 'user@example.com')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('creates checkout with a fourteen day trial', async () => {
    const stripe = {
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.test/session' }),
        },
      },
    };
    const { service } = createService(stripe);

    await expect(service.createCheckoutSession('user-1', 'user@example.com')).resolves.toEqual({
      url: 'https://checkout.stripe.test/session',
    });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_data: expect.objectContaining({ trial_period_days: 14 }),
      }),
    );
  });

  it('opens Stripe portal only when a customer exists', async () => {
    const stripe = {
      billingPortal: {
        sessions: {
          create: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.test/session' }),
        },
      },
    };
    const { service } = createService(stripe);

    await expect(service.createPortalSession('user-1')).resolves.toEqual({
      url: 'https://billing.stripe.test/session',
    });
  });

  it('rejects portal when there is no Stripe customer', async () => {
    const { service } = createService({
      billingPortal: { sessions: { create: jest.fn() } },
    });
    (service as unknown as { prisma: { user: { findUnique: jest.Mock } } }).prisma.user.findUnique.mockResolvedValue({
      stripeCustomerId: null,
    });

    await expect(service.createPortalSession('user-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('upserts active subscriptions and makes the user premium', async () => {
    const { service, prisma } = createService();

    await (service as unknown as { applySubscription: (subscription: unknown) => Promise<void> }).applySubscription({
      id: 'sub_123',
      status: 'trialing',
      metadata: { userId: 'user-1' },
      ended_at: null,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { planTier: PlanTier.PREMIUM },
    });
    expect(prisma.subscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stripeId: 'sub_123',
        status: SubscriptionStatus.TRIALING,
      }),
    });
  });

  it('downgrades canceled subscriptions to free', async () => {
    const { service, prisma } = createService();

    await (service as unknown as { applySubscription: (subscription: unknown) => Promise<void> }).applySubscription({
      id: 'sub_123',
      status: 'canceled',
      metadata: { userId: 'user-1' },
      ended_at: 1780160000,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { planTier: PlanTier.FREE },
    });
  });

  it('re-syncs plan tier from Stripe when a renewal invoice payment fails', async () => {
    const stripe = {
      subscriptions: {
        retrieve: jest.fn().mockResolvedValue({
          id: 'sub_123',
          status: 'past_due',
          metadata: { userId: 'user-1' },
          ended_at: null,
        }),
      },
    };
    const { service, prisma } = createService(stripe);

    await (
      service as unknown as {
        handlePaymentFailed: (invoice: unknown) => Promise<void>;
      }
    ).handlePaymentFailed({ id: 'in_1', subscription: 'sub_123' });

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { planTier: PlanTier.FREE },
    });
    expect(prisma.subscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stripeId: 'sub_123',
        status: SubscriptionStatus.PAST_DUE,
      }),
    });
  });

  it('routes invoice.payment_failed webhook events to the payment-failed handler', async () => {
    const invoice = { id: 'in_1', subscription: 'sub_123' };
    const stripe = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({
          type: 'invoice.payment_failed',
          data: { object: invoice },
        }),
      },
      subscriptions: {
        retrieve: jest.fn().mockResolvedValue({
          id: 'sub_123',
          status: 'past_due',
          metadata: { userId: 'user-1' },
          ended_at: null,
        }),
      },
    };
    const { service, prisma, config } = createService(stripe);
    config.get.mockImplementation(
      (key: string, fallback?: string) =>
        (key === 'STRIPE_WEBHOOK_SECRET' ? 'whsec_test' : fallback) as string,
    );

    await service.handleWebhook(Buffer.from('{}'), 'sig_test');

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { planTier: PlanTier.FREE },
    });
  });

  it('does nothing when a payment-failed invoice has no subscription', async () => {
    const stripe = { subscriptions: { retrieve: jest.fn() } };
    const { service } = createService(stripe);

    await (
      service as unknown as {
        handlePaymentFailed: (invoice: unknown) => Promise<void>;
      }
    ).handlePaymentFailed({ id: 'in_1', subscription: null });

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });
});
