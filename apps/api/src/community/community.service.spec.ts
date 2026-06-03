import { CommunityService } from './community.service';

describe('CommunityService.listPosts', () => {
  function createService(rows: Array<{ id: string; createdAt: Date; likes: [] }>) {
    const prisma = {
      communityPost: {
        findMany: jest.fn().mockResolvedValue(rows),
      },
    };
    return { service: new CommunityService(prisma as never), prisma };
  }

  it('returns nextCursor when more posts exist than the page size', async () => {
    const rows = Array.from({ length: 11 }, (_, i) => ({
      id: `post-${i}`,
      createdAt: new Date(),
      likes: [] as [],
      author: { id: 'u1', name: 'A', email: 'a@x.com' },
      species: null,
      _count: { comments: 0, likes: 0 },
    }));
    const { service } = createService(rows);

    const result = await service.listPosts(10, 'user-1');

    expect(result.posts).toHaveLength(10);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('post-9');
  });

  it('returns null cursor on the last page', async () => {
    const rows = [
      {
        id: 'only',
        createdAt: new Date(),
        likes: [] as [],
        author: { id: 'u1', name: 'A', email: 'a@x.com' },
        species: null,
        _count: { comments: 0, likes: 0 },
      },
    ];
    const { service } = createService(rows);

    const result = await service.listPosts(10, 'user-1');

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});
