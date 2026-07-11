import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getUsers(@Request() req: any) {
    console.log('Utilisateur connecté:', req.user);
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });
  }
}