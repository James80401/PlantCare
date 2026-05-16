import { Controller, Get, UseGuards } from '@nestjs/common';
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

  @Get()
  forecast(@CurrentUser() user: JwtPayload) {
    return this.weather.getForecastForUser(user.sub);
  }
}
