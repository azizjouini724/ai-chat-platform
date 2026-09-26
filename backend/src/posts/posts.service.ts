import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const publicUserSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  status: true,
};

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(authorId: string, content?: string, imageUrl?: string) {
    if (!content && !imageUrl) {
      throw new BadRequestException('La publication ne peut pas etre vide');
    }

    return this.prisma.post.create({
      data: { authorId, content, imageUrl },
      include: {
        author: { select: publicUserSelect },
        likes: { include: { user: { select: publicUserSelect } } },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { author: { select: publicUserSelect } },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  async getUserPosts(userId: string) {
    return this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: publicUserSelect },
        likes: { include: { user: { select: publicUserSelect } } },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { author: { select: publicUserSelect } },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Publication introuvable');
    if (post.authorId !== userId) throw new ForbiddenException('Tu ne peux supprimer que tes propres publications');

    await this.prisma.post.delete({ where: { id: postId } });
    return { success: true };
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Publication introuvable');

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
      return { liked: false };
    }

    await this.prisma.postLike.create({ data: { postId, userId } });
    return { liked: true };
  }

  async addComment(postId: string, userId: string, content: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Publication introuvable');
    if (!content?.trim()) throw new BadRequestException('Le commentaire ne peut pas etre vide');

    return this.prisma.postComment.create({
      data: { postId, authorId: userId, content: content.trim() },
      include: { author: { select: publicUserSelect } },
    });
  }

  async getComments(postId: string) {
    return this.prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: publicUserSelect } },
    });
  }
}