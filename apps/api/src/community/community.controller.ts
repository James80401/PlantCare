import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CommunityService } from './community.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { ReportPostDto } from './dto/report-post.dto';
import { ResharePostDto } from './dto/reshare-post.dto';

@ApiTags('community')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('community')
export class CommunityController {
  constructor(private community: CommunityService) {}

  @Get('posts')
  listPosts(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsed = parseInt(limit || '20', 10);
    return this.community.listPosts(
      Number.isFinite(parsed) ? parsed : 20,
      user.sub,
      cursor?.trim() || undefined,
    );
  }

  @Post('posts')
  createPost(@CurrentUser() user: JwtPayload, @Body() dto: CreatePostDto) {
    return this.community.createPost(user.sub, dto);
  }

  @Delete('posts/:id')
  deletePost(@CurrentUser() user: JwtPayload, @Param('id') postId: string) {
    return this.community.deletePost(user.sub, postId);
  }

  @Get('posts/:id/comments')
  listComments(@Param('id') postId: string) {
    return this.community.listComments(postId);
  }

  @Post('posts/:id/comments')
  createComment(
    @CurrentUser() user: JwtPayload,
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.community.createComment(user.sub, postId, dto);
  }

  @Delete('comments/:id')
  deleteComment(@CurrentUser() user: JwtPayload, @Param('id') commentId: string) {
    return this.community.deleteComment(user.sub, commentId);
  }

  @Post('posts/:id/like')
  toggleLike(@CurrentUser() user: JwtPayload, @Param('id') postId: string) {
    return this.community.toggleLike(user.sub, postId);
  }

  @Post('posts/:id/reshare')
  reshare(
    @CurrentUser() user: JwtPayload,
    @Param('id') postId: string,
    @Body() dto: ResharePostDto,
  ) {
    return this.community.reshare(user.sub, postId, dto);
  }

  @Post('posts/:id/report')
  reportPost(
    @CurrentUser() user: JwtPayload,
    @Param('id') postId: string,
    @Body() dto: ReportPostDto,
  ) {
    return this.community.reportPost(user.sub, postId, dto);
  }

  @Post('users/:id/block')
  toggleBlockUser(@CurrentUser() user: JwtPayload, @Param('id') targetUserId: string) {
    return this.community.toggleBlockUser(user.sub, targetUserId);
  }
}
