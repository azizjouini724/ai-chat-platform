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

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new BadRequestException('Vous êtes déjà amis');
      }
      if (existing.status === 'PENDING') {
        throw new BadRequestException('Une demande est déjà en attente');
      }
      // Si DECLINED : on réutilise la ligne existante, on relance la demande
      if (existing.status === 'DECLINED') {
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
      data: { status: 'DECLINED' },
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
}