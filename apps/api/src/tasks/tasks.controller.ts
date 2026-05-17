import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ApplyScheduleSuggestionDto } from './dto/apply-schedule-suggestion.dto';
import { SkipTaskDto } from './dto/skip-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.tasksService.findForUser(user.sub, from, to);
  }

  @Get('schedule-suggestions')
  scheduleSuggestions(@CurrentUser() user: JwtPayload) {
    return this.tasksService.getScheduleSuggestions(user.sub);
  }

  @Post('schedule-suggestions/:suggestionId/apply')
  applyScheduleSuggestion(
    @CurrentUser() user: JwtPayload,
    @Param('suggestionId') suggestionId: string,
    @Body() _dto: ApplyScheduleSuggestionDto,
  ) {
    return this.tasksService.applyScheduleSuggestion(user.sub, suggestionId);
  }

  @Patch(':id/complete')
  complete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tasksService.complete(user.sub, id);
  }

  @Patch(':id/skip')
  skip(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: SkipTaskDto) {
    return this.tasksService.skip(user.sub, id, dto);
  }

  @Get(':id/instructions')
  instructions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tasksService.getInstructions(user.sub, id);
  }
}
