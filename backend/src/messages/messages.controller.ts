import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Patch, Delete } from '@nestjs/common';
import { Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Post(':conversationId')
  sendMessage(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.sendMessage(
      req.user.userId,
      conversationId,
      dto.content,
      dto.imageUrl,
      dto.documentUrl,
    );
  }

 @Get(':conversationId')
  getMessages(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getMessages(
      conversationId,
      req.user.userId,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
      fileFilter: (req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Seuls les formats JPG, PNG et WEBP sont acceptés'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier envoyé');
    }
    const result = await this.cloudinaryService.uploadImage(file, 'messages/images');
    return { url: result.secure_url };
  }

  @Post('upload/document')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15 Mo max
      fileFilter: (req, file, callback) => {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Format de document non autorisé (PDF, DOC, DOCX, TXT uniquement)'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier envoyé');
    }
    const result = await this.cloudinaryService.uploadDocument(file, 'messages/documents');
    return { url: result.secure_url };
  }
@Patch('message/:messageId')
  editMessage(
    @Request() req: any,
    @Param('messageId') messageId: string,
    @Body() body: { content: string },
  ) {
    return this.messagesService.editMessage(req.user.userId, messageId, body.content);
  }

  @Delete('message/:messageId/all')
  deleteMessageForAll(@Request() req: any, @Param('messageId') messageId: string) {
    return this.messagesService.deleteMessageForAll(req.user.userId, messageId);
  }

  @Delete('message/:messageId/me')
  deleteMessageForMe(@Request() req: any, @Param('messageId') messageId: string) {
    return this.messagesService.deleteMessageForMe(req.user.userId, messageId);
  }
}