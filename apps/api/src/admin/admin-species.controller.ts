import { Body, Controller, Get, Param, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAuditInterceptor } from './admin-audit.interceptor';
import { AdminSpeciesService } from './admin-species.service';
import { AdminGuard } from './admin.guard';
import { AdminSpeciesReviewDto } from './dto/admin-species-review.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('admin/species')
export class AdminSpeciesController {
  constructor(private species: AdminSpeciesService) {}

  @Get('external')
  listExternalSpecies() {
    return this.species.listExternalSpecies();
  }

  @Patch('external/:speciesId/review')
  reviewExternalSpecies(
    @Param('speciesId') speciesId: string,
    @Body() dto: AdminSpeciesReviewDto,
  ) {
    return this.species.updateExternalSpeciesStatus(speciesId, dto);
  }
}
