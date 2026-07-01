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
      author: { id: 'u1', name: 'A' },
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
        author: { id: 'u1', name: 'A' },
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

describe('CommunityService author field exposure', () => {
  function createService() {
    const prisma = {
      communityPost: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'post-1', author: { id: 'u1', name: 'A' } }),
        findUnique: jest.fn().mockResolvedValue({ id: 'post-1' }),
      },
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'comment-1', author: { id: 'u1', name: 'A' } }),
      },
    };
    return { service: new CommunityService(prisma as never), prisma };
  }

  it('never selects author.email when listing posts', async () => {
    const { service, prisma } = createService();

    await service.listPosts(10, 'user-1');

    const call = prisma.communityPost.findMany.mock.calls[0][0];
    expect(call.include.author.select).toEqual({ id: true, name: true });
  });

  it('never selects author.email when creating a post', async () => {
    const { service, prisma } = createService();

    await service.createPost('user-1', { body: 'hello' } as never);

    const call = prisma.communityPost.create.mock.calls[0][0];
    expect(call.include.author.select).toEqual({ id: true, name: true });
  });

  it('never selects author.email when listing comments', async () => {
    const { service, prisma } = createService();

    await service.listComments('post-1');

    const call = prisma.comment.findMany.mock.calls[0][0];
    expect(call.include.author.select).toEqual({ id: true, name: true });
  });

  it('never selects author.email when creating a comment', async () => {
    const { service, prisma } = createService();

    await service.createComment('user-1', 'post-1', { body: 'hi' } as never);

    const call = prisma.comment.create.mock.calls[0][0];
    expect(call.include.author.select).toEqual({ id: true, name: true });
  });
});
