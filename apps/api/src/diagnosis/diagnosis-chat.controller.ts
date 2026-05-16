import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { DiagnosisChatService } from './diagnosis-chat.service';

@ApiTags('diagnoses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants/:plantId/diagnose/conversations')
export class DiagnosisChatController {
  constructor(private chat: DiagnosisChatService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Param('plantId') plantId: string) {
    return this.chat.listConversations(user.sub, plantId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Body('message') message?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.chat.createConversation(user.sub, plantId, message, file);
  }

  @Get(':conversationId')
  get(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chat.getConversation(user.sub, plantId, conversationId);
  }

  @Post(':conversationId/messages')
  @UseInterceptors(FileInterceptor('image'))
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
    @Body('message') message?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.chat.sendMessage(
      user.sub,
      plantId,
      conversationId,
      message ?? '',
      file,
    );
  }
}
