import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketService } from './websocket.service';
import { WebsocketGateway } from './websocket.gateway';
import { FriendsModule } from '../friends/friends.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    JwtModule.register({}),
    forwardRef(() => FriendsModule),
    ConversationsModule,
  ],
  providers: [WebsocketService, WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}