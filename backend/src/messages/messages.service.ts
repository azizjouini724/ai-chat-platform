import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { FriendsService } from '../friends/friends.service';


const publicUserSelect = {
  id: true,
  username: true,
  avatarUrl: true,
};

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private conversationsService: ConversationsService,
    private friendsService: FriendsService,
  ) {}

  async sendMessage(
    senderId: string,
    conversationId: string,
    content?: string,
    imageUrl?: string,
    documentUrl?: string,
  ) {
    if (!content && !imageUrl && !documentUrl) {
      throw new BadRequestException('Le message ne peut pas être vide');
    }

    const isMember = await this.conversationsService.isMember(conversationId, senderId);
    if (!isMember) {
      throw new ForbiddenException('Vous ne faites pas partie de cette conversation');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (conversation?.type === 'PRIVATE') {
      const otherMember = conversation.members.find((m) => m.userId !== senderId);
      if (otherMember) {
        const blocked = await this.friendsService.isBlocked(senderId, otherMember.userId);
        if (blocked) {
          throw new ForbiddenException('Impossible d\'envoyer un message à cette personne');
        }
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        imageUrl,
        documentUrl,
      },
      include: {
        sender: { select: publicUserSelect },
      },
    });

    // Met à jour la date de la conversation (pour le tri par activité récente)
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    // Réaffiche la conversation pour tous les membres qui l'auraient masquée
    await this.prisma.conversationMember.updateMany({
      where: { conversationId, hiddenAt: { not: null } },
      data: { hiddenAt: null },
    });

    return message;
  }
async editMessage(userId: string, messageId: string, newContent: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message introuvable');
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres messages');
    }
    if (message.isDeleted) {
      throw new BadRequestException('Impossible de modifier un message supprimé');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content: newContent, isEdited: true },
      include: { sender: { select: publicUserSelect } },
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message introuvable');
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres messages');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: null,
        imageUrl: null,
        documentUrl: null,
      },
      include: { sender: { select: publicUserSelect } },
    });
  }
  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 30) {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Vous ne faites pas partie de cette conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        createdAt: { gte: member.joinedAt },
      },
      include: {
        sender: { select: publicUserSelect },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    return messages.reverse();
  }
}