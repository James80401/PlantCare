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
import { imageUploadOptions } from '../common/upload-options';
import { DiagnosisChatService } from './diagnosis-chat.service';
import {
  ChatConfirmActionDraftDto,
  ChatHealthCheckActionDto,
  ChatJournalActionDto,
  ChatRecoveryTasksDto,
} from './dto/chat-action.dto';
import { SendDiagnosisMessageDto } from './dto/send-diagnosis-message.dto';

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
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  create(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Body() body: SendDiagnosisMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.chat.createConversation(
      user.sub,
      plantId,
      body.message,
      file,
      body.requestId,
    );
  }

  @Get(':conversationId')
  get(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chat.getConversation(user.sub, plantId, conversationId);
  }

  @Get(':conversationId/actions/context-questions')
  getGuidedContextQuestions(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chat.getGuidedContextQuestions(user.sub, plantId, conversationId);
  }

  @Post(':conversationId/messages')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: SendDiagnosisMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.chat.sendMessage(
      user.sub,
      plantId,
      conversationId,
      body.message ?? '',
      file,
      body.requestId,
    );
  }

  @Post(':conversationId/actions/journal-note')
  saveJournalNote(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: ChatJournalActionDto,
  ) {
    return this.chat.saveAssistantReplyToJournal(
      user.sub,
      plantId,
      conversationId,
      dto,
    );
  }

  @Post(':conversationId/actions/health-check')
  scheduleHealthCheck(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: ChatHealthCheckActionDto,
  ) {
    return this.chat.scheduleHealthCheckFromChat(
      user.sub,
      plantId,
      conversationId,
      dto,
    );
  }

  @Post(':conversationId/actions/recovery-suggestions')
  getRecoverySuggestions(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: ChatJournalActionDto,
  ) {
    return this.chat.getRecoverySuggestionsFromChat(
      user.sub,
      plantId,
      conversationId,
      dto,
    );
  }

  @Post(':conversationId/actions/recovery-tasks')
  applyRecoveryTasks(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: ChatRecoveryTasksDto,
  ) {
    return this.chat.applyRecoveryTasksFromChat(
      user.sub,
      plantId,
      conversationId,
      dto,
    );
  }

  @Post(':conversationId/actions/drafts')
  getActionDrafts(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: ChatJournalActionDto,
  ) {
    return this.chat.getActionDraftsFromChat(user.sub, plantId, conversationId, dto);
  }

  @Post(':conversationId/actions/recommendation-draft')
  confirmRecommendationDraft(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: ChatConfirmActionDraftDto,
  ) {
    return this.chat.confirmRecommendationDraft(user.sub, plantId, conversationId, dto);
  }

  @Post(':conversationId/actions/task-draft')
  confirmTaskDraft(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: ChatConfirmActionDraftDto,
  ) {
    return this.chat.confirmTaskDraft(user.sub, plantId, conversationId, dto);
  }
}
