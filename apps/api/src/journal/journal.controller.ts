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
import { JournalService } from './journal.service';

@ApiTags('journal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants/:plantId/journal')
export class JournalController {
  constructor(private journal: JournalService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Param('plantId') plantId: string) {
    return this.journal.findAll(user.sub, plantId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  create(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Body('notes') notes: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.journal.create(user.sub, plantId, notes, file);
  }
}
