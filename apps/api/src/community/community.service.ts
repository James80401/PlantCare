import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { canDeleteCommunityPost } from '../gardens/garden-authz';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  listPosts(limit = 30) {
    const take = Math.min(50, Math.max(1, limit));
    return this.prisma.communityPost.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true } },
        species: { select: { id: true, commonName: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });
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
        author: { select: { id: true, name: true, email: true } },
        species: { select: { id: true, commonName: true } },
      },
    });
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
}
