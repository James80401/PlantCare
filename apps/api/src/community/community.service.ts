import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { canDeleteCommunityPost } from '../gardens/garden-authz';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { ReportPostDto } from './dto/report-post.dto';
import { ResharePostDto } from './dto/reshare-post.dto';
import { mapCommunityPostsForViewer } from './community.mapper';

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

type PostWithOriginal = { originalPost?: { hiddenAt: Date | null } | null };

/** A reshare embeds its original post's content — if that original gets
 *  auto-hidden after this reshare was created, strip the embed so hidden
 *  content can't keep circulating through reshares. */
function hideRemovedOriginals<T extends PostWithOriginal>(
  posts: T[],
): Array<Omit<T, 'originalPost'> & { originalPost: null | Omit<NonNullable<T['originalPost']>, 'hiddenAt'> }> {
  return posts.map(({ originalPost, ...post }) => {
    if (!originalPost || originalPost.hiddenAt) {
      return { ...post, originalPost: null };
    }
    const { hiddenAt: _hiddenAt, ...visible } = originalPost;
    return { ...post, originalPost: visible };
  }) as never;
}

const postInclude = (viewerId?: string) => ({
  author: { select: { id: true, name: true } },
  species: { select: { id: true, commonName: true } },
  originalPost: originalPostSelect,
  _count: { select: { comments: true, likes: true } },
  ...(viewerId
    ? {
        likes: {
          where: { userId: viewerId },
          select: { id: true },
          take: 1,
        },
      }
    : {}),
});

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async listPosts(limit = 20, viewerId?: string, cursor?: string) {
    const take = Math.min(50, Math.max(1, limit));
    const blockedAuthorIds = viewerId ? await this.getBlockedAuthorIds(viewerId) : [];

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
        ...(blockedAuthorIds.length ? { authorId: { notIn: blockedAuthorIds } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: postInclude(viewerId),
    });

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const posts = mapCommunityPostsForViewer(hideRemovedOriginals(page), viewerId);

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
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post || post.hiddenAt) throw new NotFoundException('Post not found');

    // Reshares always point at the root post, so a chain of reshares never nests.
    const rootPostId = post.originalPostId ?? post.id;

    const created = await this.prisma.communityPost.create({
      data: {
        authorId: userId,
        body: dto.comment?.trim() ?? '',
        originalPostId: rootPostId,
      },
      include: postInclude(userId),
    });

    return mapCommunityPostsForViewer(hideRemovedOriginals([created]), userId)[0];
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (!canDeleteCommunityPost(post.authorId, userId)) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.prisma.communityPost.delete({ where: { id: postId } });
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

    const existing = await this.prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetUserId } },
    });

    if (existing) {
      await this.prisma.blockedUser.delete({ where: { id: existing.id } });
      return { blocked: false };
    }

    await this.prisma.blockedUser.create({
      data: { blockerId: userId, blockedId: targetUserId },
    });
    return { blocked: true };
  }

  async listComments(postId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
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
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.postLike.create({ data: { postId, userId } });
    }

    const count = await this.prisma.postLike.count({ where: { postId } });
    return { liked: !existing, likeCount: count };
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
