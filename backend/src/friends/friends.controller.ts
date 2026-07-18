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

  @Post('request/:userId')
  sendRequest(@Request() req: any, @Param('userId') userId: string) {
    return this.friendsService.sendRequest(req.user.userId, userId);
  }

  @Post('accept/:requestId')
  acceptRequest(@Request() req: any, @Param('requestId') requestId: string) {
    return this.friendsService.acceptRequest(req.user.userId, requestId);
  }

  @Post('decline/:requestId')
  declineRequest(@Request() req: any, @Param('requestId') requestId: string) {
    return this.friendsService.declineRequest(req.user.userId, requestId);
  }

  @Get()
  getFriends(@Request() req: any) {
    return this.friendsService.getFriends(req.user.userId);
  }

  @Get('pending/received')
  getPendingReceived(@Request() req: any) {
    return this.friendsService.getPendingReceived(req.user.userId);
  }

  @Get('pending/sent')
  getPendingSent(@Request() req: any) {
    return this.friendsService.getPendingSent(req.user.userId);
  }

  @Delete(':friendshipId')
  removeFriend(@Request() req: any, @Param('friendshipId') friendshipId: string) {
    return this.friendsService.removeFriend(req.user.userId, friendshipId);
  }

  @Post('block/:userId')
  blockUser(@Request() req: any, @Param('userId') userId: string) {
    return this.friendsService.blockUser(req.user.userId, userId);
  }

  @Delete('block/:userId')
  unblockUser(@Request() req: any, @Param('userId') userId: string) {
    return this.friendsService.unblockUser(req.user.userId, userId);
  }

  @Get('blocked')
  getBlockedUsers(@Request() req: any) {
    return this.friendsService.getBlockedUsers(req.user.userId);
  }
}