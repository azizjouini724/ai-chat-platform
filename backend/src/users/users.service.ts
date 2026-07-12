import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

// Champs sûrs à renvoyer (jamais le password ni le refreshToken)
const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // Récupérer son propre profil
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  // Modifier son propre profil
  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: publicUserSelect,
    });

    return user;
  }
  async updateAvatar(userId: string, file: Express.Multer.File) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    // Supprime l'ancienne image si elle existe
    if (currentUser?.avatarUrl) {
      const oldPublicId = this.cloudinaryService.extractPublicId(currentUser.avatarUrl);
      if (oldPublicId) {
        await this.cloudinaryService.deleteImage(oldPublicId);
      }
    }

    const result = await this.cloudinaryService.uploadImage(file, 'avatars');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.secure_url },
      select: publicUserSelect,
    });

    return user;
  }

  // Voir le profil d'un autre utilisateur (par id)
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  // Rechercher des utilisateurs par nom d'utilisateur
  async searchUsers(query: string) {
    return this.prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: publicUserSelect,
      take: 20,
    });
  }
}