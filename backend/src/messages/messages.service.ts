import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { FriendsService } from '../friends/friends.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';


const publicUserSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  status: true,
  lastSeenAt: true,
};

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private conversationsService: ConversationsService,
    private friendsService: FriendsService,
    private websocketGateway: WebsocketGateway,
  ) {}

 async sendMessage(senderId: string, conversationId: string, content?: string, imageUrl?: string, documentUrl?: string, replyToId?: string) {
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
        replyToId,
      },
      include: {
        sender: { select: publicUserSelect },
        reactions: { include: { user: { select: publicUserSelect } } },
        replyTo: {
            include: { sender: { select: publicUserSelect } },
  },
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
  // Diffuse le nouveau message en temps réel à tous les membres connectés de cette conversation
    this.websocketGateway.server.to(`conversation:${conversationId}`).emit('newMessage', message);
    // Détecte les mentions @username dans le contenu
    if (content) {
      const mentionRegex = /@(\w+)/g;
      const mentions = [...content.matchAll(mentionRegex)].map((m) => m[1]);

      if (mentions.length > 0) {
        // Récupère les membres de la conversation
        const members = await this.prisma.conversationMember.findMany({
          where: { conversationId },
          include: { user: { select: { id: true, username: true } } },
        });

        for (const mention of mentions) {
          const mentionedMember = members.find(
            (m) => m.user.username.toLowerCase() === mention.toLowerCase(),
          );

          if (mentionedMember && mentionedMember.userId !== senderId) {
            this.websocketGateway.server
              .to(mentionedMember.userId)
              .emit('mentioned', {
                conversationId,
                messageId: message.id,
                mentionedBy: senderId,
                content,
              });
          }
        }
      }
    }

    return message;
    
  }
  async searchMessages(conversationId: string, userId: string, query: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Vous ne faites pas partie de cette conversation');

    if (!query || query.trim().length < 1) return [];

    return this.prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        content: { contains: query, mode: 'insensitive' },
        hiddenBy: { none: { userId } },
      },
      include: {
        sender: { select: publicUserSelect },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }
async editMessage(userId: string, messageId: string, newContent: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message introuvable');
    if (message.senderId !== userId) throw new ForbiddenException('Vous ne pouvez modifier que vos propres messages');
    if (message.isDeleted) throw new BadRequestException('Impossible de modifier un message supprimé');

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { content: newContent, isEdited: true },
     include: {
        sender: { select: publicUserSelect },
        reactions: { include: { user: { select: publicUserSelect } } },
        replyTo: { include: { sender: { select: publicUserSelect } } },
      },
    });

    // Diffuse l'édition en temps réel
    this.websocketGateway.server
      .to(`conversation:${message.conversationId}`)
      .emit('messageEdited', updated);

    return updated;
  }

  async deleteMessageForAll(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message introuvable');
    if (message.senderId !== userId) throw new ForbiddenException('Vous ne pouvez supprimer que vos propres messages');

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: null,
        imageUrl: null,
        documentUrl: null,
      },
      include: { sender: { select: publicUserSelect } },
    });

    // Diffuse la suppression en temps réel à toute la conversation
    this.websocketGateway.server
      .to(`conversation:${message.conversationId}`)
      .emit('messageDeleted', {
        messageId,
        conversationId: message.conversationId,
        deletedForAll: true,
      });

    return updated;
  }

  async deleteMessageForMe(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message introuvable');

    const isMember = await this.conversationsService.isMember(message.conversationId, userId);
    if (!isMember) throw new ForbiddenException('Vous ne faites pas partie de cette conversation');

    // Crée une entrée MessageHide pour cet utilisateur
    await this.prisma.messageHide.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId },
      update: {},
    });

    return { message: 'Message masqué pour vous uniquement' };
  }
    async setReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message introuvable');

    const member = await this.prisma.conversationMember.findFirst({
      where: { conversationId: message.conversationId, userId },
    });
    if (!member) throw new ForbiddenException('Tu n\'es pas membre de cette conversation');

    await this.prisma.messageReaction.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { emoji },
      create: { messageId, userId, emoji },
    });

    this.websocketGateway.server
      .to(`conversation:${message.conversationId}`)
      .emit('messageReactionUpdated', {
        messageId,
        conversationId: message.conversationId,
        userId,
        emoji,
      });

    return { messageId, userId, emoji };
  }

  async removeReaction(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message introuvable');

    await this.prisma.messageReaction.deleteMany({ where: { messageId, userId } });

    this.websocketGateway.server
      .to(`conversation:${message.conversationId}`)
      .emit('messageReactionUpdated', {
        messageId,
        conversationId: message.conversationId,
        userId,
        emoji: null,
      });

    return { success: true };
  }
  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 30) {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!member) throw new ForbiddenException('Vous ne faites pas partie de cette conversation');

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        createdAt: { gte: member.joinedAt },
        hiddenBy: { none: { userId } },
      },
      include: {
      sender: { select: publicUserSelect },
      reactions: { include: { user: { select: publicUserSelect } } },
      replyTo: {
        include: { sender: { select: publicUserSelect } },
      },
    },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    

    return messages.reverse();
    
  }
}