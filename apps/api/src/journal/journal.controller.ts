import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
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
    @Body() dto: CreateJournalDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.journal.create(user.sub, plantId, dto, file);
  }

  @Patch(':entryId')
  @UseInterceptors(FileInterceptor('photo'))
  update(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateJournalDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.journal.update(user.sub, plantId, entryId, dto, file);
  }

  @Delete(':entryId')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.journal.remove(user.sub, plantId, entryId);
  }
}
