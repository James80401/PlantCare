import {
  canCompleteSharedTask,
  canDeleteCommunityPost,
  canJournalSharedPlant,
  canManageGarden,
  canViewGarden,
} from './garden-authz';

describe('garden authz', () => {
  it('OWNER can manage and complete', () => {
    expect(canManageGarden('OWNER')).toBe(true);
    expect(canViewGarden('OWNER')).toBe(true);
    expect(canCompleteSharedTask('OWNER', { canComplete: false })).toBe(true);
  });

  it('CAREGIVER completes only when PlantShare allows', () => {
    expect(canManageGarden('CAREGIVER')).toBe(false);
    expect(canViewGarden('CAREGIVER')).toBe(true);
    expect(canCompleteSharedTask('CAREGIVER', { canComplete: true })).toBe(true);
    expect(canCompleteSharedTask('CAREGIVER', { canComplete: false })).toBe(false);
  });

  it('VIEWER is read-only', () => {
    expect(canViewGarden('VIEWER')).toBe(true);
    expect(canCompleteSharedTask('VIEWER', { canComplete: true })).toBe(false);
    expect(canJournalSharedPlant('VIEWER', { canJournal: true })).toBe(false);
  });

  it('CAREGIVER journals only when allowed', () => {
    expect(canJournalSharedPlant('CAREGIVER', { canJournal: true })).toBe(true);
    expect(canJournalSharedPlant('CAREGIVER', { canJournal: false })).toBe(false);
  });

  it('author can delete own community post', () => {
    expect(canDeleteCommunityPost('user-a', 'user-a')).toBe(true);
    expect(canDeleteCommunityPost('user-a', 'user-b')).toBe(false);
  });
});
