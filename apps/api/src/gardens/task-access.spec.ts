import { userCanCompletePlantTask, userCanViewPlantTasks } from './task-access';

describe('shared task access', () => {
  const plant = {
    userId: 'owner',
    shares: [
      {
        canComplete: true,
        garden: {
          members: [{ userId: 'caregiver', role: 'CAREGIVER' }],
        },
      },
    ],
  };

  it('owner always has access', () => {
    expect(userCanViewPlantTasks('owner', plant)).toBe(true);
    expect(userCanCompletePlantTask('owner', plant)).toBe(true);
  });

  it('caregiver with canComplete can complete', () => {
    expect(userCanViewPlantTasks('caregiver', plant)).toBe(true);
    expect(userCanCompletePlantTask('caregiver', plant)).toBe(true);
  });

  it('viewer cannot complete', () => {
    const viewerPlant = {
      ...plant,
      shares: [
        {
          canComplete: true,
          garden: { members: [{ userId: 'viewer', role: 'VIEWER' }] },
        },
      ],
    };
    expect(userCanViewPlantTasks('viewer', viewerPlant)).toBe(true);
    expect(userCanCompletePlantTask('viewer', viewerPlant)).toBe(false);
  });
});
