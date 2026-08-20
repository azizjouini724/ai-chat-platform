import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ConversationsModule } from '../conversations/conversations.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { FriendsModule } from '../friends/friends.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [ConversationsModule, CloudinaryModule, FriendsModule, WebsocketModule],
  providers: [MessagesService],
  controllers: [MessagesController],
})
export class MessagesModule {}