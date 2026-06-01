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

  describe('home-garden membership (garden-as-container)', () => {
    const homePlant = {
      userId: 'owner',
      garden: { members: [{ userId: 'partner', role: 'CAREGIVER' }] },
      shares: [],
    };

    it('a caretaker in the plant home garden can view and complete', () => {
      expect(userCanViewPlantTasks('partner', homePlant)).toBe(true);
      expect(userCanCompletePlantTask('partner', homePlant)).toBe(true);
    });

    it('a viewer in the home garden can view but not complete', () => {
      const viewerHome = {
        userId: 'owner',
        garden: { members: [{ userId: 'guest', role: 'VIEWER' }] },
        shares: [],
      };
      expect(userCanViewPlantTasks('guest', viewerHome)).toBe(true);
      expect(userCanCompletePlantTask('guest', viewerHome)).toBe(false);
    });

    it('a non-member of the home garden has no access', () => {
      expect(userCanViewPlantTasks('stranger', homePlant)).toBe(false);
      expect(userCanCompletePlantTask('stranger', homePlant)).toBe(false);
    });
  });
});
