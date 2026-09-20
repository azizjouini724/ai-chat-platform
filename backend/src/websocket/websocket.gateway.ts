import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendsService } from '../friends/friends.service';
import { ConversationsService } from '../conversations/conversations.service';
import { SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('WebsocketGateway');

  private onlineUsers = new Map<string, number>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => FriendsService))
    private friendsService: FriendsService,
    private conversationsService: ConversationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Connexion refusée (pas de token) : ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      const userId = payload.sub;
      client.data.userId = userId;
      client.data.email = payload.email;

      // Chaque client rejoint une room personnelle nommée par son userId
      client.join(userId);

      // Fait rejoindre le client à toutes les rooms de ses conversations
      const conversations = await this.conversationsService.getMyConversations(userId);
      for (const conv of conversations) {
        client.join(`conversation:${conv.id}`);
      }

      const currentCount = this.onlineUsers.get(userId) || 0;
      this.onlineUsers.set(userId, currentCount + 1);

      // Envoie un instantané de l'état actuel des amis en ligne — à CHAQUE connexion, pas juste la première
      const friendsList = await this.friendsService.getFriends(userId);
      const onlineFriendIds = friendsList
        .filter((friend) => this.onlineUsers.has(friend.id))
        .map((friend) => friend.id);
      client.emit('onlineFriendsList', { onlineFriendIds });

      if (currentCount === 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { isOnline: true },
        });

        // On ne notifie que les amis de cet utilisateur, pas tout le monde
        const friends = await this.friendsService.getFriends(userId);
        for (const friend of friends) {
          this.server.to(friend.id).emit('userOnline', { userId });
        }

        this.logger.log(`Utilisateur en ligne : ${userId} (${friends.length} amis notifiés)`);
      }

      this.logger.log(`Client connecté : ${client.id} (user ${userId})`);
    } catch (error) {
      this.logger.warn(`Connexion refusée (token invalide) : ${client.id}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    const currentCount = this.onlineUsers.get(userId) || 0;
    const newCount = Math.max(currentCount - 1, 0);

    if (newCount === 0) {
      this.onlineUsers.delete(userId);
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeenAt: new Date() },
      });

      const friends = await this.friendsService.getFriends(userId);
      for (const friend of friends) {
        this.server.to(friend.id).emit('userOffline', { userId });
      }

      this.logger.log(`Utilisateur hors ligne : ${userId}`);
    } else {
      this.onlineUsers.set(userId, newCount);
    }

    this.logger.log(`Client déconnecté : ${client.id}`);
    
  }
  @SubscribeMessage('startTyping')
  handleStartTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    client.to(`conversation:${data.conversationId}`).emit('userStoppedTyping', {
      conversationId: data.conversationId,
      userId,
    });
  }
  @SubscribeMessage('joinConversation')
  handleJoinConversation(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { conversationId: string },
  ) {
  client.join(`conversation:${data.conversationId}`);
  }
}