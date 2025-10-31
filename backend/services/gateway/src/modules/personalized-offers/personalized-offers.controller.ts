import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PersonalizedOffersService } from './personalized-offers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class PersonalizedOffersController {
  constructor(
    private readonly personalizedOffersService: PersonalizedOffersService,
  ) {}

  /**
   * Get personalized offers for authenticated user
   * GET /api/v1/offers/personalized
   */
  @Get('personalized')
  async getPersonalizedOffers(@Request() req) {
    const userId = req.user.userId;
    return this.personalizedOffersService.getPersonalizedOffers(userId);
  }
}
