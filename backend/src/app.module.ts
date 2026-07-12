import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { FriendsModule } from './friends/friends.module';



@Module({
  imports: [PrismaModule, AuthModule, UsersModule, CloudinaryModule, FriendsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
