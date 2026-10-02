import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';
import { MailModule } from './mail/mail.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { WebsocketModule } from './websocket/websocket.module';
import { PostsModule } from './posts/posts.module';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 secondes
        limit: 300, // 300 requêtes max par minute, par IP (limite globale)
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    FriendsModule,
    MailModule,
    ConversationsModule,
    MessagesModule,
    WebsocketModule,
    PostsModule,
    NotesModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}