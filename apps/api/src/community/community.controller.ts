import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';

@ApiTags('community')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('community')
export class CommunityController {
  constructor(private community: CommunityService) {}

  @Get('posts')
  listPosts(@Query('limit') limit?: string) {
    const parsed = parseInt(limit || '30', 10);
    return this.community.listPosts(Number.isFinite(parsed) ? parsed : 30);
  }

  @Post('posts')
  createPost(@CurrentUser() user: JwtPayload, @Body() dto: CreatePostDto) {
    return this.community.createPost(user.sub, dto);
  }

  @Delete('posts/:id')
  deletePost(@CurrentUser() user: JwtPayload, @Param('id') postId: string) {
    return this.community.deletePost(user.sub, postId);
  }
}
