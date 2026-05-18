import { plantsSharedWithUser } from './household';
import type { GardenSummary } from '../services/api';

describe('plantsSharedWithUser', () => {
  const gardens: GardenSummary[] = [
    {
      id: 'g1',
      name: 'Home',
      ownerId: 'owner',
      members: [
        { id: 'm1', userId: 'owner', role: 'OWNER' },
        { id: 'm2', userId: 'me', role: 'CAREGIVER' },
      ],
      plants: [
        {
          id: 's1',
          plantId: 'p1',
          canComplete: true,
          canJournal: false,
          plant: {
            id: 'p1',
            userId: 'owner',
            nickname: 'Monstera',
            species: {
              commonName: 'Monstera',
              wateringFreqDays: 7,
            },
          },
        },
      ],
    },
    {
      id: 'g2',
      name: 'My place',
      ownerId: 'me',
      members: [{ id: 'm3', userId: 'me', role: 'OWNER' }],
      plants: [],
    },
  ];

  it('returns plants from gardens owned by others', () => {
    const shared = plantsSharedWithUser(gardens, 'me');
    expect(shared).toHaveLength(1);
    expect(shared[0].nickname).toBe('Monstera');
    expect(shared[0].gardenName).toBe('Home');
    expect(shared[0].shared).toBe(true);
  });

  it('skips gardens the user owns', () => {
    expect(plantsSharedWithUser(gardens, 'owner')).toHaveLength(0);
  });
});
