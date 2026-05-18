import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PerenualService } from './perenual.service';
import { PrismaService } from '../prisma/prisma.service';
import { parseSpeciesSearchFilters } from './species-filters';

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
  search(
    @Query('q') q: string,
    @Query('petSafe') petSafe?: string,
    @Query('lowLight') lowLight?: string,
    @Query('edible') edible?: string,
    @Query('droughtTolerant') droughtTolerant?: string,
    @Query('indoor') indoor?: string,
    @Query('outdoor') outdoor?: string,
    @Query('beginnerFriendly') beginnerFriendly?: string,
    @Query('succulent') succulent?: string,
  ) {
    return this.perenual.search(
      q || '',
      parseSpeciesSearchFilters({
        petSafe,
        lowLight,
        edible,
        droughtTolerant,
        indoor,
        outdoor,
        beginnerFriendly,
        succulent,
      }),
    );
  }

  @Get('browse')
  browse(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('petSafe') petSafe?: string,
    @Query('lowLight') lowLight?: string,
    @Query('edible') edible?: string,
    @Query('droughtTolerant') droughtTolerant?: string,
    @Query('indoor') indoor?: string,
    @Query('outdoor') outdoor?: string,
    @Query('beginnerFriendly') beginnerFriendly?: string,
    @Query('succulent') succulent?: string,
    @Query('sort') sort?: string,
  ) {
    const sortMode =
      sort === 'waterAsc' || sort === 'waterDesc' || sort === 'name' ? sort : 'name';
    return this.perenual.browse(
      q || '',
      parseSpeciesSearchFilters({
        petSafe,
        lowLight,
        edible,
        droughtTolerant,
        indoor,
        outdoor,
        beginnerFriendly,
        succulent,
      }),
      parseInt(page || '1', 10),
      parseInt(pageSize || '24', 10),
      sortMode,
    );
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.perenual.getOrFetchById(id);
  }
}
