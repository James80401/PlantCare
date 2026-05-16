import {
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { BillingService } from './billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: JwtPayload) {
    return this.billingService.createCheckoutSession(user.sub, user.email);
  }

  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody as Buffer, signature);
  }
}
