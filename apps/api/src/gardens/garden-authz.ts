export type GardenRole = 'OWNER' | 'CAREGIVER' | 'VIEWER';

export function parseGardenRole(role: string): GardenRole | null {
  if (role === 'OWNER' || role === 'CAREGIVER' || role === 'VIEWER') return role;
  return null;
}

export function canManageGarden(role: GardenRole) {
  return role === 'OWNER';
}

export function canViewGarden(role: GardenRole) {
  return role === 'OWNER' || role === 'CAREGIVER' || role === 'VIEWER';
}

export function canCompleteSharedTask(
  role: GardenRole,
  share: { canComplete: boolean } | null | undefined,
) {
  if (role === 'OWNER') return true;
  if (role === 'VIEWER') return false;
  return Boolean(share?.canComplete);
}

export function canJournalSharedPlant(
  role: GardenRole,
  share: { canJournal: boolean } | null | undefined,
) {
  if (role === 'OWNER') return true;
  if (role === 'VIEWER') return false;
  return Boolean(share?.canJournal);
}

export function canDeleteCommunityPost(authorId: string, userId: string) {
  return authorId === userId;
}
