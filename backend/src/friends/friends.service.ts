import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

const publicUserSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  bio: true,
  lastSeenAt: true, // ajoute cette ligne si absente
};

@Injectable()
export class FriendsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WebsocketGateway))
    private websocketGateway: WebsocketGateway,
  ) {}

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

        let request;

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new BadRequestException('Vous êtes déjà amis');
      }
      if (existing.status === 'PENDING') {
        throw new BadRequestException('Une demande est déjà en attente');
      }
      if (existing.status === 'DECLINED') {
        // On regarde qui essaie d'envoyer maintenant, par rapport à qui avait été refusé avant
        const isSamePersonAsBefore = existing.senderId === senderId;

        if (isSamePersonAsBefore) {
          // C'est la personne qui s'est fait refuser qui retente : on applique la limite
          if (existing.declineCount >= 3) {
            const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 jours
            const elapsed = Date.now() - existing.updatedAt.getTime();

            if (elapsed < COOLDOWN_MS) {
              const remainingDays = Math.ceil((COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
              throw new ForbiddenException(
                `Cette personne a refusé plusieurs fois votre demande. Réessayez dans ${remainingDays} jour(s).`,
              );
            }

            // Délai passé : on repart de zéro
            request = await this.prisma.friendship.update({
              where: { id: existing.id },
              data: { senderId, receiverId, status: 'PENDING', declineCount: 0 },
            });
          } else {
            request = await this.prisma.friendship.update({
              where: { id: existing.id },
              data: { senderId, receiverId, status: 'PENDING' },
            });
          }
        } else {
          // C'est la personne qui avait refusé qui envoie maintenant sa propre demande :
          // jamais bloquée, et on repart avec un compteur propre pour cette nouvelle direction
          request = await this.prisma.friendship.update({
            where: { id: existing.id },
            data: { senderId, receiverId, status: 'PENDING', declineCount: 0 },
          });
        }
      }
    } else {
      // Aucune relation n'existe encore entre ces deux personnes : nouvelle demande
      request = await this.prisma.friendship.create({
        data: { senderId, receiverId, status: 'PENDING' },
      });
    }

   // Notifie le destinataire en temps réel s'il est connecté
    this.websocketGateway.server.to(receiverId).emit('newFriendRequest', {
      requestId: request.id,
      senderId,
    });

    // Notifie aussi l'expéditeur (utile s'il a plusieurs onglets/appareils ouverts)
    this.websocketGateway.server.to(senderId).emit('friendRequestSent', {
      requestId: request.id,
      receiverId,
    });

    return request;
  
  

    
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

    const updated = await this.prisma.friendship.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
    });

    // Notifie l'expéditeur que sa demande a été acceptée
    this.websocketGateway.server.to(request.senderId).emit('friendRequestAccepted', {
      requestId,
      acceptedBy: userId,
    });

    return updated;
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

    const updated = await this.prisma.friendship.update({
      where: { id: requestId },
      data: {
        status: 'DECLINED',
        declineCount: { increment: 1 },
      },
    });

    // Notifie l'expéditeur que sa demande a été refusée
    this.websocketGateway.server.to(request.senderId).emit('friendRequestDeclined', {
      requestId,
      declinedBy: userId,
    });

    return updated;
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

    return friendships.map((f) =>
      f.senderId === userId ? f.receiver : f.sender,
    );
  }
    // Amis en commun entre l'utilisateur connecté et un autre utilisateur
  async getMutualFriends(userId: string, otherUserId: string) {
    const [myFriends, theirFriends] = await Promise.all([
      this.getFriends(userId),
      this.getFriends(otherUserId),
    ]);

    const theirFriendIds = new Set(theirFriends.map((u) => u.id));
    return myFriends.filter((u) => theirFriendIds.has(u.id));
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

  // Vérifie si l'un des deux a bloqué l'autre
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