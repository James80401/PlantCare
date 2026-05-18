import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { WeatherService } from './weather.service';

@ApiTags('weather')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/weather')
export class WeatherController {
  constructor(private weather: WeatherService) {}

  @Get('advice/status')
  adviceStatus(@CurrentUser() user: JwtPayload) {
    return this.weather.getAdviceStatus(user.sub);
  }

  @Post('advice')
  fetchAdvice(
    @CurrentUser() user: JwtPayload,
    @Body() body: { confirmed?: boolean },
  ) {
    return this.weather.fetchPlantAdvice(user.sub, {
      confirmed: body?.confirmed === true,
    });
  }

  @Get('locations')
  searchLocations(@Query('q') query: string) {
    if (!query?.trim()) return [];
    return this.weather.searchLocations(query.trim());
  }
}
