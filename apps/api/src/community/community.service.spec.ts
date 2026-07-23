import { CommunityService } from './community.service';

const uploadService = {
  deleteByUrl: jest.fn().mockResolvedValue(undefined),
};

describe('CommunityService.listPosts', () => {
  function createService(rows: Array<{ id: string; createdAt: Date; likes: [] }>) {
    const prisma = {
      communityPost: {
        findMany: jest.fn().mockResolvedValue(rows),
      },
      blockedUser: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    return { service: new CommunityService(prisma as never, uploadService as never), prisma };
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
        delete: jest.fn().mockResolvedValue({}),
      },
      comment: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'comment-1', author: { id: 'u1', name: 'A' } }),
      },
      blockedUser: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const upload = { deleteByUrl: jest.fn().mockResolvedValue(undefined) };
    return {
      service: new CommunityService(prisma as never, upload as never),
      prisma,
      upload,
    };
  }

  it('never selects author.email when listing posts', async () => {
    const { service, prisma } = createService();

    await service.listPosts(10, 'user-1');

    const call = prisma.communityPost.findMany.mock.calls[0][0];
    expect(call.include.author.select).not.toHaveProperty('email');
    expect(call.include.author.select).toEqual(
      expect.objectContaining({ id: true, name: true }),
    );
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

  it('deletes post media after deleting an owned post', async () => {
    const { service, prisma, upload } = createService();
    prisma.communityPost.findUnique.mockResolvedValue({
      id: 'post-1',
      authorId: 'user-1',
      imageUrl: '/uploads/post.webp',
    });

    await expect(service.deletePost('user-1', 'post-1')).resolves.toEqual({
      deleted: true,
    });

    expect(prisma.communityPost.delete).toHaveBeenCalledWith({
      where: { id: 'post-1' },
    });
    expect(upload.deleteByUrl).toHaveBeenCalledWith('/uploads/post.webp');
    expect(prisma.communityPost.delete.mock.invocationCallOrder[0]).toBeLessThan(
      upload.deleteByUrl.mock.invocationCallOrder[0],
    );
  });
});

describe('CommunityService.reshare', () => {
  function createService(post: { id: string; hiddenAt: Date | null; originalPostId: string | null }) {
    const prisma = {
      communityPost: {
        findUnique: jest.fn().mockResolvedValue(post),
        create: jest.fn().mockResolvedValue({ id: 'reshare-1' }),
      },
    };
    return { service: new CommunityService(prisma as never, uploadService as never), prisma };
  }

  it('points a reshare at the original post', async () => {
    const { service, prisma } = createService({ id: 'post-1', hiddenAt: null, originalPostId: null });

    await service.reshare('user-2', 'post-1', { comment: 'love this' });

    const call = prisma.communityPost.create.mock.calls[0][0];
    expect(call.data.originalPostId).toBe('post-1');
    expect(call.data.authorId).toBe('user-2');
    expect(call.data.body).toBe('love this');
  });

  it('collapses a reshare-of-a-reshare to point at the root post', async () => {
    const { service, prisma } = createService({
      id: 'reshare-1',
      hiddenAt: null,
      originalPostId: 'root-post',
    });

    await service.reshare('user-3', 'reshare-1', {});

    const call = prisma.communityPost.create.mock.calls[0][0];
    expect(call.data.originalPostId).toBe('root-post');
  });

  it('refuses to reshare a hidden post', async () => {
    const { service } = createService({ id: 'post-1', hiddenAt: new Date(), originalPostId: null });

    await expect(service.reshare('user-2', 'post-1', {})).rejects.toThrow('Post not found');
  });
});

describe('CommunityService.reportPost', () => {
  function createService(overrides: { reportCount?: number; postAuthorId?: string } = {}) {
    const prisma = {
      communityPost: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'post-1', authorId: overrides.postAuthorId ?? 'author-1', hiddenAt: null }),
        update: jest.fn().mockResolvedValue({}),
      },
      postReport: {
        create: jest.fn().mockResolvedValue({ id: 'report-1' }),
        count: jest.fn().mockResolvedValue(overrides.reportCount ?? 1),
      },
    };
    return { service: new CommunityService(prisma as never, uploadService as never), prisma };
  }

  it('records a report and leaves the post visible below the threshold', async () => {
    const { service, prisma } = createService({ reportCount: 1 });

    const result = await service.reportPost('reporter-1', 'post-1', { reason: 'spam' });

    expect(result).toEqual({ reported: true, alreadyReported: false, hidden: false });
    expect(prisma.communityPost.update).not.toHaveBeenCalled();
  });

  it('auto-hides the post once reports reach the threshold', async () => {
    const { service, prisma } = createService({ reportCount: 3 });

    const result = await service.reportPost('reporter-1', 'post-1', { reason: 'spam' });

    expect(result).toEqual({ reported: true, alreadyReported: false, hidden: true });
    expect(prisma.communityPost.update).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { hiddenAt: expect.any(Date) },
    });
  });

  it('refuses to let a user report their own post', async () => {
    const { service } = createService({ postAuthorId: 'reporter-1' });

    await expect(
      service.reportPost('reporter-1', 'post-1', { reason: 'spam' }),
    ).rejects.toThrow('You cannot report your own post');
  });

  it('treats a duplicate report as a no-op rather than an error', async () => {
    const prisma = {
      communityPost: {
        findUnique: jest.fn().mockResolvedValue({ id: 'post-1', authorId: 'author-1', hiddenAt: null }),
        update: jest.fn(),
      },
      postReport: {
        create: jest.fn().mockRejectedValue({ code: 'P2002' }),
        count: jest.fn(),
      },
    };
    const service = new CommunityService(prisma as never, uploadService as never);

    const result = await service.reportPost('reporter-1', 'post-1', { reason: 'spam' });

    expect(result).toEqual({ reported: true, alreadyReported: true, hidden: false });
    expect(prisma.communityPost.update).not.toHaveBeenCalled();
  });
});

describe('CommunityService.toggleBlockUser', () => {
  it('blocks a user who is not yet blocked', async () => {
    const prisma = {
      blockedUser: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'block-1' }),
        delete: jest.fn(),
      },
    };
    const service = new CommunityService(prisma as never, uploadService as never);

    const result = await service.toggleBlockUser('user-1', 'user-2');

    expect(result).toEqual({ blocked: true });
    expect(prisma.blockedUser.create).toHaveBeenCalledWith({
      data: { blockerId: 'user-1', blockedId: 'user-2' },
    });
  });

  it('unblocks a user who is already blocked', async () => {
    const prisma = {
      blockedUser: {
        findUnique: jest.fn().mockResolvedValue({ id: 'block-1' }),
        create: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new CommunityService(prisma as never, uploadService as never);

    const result = await service.toggleBlockUser('user-1', 'user-2');

    expect(result).toEqual({ blocked: false });
    expect(prisma.blockedUser.delete).toHaveBeenCalledWith({ where: { id: 'block-1' } });
  });

  it('refuses to let a user block themselves', async () => {
    const prisma = { blockedUser: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() } };
    const service = new CommunityService(prisma as never, uploadService as never);

    await expect(service.toggleBlockUser('user-1', 'user-1')).rejects.toThrow(
      'You cannot block yourself',
    );
  });
});

describe('CommunityService.listPosts blocking', () => {
  it('excludes posts from blocked authors', async () => {
    const prisma = {
      communityPost: { findMany: jest.fn().mockResolvedValue([]) },
      blockedUser: { findMany: jest.fn().mockResolvedValue([{ blockedId: 'blocked-1' }]) },
    };
    const service = new CommunityService(prisma as never, uploadService as never);

    await service.listPosts(10, 'viewer-1');

    const call = prisma.communityPost.findMany.mock.calls[0][0];
    expect(call.where.authorId).toEqual({ notIn: ['blocked-1'] });
  });
});

describe('CommunityService.listPosts hides removed originals', () => {
  it('strips the embedded original once it has been auto-hidden, so reported content stops circulating via reshares', async () => {
    const prisma = {
      communityPost: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'reshare-1',
            createdAt: new Date(),
            likes: [] as [],
            author: { id: 'u2', name: 'B' },
            species: null,
            _count: { comments: 0, likes: 0 },
            originalPost: {
              id: 'post-1',
              body: 'reported content',
              hiddenAt: new Date(),
              author: { id: 'u1', name: 'A' },
              species: null,
            },
          },
        ]),
      },
      blockedUser: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new CommunityService(prisma as never, uploadService as never);

    const result = await service.listPosts(10, 'viewer-1');

    expect(result.posts[0].originalPost).toBeNull();
  });
});

describe('CommunityService.toggleFollow', () => {
  it('follows a user who is not yet followed', async () => {
    const prisma = {
      follow: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'follow-1' }),
        delete: jest.fn(),
      },
    };
    const service = new CommunityService(prisma as never, uploadService as never);

    const result = await service.toggleFollow('user-1', 'user-2');

    expect(result).toEqual({ following: true });
    expect(prisma.follow.create).toHaveBeenCalledWith({
      data: { followerId: 'user-1', followingId: 'user-2' },
    });
  });

  it('unfollows a user who is already followed', async () => {
    const prisma = {
      follow: {
        findUnique: jest.fn().mockResolvedValue({ id: 'follow-1' }),
        create: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new CommunityService(prisma as never, uploadService as never);

    const result = await service.toggleFollow('user-1', 'user-2');

    expect(result).toEqual({ following: false });
    expect(prisma.follow.delete).toHaveBeenCalledWith({ where: { id: 'follow-1' } });
  });

  it('refuses to let a user follow themselves', async () => {
    const prisma = { follow: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() } };
    const service = new CommunityService(prisma as never, uploadService as never);

    await expect(service.toggleFollow('user-1', 'user-1')).rejects.toThrow(
      'You cannot follow yourself',
    );
  });
});

describe('CommunityService.listPosts following scope', () => {
  it('filters the feed to only followed authors when scope is "following"', async () => {
    const prisma = {
      communityPost: { findMany: jest.fn().mockResolvedValue([]) },
      blockedUser: { findMany: jest.fn().mockResolvedValue([]) },
      follow: { findMany: jest.fn().mockResolvedValue([{ followingId: 'followed-1' }]) },
    };
    const service = new CommunityService(prisma as never, uploadService as never);

    await service.listPosts(10, 'viewer-1', undefined, 'following');

    const call = prisma.communityPost.findMany.mock.calls[0][0];
    expect(call.where.authorId).toEqual({ in: ['followed-1'] });
  });

  it('combines the following filter with the blocked-author exclusion', async () => {
    const prisma = {
      communityPost: { findMany: jest.fn().mockResolvedValue([]) },
      blockedUser: { findMany: jest.fn().mockResolvedValue([{ blockedId: 'blocked-1' }]) },
      follow: { findMany: jest.fn().mockResolvedValue([{ followingId: 'followed-1' }]) },
    };
    const service = new CommunityService(prisma as never, uploadService as never);

    await service.listPosts(10, 'viewer-1', undefined, 'following');

    const call = prisma.communityPost.findMany.mock.calls[0][0];
    expect(call.where.authorId).toEqual({ in: ['followed-1'], notIn: ['blocked-1'] });
  });

  it('does not filter by following when scope is "all" (default)', async () => {
    const prisma = {
      communityPost: { findMany: jest.fn().mockResolvedValue([]) },
      blockedUser: { findMany: jest.fn().mockResolvedValue([]) },
      follow: { findMany: jest.fn() },
    };
    const service = new CommunityService(prisma as never, uploadService as never);

    await service.listPosts(10, 'viewer-1');

    expect(prisma.follow.findMany).not.toHaveBeenCalled();
    const call = prisma.communityPost.findMany.mock.calls[0][0];
    expect(call.where.authorId).toBeUndefined();
  });
});
