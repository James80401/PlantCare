import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { WeatherService } from './weather.service';
import { FetchWeatherAdviceDto } from './dto/fetch-weather-advice.dto';
import { SchedulerService } from '../scheduler/scheduler.service';

@ApiTags('weather')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/weather')
export class WeatherController {
  constructor(
    private weather: WeatherService,
    private scheduler: SchedulerService,
  ) {}

  @Get('advice/status')
  adviceStatus(@CurrentUser() user: JwtPayload) {
    return this.weather.getAdviceStatus(user.sub);
  }

  @Post('advice')
  async fetchAdvice(
    @CurrentUser() user: JwtPayload,
    @Body() body: FetchWeatherAdviceDto,
  ) {
    const advice = await this.weather.fetchPlantAdvice(user.sub, {
      confirmed: body?.confirmed === true,
    });
    await this.scheduler.autoPostponeOutdoorWateringFromWeather(user.sub);
    return advice;
  }

  @Get('locations')
  searchLocations(@Query('q') query: string) {
    if (!query?.trim()) return [];
    return this.weather.searchLocations(query.trim());
  }
}
