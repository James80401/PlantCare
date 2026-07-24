import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { canDeleteCommunityPost } from '../gardens/garden-authz';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { ReportPostDto } from './dto/report-post.dto';
import { ResharePostDto } from './dto/reshare-post.dto';
import { mapCommunityPostsForViewer } from './community.mapper';
import { UploadService } from '../upload/upload.service';

/** Once a post collects this many distinct reports, it's auto-hidden from
 *  the feed pending review — a lightweight moderation floor with no admin
 *  queue required to take effect. */
const AUTO_HIDE_REPORT_THRESHOLD = 3;

const originalPostSelect = {
  select: {
    id: true,
    body: true,
    imageUrl: true,
    createdAt: true,
    hiddenAt: true,
    author: { select: { id: true, name: true } },
    species: { select: { id: true, commonName: true } },
  },
};

type RawPost = Record<string, unknown> & {
  originalPost?: (Record<string, unknown> & { hiddenAt: Date | null }) | null;
  author?: (Record<string, unknown> & { followers?: Array<{ id: string }> }) | null;
};

/** Applies both post-processing steps in one pass, since chaining separate
 *  generic mappers here fights TypeScript's structural inference more than
 *  it's worth for glue code with no other callers:
 *  - A reshare embeds its original post's content — if that original gets
 *    auto-hidden after this reshare was created, strip the embed so hidden
 *    content can't keep circulating through reshares.
 *  - Mirrors likes → likedByMe: strips the raw `followers` probe relation
 *    and exposes a plain `followedByMe` boolean on the post's author. */
function finalizePosts(
  posts: RawPost[],
  blockedAuthorIds: string[] = [],
): Record<string, unknown>[] {
  const blocked = new Set(blockedAuthorIds);
  return posts.map((post) => {
    const { originalPost, author, ...rest } = post;
    const visibleOriginal =
      !originalPost ||
      originalPost.hiddenAt ||
      blocked.has(
        ((originalPost.author as { id?: string } | null | undefined)?.id ?? ''),
      )
        ? null
        : (() => {
            const { hiddenAt: _hiddenAt, ...visible } = originalPost;
            return visible;
          })();

    if (!author) {
      return { ...rest, originalPost: visibleOriginal, author: null };
    }
    const { followers, ...authorRest } = author;
    return {
      ...rest,
      originalPost: visibleOriginal,
      author: { ...authorRest, followedByMe: (followers?.length ?? 0) > 0 },
    };
  });
}

// A viewer id of '' can never match a real cuid, so this keeps a single
// consistent include shape (avoiding a TS union on `author`) whether or
// not a viewer is present, while still returning an empty match set.
const postInclude = (viewerId?: string) => ({
  author: {
    select: {
      id: true,
      name: true,
      followers: {
        where: { followerId: viewerId ?? '' },
        select: { id: true },
        take: 1,
      },
    },
  },
  species: { select: { id: true, commonName: true } },
  originalPost: originalPostSelect,
  _count: { select: { comments: true, likes: true } },
  likes: {
    where: { userId: viewerId ?? '' },
    select: { id: true },
    take: 1,
  },
});

@Injectable()
export class CommunityService {
  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
  ) {}

  /** Toggles a row in a uniquely-constrained join table (like/follow/block):
   *  delete it if it exists, create it if it doesn't. Returns whether the
   *  relation now exists (i.e. whether this call created it). */
  private async toggleRelation<Where extends object, Data extends object>(
    delegate: {
      findUnique(args: { where: Where }): Promise<{ id: string } | null>;
      create(args: { data: Data }): Promise<unknown>;
      delete(args: { where: { id: string } }): Promise<unknown>;
    },
    where: Where,
    data: Data,
  ): Promise<boolean> {
    const existing = await delegate.findUnique({ where });
    if (existing) {
      try {
        await delegate.delete({ where: { id: existing.id } });
        return false;
      } catch (error) {
        if (!this.isConcurrentRelationError(error)) throw error;
        return Boolean(await delegate.findUnique({ where }));
      }
    }
    try {
      await delegate.create({ data });
      return true;
    } catch (error) {
      if (!this.isConcurrentRelationError(error)) throw error;
      return Boolean(await delegate.findUnique({ where }));
    }
  }

  private isConcurrentRelationError(error: unknown) {
    const code = (error as { code?: string })?.code;
    return code === 'P2002' || code === 'P2025';
  }

  async listPosts(
    limit = 20,
    viewerId?: string,
    cursor?: string,
    scope: 'all' | 'following' = 'all',
  ) {
    const take = Math.min(50, Math.max(1, limit));
    const blockedAuthorIds = viewerId ? await this.getBlockedAuthorIds(viewerId) : [];
    const followingIds =
      scope === 'following' && viewerId ? await this.getFollowingIds(viewerId) : null;

    const authorFilter: { in?: string[]; notIn?: string[] } = {};
    if (followingIds) authorFilter.in = followingIds;
    if (blockedAuthorIds.length) authorFilter.notIn = blockedAuthorIds;

    const rows = await this.prisma.communityPost.findMany({
      take: take + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      where: {
        hiddenAt: null,
        ...(Object.keys(authorFilter).length ? { authorId: authorFilter } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: postInclude(viewerId),
    });

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const posts = mapCommunityPostsForViewer(
      finalizePosts(page, blockedAuthorIds),
      viewerId,
    );

    return {
      posts,
      nextCursor: hasMore && page.length ? page[page.length - 1].id : null,
      hasMore,
    };
  }

  /** Users a viewer has blocked never appear in their feed — blocking is
   *  one-directional by design (it hides content from you, it doesn't
   *  notify or restrict the blocked user). */
  private async getBlockedAuthorIds(viewerId: string): Promise<string[]> {
    const rows = await this.prisma.blockedUser.findMany({
      where: { blockerId: viewerId },
      select: { blockedId: true },
    });
    return rows.map((r) => r.blockedId);
  }

  private async getFollowingIds(viewerId: string): Promise<string[]> {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    return rows.map((r) => r.followingId);
  }

  async toggleFollow(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new ForbiddenException('You cannot follow yourself');
    }
    const following = await this.toggleRelation(
      this.prisma.follow,
      { followerId_followingId: { followerId: userId, followingId: targetUserId } },
      { followerId: userId, followingId: targetUserId },
    );
    return { following };
  }

  createPost(userId: string, dto: CreatePostDto) {
    return this.prisma.communityPost.create({
      data: {
        authorId: userId,
        body: dto.body.trim(),
        speciesId: dto.speciesId || null,
        imageUrl: dto.imageUrl?.trim() || null,
      },
      include: {
        author: { select: { id: true, name: true } },
        species: { select: { id: true, commonName: true } },
      },
    });
  }

  async reshare(userId: string, postId: string, dto: ResharePostDto) {
    const blockedAuthorIds = await this.getBlockedAuthorIds(userId);
    const post = await this.prisma.communityPost.findFirst({
      where: {
        id: postId,
        hiddenAt: null,
        ...(blockedAuthorIds.length
          ? { authorId: { notIn: blockedAuthorIds } }
          : {}),
      },
    });
    if (!post) throw new NotFoundException('Post not found');

    // Reshares always point at the root post, so a chain of reshares never nests.
    const rootPostId = post.originalPostId ?? post.id;
    if (rootPostId !== post.id) {
      const root = await this.prisma.communityPost.findFirst({
        where: {
          id: rootPostId,
          hiddenAt: null,
          ...(blockedAuthorIds.length
            ? { authorId: { notIn: blockedAuthorIds } }
            : {}),
        },
        select: { id: true },
      });
      if (!root) throw new NotFoundException('Post not found');
    }

    const created = await this.prisma.communityPost.create({
      data: {
        authorId: userId,
        body: dto.comment?.trim() ?? '',
        originalPostId: rootPostId,
      },
      include: postInclude(userId),
    });

    return mapCommunityPostsForViewer(finalizePosts([created]), userId)[0];
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (!canDeleteCommunityPost(post.authorId, userId)) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.prisma.communityPost.delete({ where: { id: postId } });
    if (post.imageUrl) await this.upload.deleteByUrl(post.imageUrl).catch(() => {});
    return { deleted: true };
  }

  async reportPost(userId: string, postId: string, dto: ReportPostDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId === userId) {
      throw new ForbiddenException('You cannot report your own post');
    }

    try {
      await this.prisma.postReport.create({
        data: { postId, reporterId: userId, reason: dto.reason.trim() },
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2002') {
        return { reported: true, alreadyReported: true, hidden: Boolean(post.hiddenAt) };
      }
      throw err;
    }

    const reportCount = await this.prisma.postReport.count({ where: { postId } });
    let hidden = Boolean(post.hiddenAt);
    if (!hidden && reportCount >= AUTO_HIDE_REPORT_THRESHOLD) {
      await this.prisma.communityPost.update({
        where: { id: postId },
        data: { hiddenAt: new Date() },
      });
      hidden = true;
    }

    return { reported: true, alreadyReported: false, hidden };
  }

  async toggleBlockUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new ForbiddenException('You cannot block yourself');
    }
    const blocked = await this.toggleRelation(
      this.prisma.blockedUser,
      { blockerId_blockedId: { blockerId: userId, blockedId: targetUserId } },
      { blockerId: userId, blockedId: targetUserId },
    );
    return { blocked };
  }

  async listComments(userId: string, postId: string) {
    const blockedAuthorIds = await this.requireVisiblePost(userId, postId);
    return this.prisma.comment.findMany({
      where: {
        postId,
        ...(blockedAuthorIds.length
          ? { authorId: { notIn: blockedAuthorIds } }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    await this.requireVisiblePost(userId, postId);
    return this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        body: dto.body.trim(),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async toggleLike(userId: string, postId: string) {
    await this.requireVisiblePost(userId, postId);

    const liked = await this.toggleRelation(
      this.prisma.postLike,
      { postId_userId: { postId, userId } },
      { postId, userId },
    );
    const count = await this.prisma.postLike.count({ where: { postId } });
    return { liked, likeCount: count };
  }

  private async requireVisiblePost(userId: string, postId: string) {
    const blockedAuthorIds = await this.getBlockedAuthorIds(userId);
    const post = await this.prisma.communityPost.findFirst({
      where: {
        id: postId,
        hiddenAt: null,
        ...(blockedAuthorIds.length
          ? { authorId: { notIn: blockedAuthorIds } }
          : {}),
      },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return blockedAuthorIds;
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!canDeleteCommunityPost(comment.authorId, userId)) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { deleted: true };
  }
}
