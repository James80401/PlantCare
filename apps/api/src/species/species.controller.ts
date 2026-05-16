import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PerenualService } from './perenual.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('species')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('species')
export class SpeciesController {
  constructor(
    private perenual: PerenualService,
    private prisma: PrismaService,
  ) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.perenual.search(q || '');
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.perenual.getOrFetchById(id);
  }
}
