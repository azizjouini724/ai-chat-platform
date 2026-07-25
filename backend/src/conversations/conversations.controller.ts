import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGroupDto } from './dto/create-group.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Post('private/:userId')
  getOrCreatePrivate(@Request() req: any, @Param('userId') userId: string) {
    return this.conversationsService.getOrCreatePrivateConversation(
      req.user.userId,
      userId,
    );
  }

  @Post('group')
  createGroup(@Request() req: any, @Body() dto: CreateGroupDto) {
    return this.conversationsService.createGroup(req.user.userId, dto.name, dto.memberIds);
  }

  @Get()
  getMyConversations(@Request() req: any) {
    return this.conversationsService.getMyConversations(req.user.userId);
  }

  @Get(':id')
  getConversationById(@Request() req: any, @Param('id') id: string) {
    return this.conversationsService.getConversationById(id, req.user.userId);
  }

  // Admin ajoute directement un membre
  @Post(':id/members/:userId')
  addMember(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('userId') userId: string,
  ) {
    return this.conversationsService.addMember(conversationId, req.user.userId, userId);
  }

  // Un membre propose d'ajouter quelqu'un
  @Post(':id/propose/:userId')
  proposeMember(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('userId') userId: string,
  ) {
    return this.conversationsService.proposeMember(conversationId, req.user.userId, userId);
  }

  // Admin accepte une proposition
  @Post(':id/join-requests/:requestId/accept')
  acceptJoinRequest(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.conversationsService.acceptJoinRequest(conversationId, req.user.userId, requestId);
  }

  // Admin refuse une proposition
  @Post(':id/join-requests/:requestId/decline')
  declineJoinRequest(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.conversationsService.declineJoinRequest(conversationId, req.user.userId, requestId);
  }

  // Liste des propositions en attente (admin uniquement)
  @Get(':id/join-requests')
  getPendingJoinRequests(@Request() req: any, @Param('id') conversationId: string) {
    return this.conversationsService.getPendingJoinRequests(conversationId, req.user.userId);
  }
  @Post(':id/read')
  markAsRead(@Request() req: any, @Param('id') conversationId: string) {
    return this.conversationsService.markAsRead(conversationId, req.user.userId);
  }
  @Delete(':id/leave')
  leaveGroup(@Request() req: any, @Param('id') conversationId: string) {
    return this.conversationsService.leaveGroup(conversationId, req.user.userId);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('userId') userId: string,
  ) {
    return this.conversationsService.removeMember(conversationId, req.user.userId, userId);
  }

  @Post(':id/promote/:userId')
  promoteToAdmin(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('userId') userId: string,
  ) {
    return this.conversationsService.promoteToAdmin(conversationId, req.user.userId, userId);
  }
  @Patch(':id')
  updateGroupInfo(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Body() body: { name?: string; avatarUrl?: string },
  ) {
    return this.conversationsService.updateGroupInfo(
      conversationId,
      req.user.userId,
      body.name,
      body.avatarUrl,
    );
  }

  @Delete(':id/hide')
  hideConversation(@Request() req: any, @Param('id') conversationId: string) {
    return this.conversationsService.hideConversation(conversationId, req.user.userId);
  }
}