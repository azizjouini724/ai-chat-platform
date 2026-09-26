import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Inject, forwardRef } from '@nestjs/common';
import { WebsocketGateway } from '../websocket/websocket.gateway';

const publicUserSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  bio: true,
  status: true,
  lastSeenAt: true,
};

@Injectable()
export class ConversationsService {
  constructor(
  private prisma: PrismaService,
  @Inject(forwardRef(() => WebsocketGateway))
  private websocketGateway: WebsocketGateway,
) {}

  // Créer (ou récupérer) une conversation privée avec un autre utilisateur
  async getOrCreatePrivateConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Impossible de créer une conversation avec soi-même');
    }

    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherUserId },
    });
    if (!otherUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Cherche si une conversation privée existe déjà entre ces deux personnes
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'PRIVATE',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        members: { include: { user: { select: publicUserSelect } } },
      },
    });

    if (existing) {
      return existing;
    }

    // Sinon, crée une nouvelle conversation avec les deux membres
    return this.prisma.conversation.create({
      data: {
        type: 'PRIVATE',
        members: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: {
        members: { include: { user: { select: publicUserSelect } } },
      },
    });
  }
  async createGroup(creatorId: string, name: string, memberIds: string[]) {
    const uniqueMemberIds = [...new Set(memberIds)].filter((id) => id !== creatorId);

    const existingUsers = await this.prisma.user.findMany({
      where: { id: { in: uniqueMemberIds } },
    });

    if (existingUsers.length !== uniqueMemberIds.length) {
      throw new BadRequestException('Un ou plusieurs utilisateurs sont introuvables');
    }

    return this.prisma.conversation.create({
      data: {
        type: 'GROUP',
        name,
        members: {
          create: [
            { userId: creatorId, role: 'ADMIN' },
            ...uniqueMemberIds.map((userId) => ({ userId, role: 'MEMBER' as const })),
          ],
        },
      },
      include: {
        members: { include: { user: { select: publicUserSelect } } },
      },
    });
  }

  // Liste des conversations de l'utilisateur (avec le dernier message pour l'aperçu)
 async getMyConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        members: { some: { userId, hiddenAt: null } },
      },
      include: {
        members: { include: { user: { select: publicUserSelect } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Ajoute le compteur de messages non lus pour chaque conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conv) => {
        const myMembership = conv.members.find((m) => m.userId === userId);
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            createdAt: {
              gt: myMembership?.lastReadAt,
              gte: myMembership?.joinedAt,
            },
            senderId: { not: userId },
          },
        });

        return { ...conv, unreadCount };
      }),
    );

    return conversationsWithUnreadCount;
  }

  // Vérifie qu'un utilisateur fait bien partie d'une conversation (utile pour les messages)
  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });
    return !!member;
  }
  async markAsRead(conversationId: string, userId: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!member) throw new ForbiddenException('Vous ne faites pas partie de cette conversation');

    await this.prisma.conversationMember.update({
      where: { id: member.id },
      data: { lastReadAt: new Date() },
    });

    // Notifie les autres membres que tu as lu la conversation
    this.websocketGateway.server
      .to(`conversation:${conversationId}`)
      .emit('conversationRead', { conversationId, userId });

    return { message: 'Conversation marquée comme lue' };
  }
  async isAdmin(conversationId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });
    return member?.role === 'ADMIN';
  }

  // Voir une conversation précise (avec vérification d'accès)
  async getConversationById(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: { include: { user: { select: publicUserSelect } } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    const isMember = await this.isMember(conversationId, userId);
    if (!isMember) {
      throw new ForbiddenException('Vous ne faites pas partie de cette conversation');
    }

    return conversation;
  }
  async addMember(conversationId: string, adminId: string, newMemberId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }
    if (conversation.type !== 'GROUP') {
      throw new BadRequestException('Cette action est réservée aux groupes');
    }

    const isAdmin = await this.isAdmin(conversationId, adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Seul un admin peut ajouter un membre');
    }

    const alreadyMember = await this.isMember(conversationId, newMemberId);
    if (alreadyMember) {
      throw new BadRequestException('Cet utilisateur fait déjà partie du groupe');
    }

    const userExists = await this.prisma.user.findUnique({ where: { id: newMemberId } });
    if (!userExists) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const newMember = await this.prisma.conversationMember.create({
      data: { conversationId, userId: newMemberId, role: 'MEMBER' },
      include: { user: { select: publicUserSelect } },
    });

    this.websocketGateway.server
      .to(`conversation:${conversationId}`)
      .emit('memberJoined', { conversationId, user: newMember.user });

    // Ajoute le nouveau membre à la room WebSocket s'il est connecté
    this.websocketGateway.server
      .in(newMemberId)
      .socketsJoin(`conversation:${conversationId}`);

    return newMember;
  }
  // Quitter un groupe
  async leaveGroup(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }
    if (conversation.type !== 'GROUP') {
      throw new BadRequestException('Cette action est réservée aux groupes');
    }

    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) {
      throw new BadRequestException('Vous ne faites pas partie de ce groupe');
    }

    if (member.role === 'ADMIN') {
      const otherAdmins = await this.prisma.conversationMember.count({
        where: { conversationId, role: 'ADMIN', userId: { not: userId } },
      });
      if (otherAdmins === 0) {
        throw new BadRequestException(
          'Vous êtes le seul admin. Promouvez un autre membre avant de quitter.',
        );
      }
    }

    await this.prisma.conversationMember.delete({ where: { id: member.id } });

    this.websocketGateway.server
      .to(`conversation:${conversationId}`)
      .emit('memberLeft', { conversationId, userId });

    // Retire l'utilisateur de la room WebSocket
    this.websocketGateway.server
      .in(userId)
      .socketsLeave(`conversation:${conversationId}`);

    return { message: 'Vous avez quitté le groupe' };
  }

  // L'admin retire un membre (kick)
  async removeMember(conversationId: string, adminId: string, targetUserId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }
    if (conversation.type !== 'GROUP') {
      throw new BadRequestException('Cette action est réservée aux groupes');
    }

    const isAdmin = await this.isAdmin(conversationId, adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Seul un admin peut retirer un membre');
    }
    if (adminId === targetUserId) {
      throw new BadRequestException('Utilisez "quitter le groupe" pour vous retirer vous-même');
    }

    const targetMember = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
    });
    if (!targetMember) {
      throw new NotFoundException('Ce membre ne fait pas partie du groupe');
    }

    await this.prisma.conversationMember.delete({ where: { id: targetMember.id } });

    this.websocketGateway.server
      .to(`conversation:${conversationId}`)
      .emit('memberLeft', { conversationId, userId: targetUserId });

    this.websocketGateway.server
      .in(targetUserId)
      .socketsLeave(`conversation:${conversationId}`);

    return { message: 'Membre retiré du groupe' };
  }

  // Promouvoir un membre en admin
  async promoteToAdmin(conversationId: string, adminId: string, targetUserId: string) {
    const isAdmin = await this.isAdmin(conversationId, adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Seul un admin peut promouvoir un membre');
    }

    const targetMember = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
    });
    if (!targetMember) {
      throw new NotFoundException('Ce membre ne fait pas partie du groupe');
    }
    if (targetMember.role === 'ADMIN') {
      throw new BadRequestException('Cette personne est déjà admin');
    }

    return this.prisma.conversationMember.update({
      where: { id: targetMember.id },
      data: { role: 'ADMIN' },
      include: { user: { select: publicUserSelect } },
    });
  }
  // Un membre (non-admin) propose d'ajouter quelqu'un
  async proposeMember(conversationId: string, requesterId: string, proposedUserId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }
    if (conversation.type !== 'GROUP') {
      throw new BadRequestException('Cette action est réservée aux groupes');
    }

    const requesterIsMember = await this.isMember(conversationId, requesterId);
    if (!requesterIsMember) {
      throw new ForbiddenException('Vous ne faites pas partie de ce groupe');
    }

    const proposedAlreadyMember = await this.isMember(conversationId, proposedUserId);
    if (proposedAlreadyMember) {
      throw new BadRequestException('Cette personne fait déjà partie du groupe');
    }

    const proposedUser = await this.prisma.user.findUnique({
      where: { id: proposedUserId },
    });
    if (!proposedUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const existing = await this.prisma.groupJoinRequest.findUnique({
      where: { conversationId_userId: { conversationId, userId: proposedUserId } },
    });

    if (existing && existing.status === 'PENDING') {
      throw new BadRequestException('Une demande est déjà en attente pour cette personne');
    }

    if (existing) {
      return this.prisma.groupJoinRequest.update({
        where: { id: existing.id },
        data: { status: 'PENDING', requestedById: requesterId },
      });
    }

    return this.prisma.groupJoinRequest.create({
      data: { conversationId, userId: proposedUserId, requestedById: requesterId, status: 'PENDING' },
      include: { user: { select: publicUserSelect }, requestedBy: { select: publicUserSelect } },
    });
  }

  // L'admin accepte une proposition
  async acceptJoinRequest(conversationId: string, adminId: string, requestId: string) {
    const isAdmin = await this.isAdmin(conversationId, adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Seul un admin peut accepter une proposition');
    }

    const request = await this.prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.conversationId !== conversationId) {
      throw new NotFoundException('Demande introuvable');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    await this.prisma.groupJoinRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
    });

    const newMember = await this.prisma.conversationMember.create({
      data: { conversationId, userId: request.userId, role: 'MEMBER' },
      include: { user: { select: publicUserSelect } },
    });

    this.websocketGateway.server
      .to(`conversation:${conversationId}`)
      .emit('memberJoined', { conversationId, user: newMember.user });

    this.websocketGateway.server
      .in(request.userId)
      .socketsJoin(`conversation:${conversationId}`);

    return newMember;
  }

  // L'admin refuse une proposition
  async declineJoinRequest(conversationId: string, adminId: string, requestId: string) {
    const isAdmin = await this.isAdmin(conversationId, adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Seul un admin peut refuser une proposition');
    }

    const request = await this.prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.conversationId !== conversationId) {
      throw new NotFoundException('Demande introuvable');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    return this.prisma.groupJoinRequest.update({
      where: { id: requestId },
      data: { status: 'DECLINED' },
    });
  }

  // Liste des propositions en attente (pour l'admin)
  async getPendingJoinRequests(conversationId: string, adminId: string) {
    const isAdmin = await this.isAdmin(conversationId, adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Seul un admin peut voir les propositions');
    }

    return this.prisma.groupJoinRequest.findMany({
      where: { conversationId, status: 'PENDING' },
      include: {
        user: { select: publicUserSelect },
        requestedBy: { select: publicUserSelect },
      },
    });
  }
    async updateGroupInfo(conversationId: string, adminId: string, name?: string, avatarUrl?: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }
    if (conversation.type !== 'GROUP') {
      throw new BadRequestException('Cette action est réservée aux groupes');
    }

    const isAdmin = await this.isAdmin(conversationId, adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Seul un admin peut modifier le groupe');
    }

        const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, username: true },
    });

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(name && { name }),
        ...(avatarUrl && { avatarUrl }),
      },
    });

    // Met à jour le nom/l'avatar en temps réel pour tous les clients connectés
    this.websocketGateway.server
      .to(`conversation:${conversationId}`)
      .emit('groupInfoUpdated', {
        conversationId,
        newName: name ? updated.name : undefined,
        newAvatarUrl: avatarUrl ? updated.avatarUrl : undefined,
      });

    // Crée un vrai message "système" persistant, visible par tous (même hors ligne, même après reload)
    const who = admin?.username ?? 'Un admin';
    let systemText: string | null = null;
    if (name && avatarUrl) {
      systemText = `${who} a changé le nom en "${updated.name}" et la photo du groupe`;
    } else if (name) {
      systemText = `${who} a changé le nom du groupe : "${conversation.name}" → "${updated.name}"`;
    } else if (avatarUrl) {
      systemText = `${who} a changé la photo du groupe`;
    }

    if (systemText) {
      const systemMessage = await this.prisma.message.create({
        data: {
          conversationId,
          senderId: adminId,
          type: 'SYSTEM',
          content: systemText,
        },
        include: { sender: { select: publicUserSelect } },
      });
      this.websocketGateway.server
        .to(`conversation:${conversationId}`)
        .emit('newMessage', systemMessage);
    }

    return updated;
  }
  async hideConversation(conversationId: string, userId: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) {
      throw new ForbiddenException('Vous ne faites pas partie de cette conversation');
    }

    await this.prisma.conversationMember.update({
      where: { id: member.id },
      data: { hiddenAt: new Date() },
    });

    return { message: 'Conversation masquée' };
  }
}