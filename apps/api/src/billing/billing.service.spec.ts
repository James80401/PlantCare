import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  function createService(
    stripe?: Record<string, unknown>,
    billingEnabled = true,
  ) {
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
          ENABLE_PREMIUM_BILLING: String(billingEnabled),
          STRIPE_WEBHOOK_SECRET: 'whsec_test',
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
      billingEnabled: true,
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

  it('keeps checkout, portal, and webhooks hidden behind the server gate', async () => {
    const { service } = createService(undefined, false);

    await expect(
      service.createCheckoutSession('user-1', 'user@example.com'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.createPortalSession('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig_test'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getStatus('user-1')).resolves.toMatchObject({
      billingEnabled: false,
      canManageSubscription: false,
    });
  });

  it('cancels every live Stripe subscription before account deletion', async () => {
    const stripe = {
      subscriptions: {
        list: jest.fn().mockResolvedValue({
          data: [
            { id: 'sub_active', status: 'active' },
            { id: 'sub_trial', status: 'trialing' },
            { id: 'sub_done', status: 'canceled' },
          ],
        }),
        cancel: jest.fn().mockResolvedValue({}),
      },
    };
    const { service } = createService(stripe);

    await expect(
      service.stopSubscriptionsForAccountDeletion('user-1'),
    ).resolves.toEqual({ canceled: 2 });
    expect(stripe.subscriptions.cancel).toHaveBeenCalledTimes(2);
    expect(stripe.subscriptions.cancel).toHaveBeenNthCalledWith(1, 'sub_active');
    expect(stripe.subscriptions.cancel).toHaveBeenNthCalledWith(2, 'sub_trial');
  });

  it('paginates Stripe subscriptions so account deletion cannot leave later charges active', async () => {
    const stripe = {
      subscriptions: {
        list: jest
          .fn()
          .mockResolvedValueOnce({
            data: [{ id: 'sub_page_1', status: 'active' }],
            has_more: true,
          })
          .mockResolvedValueOnce({
            data: [{ id: 'sub_page_2', status: 'past_due' }],
            has_more: false,
          }),
        cancel: jest.fn().mockResolvedValue({}),
      },
    };
    const { service } = createService(stripe);

    await expect(
      service.stopSubscriptionsForAccountDeletion('user-1'),
    ).resolves.toEqual({ canceled: 2 });

    expect(stripe.subscriptions.list).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ starting_after: 'sub_page_1' }),
    );
    expect(stripe.subscriptions.cancel).toHaveBeenCalledTimes(2);
  });

  it('blocks account deletion when a Stripe customer exists but billing is unavailable', async () => {
    const { service } = createService();
    (service as unknown as { prisma: { user: { findUnique: jest.Mock } } })
      .prisma.user.findUnique.mockResolvedValue({ stripeCustomerId: 'cus_live' });

    await expect(
      service.stopSubscriptionsForAccountDeletion('user-1'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
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
        success_url: 'https://drplant.app/subscription?success=1',
        cancel_url: 'https://drplant.app/subscription?canceled=1',
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
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_123',
      return_url: 'https://drplant.app/garden/subscription',
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
    const { service, prisma } = createService(stripe);

    await service.handleWebhook(Buffer.from('{}'), 'sig_test');

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { planTier: PlanTier.FREE },
    });
  });

  it('rejects an invalid webhook signature', async () => {
    const stripe = {
      webhooks: {
        constructEvent: jest.fn(() => {
          throw new Error('No signatures found');
        }),
      },
    };
    const { service } = createService(stripe);

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'bad-signature'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fails closed when webhook verification is not configured', async () => {
    const stripe = {
      webhooks: { constructEvent: jest.fn() },
    };
    const { service, config } = createService(stripe);
    config.get.mockImplementation((key: string, fallback?: string) => {
      if (key === 'ENABLE_PREMIUM_BILLING') return 'true';
      if (key === 'STRIPE_WEBHOOK_SECRET') return '';
      return fallback ?? '';
    });

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig_test'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it('applies repeated subscription events without creating duplicates', async () => {
    const subscription = {
      id: 'sub_repeat',
      status: 'active',
      metadata: { userId: 'user-1' },
      ended_at: null,
    };
    const stripe = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({
          type: 'customer.subscription.updated',
          data: { object: subscription },
        }),
      },
    };
    const { service, prisma } = createService(stripe);
    prisma.subscription.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'subscription-row-1' });

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig_test'),
    ).resolves.toEqual({ received: true });
    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig_test'),
    ).resolves.toEqual({ received: true });

    expect(prisma.subscription.create).toHaveBeenCalledTimes(1);
    expect(prisma.subscription.update).toHaveBeenCalledTimes(1);
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'subscription-row-1' },
      data: expect.objectContaining({ stripeId: 'sub_repeat' }),
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
