import {
  Controller,
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
import { DiagnosisService } from './diagnosis.service';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';

@ApiTags('diagnoses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants/:plantId/diagnose')
export class DiagnosisController {
  constructor(private diagnosisService: DiagnosisService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  diagnose(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('symptomsText') symptomsText?: string,
  ) {
    return this.diagnosisService.diagnose(user.sub, plantId, file, symptomsText);
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
