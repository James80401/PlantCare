import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  it('passes the authenticated user and optional date range to the dashboard service', async () => {
    const dashboard = {
      getDashboard: jest.fn().mockResolvedValue({ greeting: { name: 'Maya' } }),
    };
    const controller = new DashboardController(dashboard as never);
    const user = { sub: 'user-1', email: 'maya@example.com', planTier: 'PREMIUM' };

    const result = await controller.getDashboard(user, '2026-06-01', '2026-06-07');

    expect(result).toEqual({ greeting: { name: 'Maya' } });
    expect(dashboard.getDashboard).toHaveBeenCalledWith(
      'user-1',
      '2026-06-01',
      '2026-06-07',
    );
  });
});
