import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  create(@Request() req: any, @Body() body: { content?: string; imageUrl?: string }) {
    return this.postsService.createPost(req.user.userId, body.content, body.imageUrl);
  }

  @Get('user/:userId')
  getUserPosts(@Param('userId') userId: string) {
    return this.postsService.getUserPosts(userId);
  }

  @Delete(':postId')
  deletePost(@Request() req: any, @Param('postId') postId: string) {
    return this.postsService.deletePost(req.user.userId, postId);
  }

  @Post(':postId/like')
  toggleLike(@Request() req: any, @Param('postId') postId: string) {
    return this.postsService.toggleLike(postId, req.user.userId);
  }

  @Post(':postId/comments')
  addComment(@Request() req: any, @Param('postId') postId: string, @Body() body: { content: string }) {
    return this.postsService.addComment(postId, req.user.userId, body.content);
  }

  @Get(':postId/comments')
  getComments(@Param('postId') postId: string) {
    return this.postsService.getComments(postId);
  }
}