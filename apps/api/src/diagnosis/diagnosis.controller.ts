import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { imageUploadOptions } from '../common/upload-options';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisChatService } from './diagnosis-chat.service';
import { ApplyRecoveryTasksDto } from './dto/apply-recovery-tasks.dto';
import { FollowUpTaskDto } from './dto/follow-up-task.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';

@ApiTags('diagnoses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants/:plantId/diagnose')
export class DiagnosisController {
  constructor(
    private diagnosisService: DiagnosisService,
    private chat: DiagnosisChatService,
  ) {}

  @Get('context')
  getContextSummary(@CurrentUser() user: JwtPayload, @Param('plantId') plantId: string) {
    return this.chat.getContextSummary(user.sub, plantId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  diagnose(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('symptomsText') symptomsText?: string,
    @Body('symptomDuration') symptomDuration?: 'TODAY' | 'DAYS_2_3' | 'DAYS_4_7' | 'WEEKS_2_PLUS',
    @Body('recentCareChange')
    recentCareChange?:
      | 'NONE'
      | 'WATERING'
      | 'LIGHT'
      | 'REPOT'
      | 'FERTILIZER'
      | 'TEMPERATURE'
      | 'PEST_TREATMENT',
    @Body('pestsVisible') pestsVisible?: string,
  ) {
    return this.diagnosisService.diagnose(user.sub, plantId, file, symptomsText, {
      symptomDuration,
      recentCareChange,
      pestsVisible:
        pestsVisible == null ? undefined : pestsVisible === 'true' || pestsVisible === '1',
    });
  }

  @Get(':diagnosisId/recovery-suggestions')
  getRecoverySuggestions(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('diagnosisId') diagnosisId: string,
  ) {
    return this.diagnosisService.getRecoverySuggestions(
      user.sub,
      plantId,
      diagnosisId,
    );
  }

  @Post(':diagnosisId/recovery-tasks')
  applyRecoveryTasks(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('diagnosisId') diagnosisId: string,
    @Body() dto: ApplyRecoveryTasksDto,
  ) {
    return this.diagnosisService.applyRecoveryTasks(
      user.sub,
      plantId,
      diagnosisId,
      dto,
    );
  }

  @Post(':diagnosisId/follow-up-task')
  createFollowUpTask(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('diagnosisId') diagnosisId: string,
    @Body() dto: FollowUpTaskDto,
  ) {
    return this.diagnosisService.createFollowUpTask(
      user.sub,
      plantId,
      diagnosisId,
      dto,
    );
  }

  @Patch(':diagnosisId')
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('diagnosisId') diagnosisId: string,
    @Body() dto: UpdateDiagnosisDto,
  ) {
    return this.diagnosisService.updateStatus(user.sub, plantId, diagnosisId, dto);
  }
}
