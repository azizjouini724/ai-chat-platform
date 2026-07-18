import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const publicUserSelect = {
  id: true,
  username: true,
  bio: true,
  avatarUrl: true,
};

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  // Envoyer une demande d'ami
  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Impossible de s\'ajouter soi-même');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const blocked = await this.isBlocked(senderId, receiverId);
    if (blocked) {
      throw new ForbiddenException('Action impossible entre ces deux utilisateurs');
    }

   
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      
      if (existing.status === 'DECLINED') {
        if (existing.declineCount >= 3) {
          throw new ForbiddenException(
            'Cette personne a refusé plusieurs fois votre demande, vous ne pouvez plus lui en renvoyer',
          );
        }
        return this.prisma.friendship.update({
          where: { id: existing.id },
          data: { senderId, receiverId, status: 'PENDING' },
        });
      }
    }

    return this.prisma.friendship.create({
      data: { senderId, receiverId, status: 'PENDING' },
    });
  }
  // Accepter une demande reçue
  async acceptRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }
    if (request.receiverId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas accepter cette demande');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    return this.prisma.friendship.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
    });
  }

  // Refuser une demande reçue
  async declineRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Demande introuvable');
    }
    if (request.receiverId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas refuser cette demande');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    return this.prisma.friendship.update({
      where: { id: requestId },
      data: {
        status: 'DECLINED',
        declineCount: { increment: 1 },
      },
    });
  }

  // Liste des amis (demandes acceptées, dans les deux sens)
  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: publicUserSelect },
        receiver: { select: publicUserSelect },
      },
    });

    // Retourne toujours "l'autre personne", peu importe qui a envoyé la demande
    return friendships.map((f) =>
      f.senderId === userId ? f.receiver : f.sender,
    );
  }

  // Demandes reçues en attente
  async getPendingReceived(userId: string) {
    return this.prisma.friendship.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: { sender: { select: publicUserSelect } },
    });
  }

  // Demandes envoyées en attente
  async getPendingSent(userId: string) {
    return this.prisma.friendship.findMany({
      where: { senderId: userId, status: 'PENDING' },
      include: { receiver: { select: publicUserSelect } },
    });
  }

  // Supprimer un ami (ou annuler une demande)
  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Relation introuvable');
    }
    if (friendship.senderId !== userId && friendship.receiverId !== userId) {
      throw new ForbiddenException('Action non autorisée');
    }

    await this.prisma.friendship.delete({ where: { id: friendshipId } });
    return { message: 'Suppression réussie' };
  }
  // Bloquer un utilisateur
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Impossible de se bloquer soi-même');
    }

    const userToBlock = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });
    if (!userToBlock) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const existing = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) {
      throw new BadRequestException('Utilisateur déjà bloqué');
    }

    // Supprime toute amitié existante entre les deux (dans un sens ou l'autre)
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: blockerId, receiverId: blockedId },
          { senderId: blockedId, receiverId: blockerId },
        ],
      },
    });

    return this.prisma.block.create({
      data: { blockerId, blockedId },
    });
  }

  // Débloquer un utilisateur
  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    if (!block) {
      throw new NotFoundException('Ce blocage n\'existe pas');
    }

    await this.prisma.block.delete({ where: { id: block.id } });
    return { message: 'Utilisateur débloqué' };
  }

  // Liste des utilisateurs bloqués
  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerId: userId },
      include: { blocked: { select: publicUserSelect } },
    });

    return blocks.map((b) => b.blocked);
  }

  // Vérifie si l'un des deux a bloqué l'autre (utile ailleurs, ex: avant d'envoyer une demande)
  async isBlocked(userAId: string, userBId: string): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
    });
    return !!block;
  }
}