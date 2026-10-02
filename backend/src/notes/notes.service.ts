import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const publicUserSelect = {
  id: true,
  username: true,
  avatarUrl: true,
};

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  // Créer/remplacer sa note active
  async createNote(authorId: string, content: string, emoji?: string, imageUrl?: string) {
    if (!content?.trim()) {
      throw new BadRequestException('La note ne peut pas être vide');
    }

    // Une seule note active à la fois : on expire immédiatement l'ancienne (sans la supprimer, pour garder l'historique)
    await this.prisma.note.updateMany({
      where: { authorId, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return this.prisma.note.create({
      data: { authorId, content: content.trim(), emoji, imageUrl, expiresAt },
      include: { author: { select: publicUserSelect } },
    });
  }

  // Notes actives de mes amis + la mienne
  async getFriendsNotes(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });
    const friendIds = friendships.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId,
    );

    return this.prisma.note.findMany({
      where: {
        authorId: { in: [...friendIds, userId] },
        expiresAt: { gt: new Date() }, // filtre les notes expirées
      },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: publicUserSelect } },
    });
  }
    // Historique complet de mes propres notes (actives, expirées, remplacées)
  async getMyNotesHistory(userId: string) {
    return this.prisma.note.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: publicUserSelect } },
    });
  }

   // Supprimer sa propre note manuellement (en pratique : on l'expire, pour garder l'historique)
  async deleteMyNote(userId: string) {
    await this.prisma.note.updateMany({
      where: { authorId: userId, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });
    return { message: 'Note supprimée' };
  }
}