import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

    @Post()
  create(@Request() req: any, @Body() body: { content: string; emoji?: string; imageUrl?: string }) {
    return this.notesService.createNote(req.user.userId, body.content, body.emoji, body.imageUrl);
  }
  @Get('friends')
  getFriendsNotes(@Request() req: any) {
    return this.notesService.getFriendsNotes(req.user.userId);
  }

  @Delete('me')
  deleteMyNote(@Request() req: any) {
    return this.notesService.deleteMyNote(req.user.userId);
  }
    @Get('history')
  getMyNotesHistory(@Request() req: any) {
    return this.notesService.getMyNotesHistory(req.user.userId);
  }
}