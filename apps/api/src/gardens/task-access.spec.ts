import {
  userCanCompletePlantTask,
  userCanJournalPlant,
  userCanViewPlantTasks,
} from './task-access';

describe('shared task access', () => {
  const plant = {
    userId: 'owner',
    shares: [
      {
        canComplete: true,
        canJournal: false,
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
          canJournal: false,
          garden: { members: [{ userId: 'viewer', role: 'VIEWER' }] },
        },
      ],
    };
    expect(userCanViewPlantTasks('viewer', viewerPlant)).toBe(true);
    expect(userCanCompletePlantTask('viewer', viewerPlant)).toBe(false);
  });

  describe('shared-plant journal access', () => {
    it('caregiver cannot journal without canJournal grant', () => {
      expect(userCanJournalPlant('caregiver', plant)).toBe(false);
    });

    it('caregiver can journal once canJournal is granted', () => {
      const grantedPlant = {
        ...plant,
        shares: [{ ...plant.shares[0], canJournal: true }],
      };
      expect(userCanJournalPlant('caregiver', grantedPlant)).toBe(true);
    });

    it('viewer can never journal, even with canJournal set', () => {
      const viewerPlant = {
        ...plant,
        shares: [
          {
            canComplete: true,
            canJournal: true,
            garden: { members: [{ userId: 'viewer', role: 'VIEWER' }] },
          },
        ],
      };
      expect(userCanJournalPlant('viewer', viewerPlant)).toBe(false);
    });

    it('owner always can journal', () => {
      expect(userCanJournalPlant('owner', plant)).toBe(true);
    });
  });

  describe('home-garden membership (garden-as-container)', () => {
    const homePlant = {
      userId: 'owner',
      garden: { members: [{ userId: 'partner', role: 'CAREGIVER' }] },
      shares: [],
    };

    it('a caretaker in the plant home garden can view, complete, and journal', () => {
      expect(userCanViewPlantTasks('partner', homePlant)).toBe(true);
      expect(userCanCompletePlantTask('partner', homePlant)).toBe(true);
      expect(userCanJournalPlant('partner', homePlant)).toBe(true);
    });

    it('a viewer in the home garden can view but not complete or journal', () => {
      const viewerHome = {
        userId: 'owner',
        garden: { members: [{ userId: 'guest', role: 'VIEWER' }] },
        shares: [],
      };
      expect(userCanViewPlantTasks('guest', viewerHome)).toBe(true);
      expect(userCanCompletePlantTask('guest', viewerHome)).toBe(false);
      expect(userCanJournalPlant('guest', viewerHome)).toBe(false);
    });

    it('a non-member of the home garden has no access', () => {
      expect(userCanViewPlantTasks('stranger', homePlant)).toBe(false);
      expect(userCanCompletePlantTask('stranger', homePlant)).toBe(false);
    });
  });
});
