import { RecommendationsController } from './recommendations.controller';

describe('RecommendationsController', () => {
  const user = { sub: 'user-1' } as never;

  function createController() {
    const recommendations = {
      listForUser: jest.fn().mockResolvedValue([]),
      refreshForUser: jest.fn().mockResolvedValue([]),
      refreshPlant: jest.fn().mockResolvedValue([]),
    };
    return {
      controller: new RecommendationsController(recommendations as never),
      recommendations,
    };
  }

  it('keeps GET read-only', async () => {
    const { controller, recommendations } = createController();

    await controller.findAll(user, 'plant-1');

    expect(recommendations.listForUser).toHaveBeenCalledWith('user-1', {
      plantId: 'plant-1',
    });
    expect(recommendations.refreshForUser).not.toHaveBeenCalled();
    expect(recommendations.refreshPlant).not.toHaveBeenCalled();
  });

  it('refreshes only through the explicit POST action', async () => {
    const { controller, recommendations } = createController();

    await controller.refresh(user);
    await controller.refresh(user, 'plant-1');

    expect(recommendations.refreshForUser).toHaveBeenCalledWith('user-1');
    expect(recommendations.refreshPlant).toHaveBeenCalledWith('user-1', 'plant-1');
  });
});
