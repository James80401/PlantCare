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
import { imageUploadOptions } from '../common/upload-options';
import { CreatePlantProgressDto } from './dto/create-plant-progress.dto';
import { UpdatePlantProgressDto } from './dto/update-plant-progress.dto';
import { PlantProgressService } from './plant-progress.service';

@ApiTags('plant-progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants/:plantId/progress')
export class PlantProgressController {
  constructor(private progress: PlantProgressService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Param('plantId') plantId: string) {
    return this.progress.findAll(user.sub, plantId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('photo', imageUploadOptions))
  create(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Body() dto: CreatePlantProgressDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.progress.create(user.sub, plantId, dto, file);
  }

  @Patch(':entryId')
  @UseInterceptors(FileInterceptor('photo', imageUploadOptions))
  update(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdatePlantProgressDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.progress.update(user.sub, plantId, entryId, dto, file);
  }

  @Delete(':entryId')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('plantId') plantId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.progress.remove(user.sub, plantId, entryId);
  }
}
