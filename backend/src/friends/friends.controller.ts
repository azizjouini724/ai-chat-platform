import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  // Envoyer une demande d'ami
  @Post('request/:userId')
  sendRequest(@Request() req: any, @Param('userId') userId: string) {
    return this.friendsService.sendRequest(req.user.userId, userId);
  }

  // Accepter une demande
  @Post('accept/:requestId')
  acceptRequest(@Request() req: any, @Param('requestId') requestId: string) {
    return this.friendsService.acceptRequest(req.user.userId, requestId);
  }

  // Refuser une demande
  @Post('decline/:requestId')
  declineRequest(@Request() req: any, @Param('requestId') requestId: string) {
    return this.friendsService.declineRequest(req.user.userId, requestId);
  }

  // Liste de ses amis
  @Get()
  getFriends(@Request() req: any) {
    return this.friendsService.getFriends(req.user.userId);
  }

  // Demandes reçues en attente
  @Get('pending/received')
  getPendingReceived(@Request() req: any) {
    return this.friendsService.getPendingReceived(req.user.userId);
  }

  // Demandes envoyées en attente
  @Get('pending/sent')
  getPendingSent(@Request() req: any) {
    return this.friendsService.getPendingSent(req.user.userId);
  }

  // Supprimer un ami / annuler une demande
  @Delete(':friendshipId')
  removeFriend(@Request() req: any, @Param('friendshipId') friendshipId: string) {
    return this.friendsService.removeFriend(req.user.userId, friendshipId);
  }
}