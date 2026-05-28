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
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { PlantsService } from './plants.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

@ApiTags('plants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants')
export class PlantsController {
  constructor(private plantsService: PlantsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.plantsService.findAll(user.sub);
  }

  @Post('identify')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  identify(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.plantsService.identify(user.sub, user.planTier as import('@prisma/client').PlanTier, file);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.plantsService.uploadImage(file);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePlantDto) {
    return this.plantsService.create(user.sub, user.planTier as import('@prisma/client').PlanTier, dto);
  }

  @Get(':id/timeline')
  timeline(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.plantsService.getTimeline(user.sub, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.plantsService.findOne(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePlantDto,
  ) {
    return this.plantsService.update(
      user.sub,
      id,
      user.planTier as import('@prisma/client').PlanTier,
      dto,
    );
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.plantsService.remove(user.sub, id);
  }
}
