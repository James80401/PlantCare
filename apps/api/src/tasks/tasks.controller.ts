import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
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

  @Patch(':id/complete')
  complete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tasksService.complete(user.sub, id);
  }

  @Patch(':id/skip')
  skip(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tasksService.skip(user.sub, id);
  }

  @Get(':id/instructions')
  instructions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tasksService.getInstructions(user.sub, id);
  }
}
