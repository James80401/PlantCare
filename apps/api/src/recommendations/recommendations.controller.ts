import { Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private recommendations: RecommendationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('plantId') plantId?: string) {
    return this.recommendations.listForUser(user.sub, { plantId });
  }

  @Post('refresh')
  refresh(@CurrentUser() user: JwtPayload, @Query('plantId') plantId?: string) {
    if (plantId) return this.recommendations.refreshPlant(user.sub, plantId);
    return this.recommendations.refreshForUser(user.sub);
  }

  @Patch(':id/done')
  markDone(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.recommendations.markDone(user.sub, id);
  }

  @Patch(':id/snooze')
  snooze(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.recommendations.snoozeUntilTomorrow(user.sub, id);
  }

  @Patch(':id/dismiss')
  dismiss(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.recommendations.dismiss(user.sub, id);
  }

  @Post(':id/task')
  convertToTask(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.recommendations.convertToTask(user.sub, id);
  }
}
