import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GiftsService } from './gifts.service';
import { CreateGiftCardDto, RedeemGiftCardDto } from './dto';

@ApiTags('gifts')
@Controller('gifts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new gift card' })
  @ApiResponse({
    status: 201,
    description: 'Gift card created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createGiftCardDto: CreateGiftCardDto,
  ) {
    return this.giftsService.create(userId, createGiftCardDto);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a gift card for an order' })
  @ApiResponse({
    status: 200,
    description: 'Gift card redeemed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid gift card or order' })
  @ApiResponse({ status: 404, description: 'Gift card or order not found' })
  async redeem(
    @CurrentUser('sub') userId: string,
    @Body() redeemGiftCardDto: RedeemGiftCardDto,
  ) {
    return this.giftsService.redeem(userId, redeemGiftCardDto);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get gift card details by code' })
  @ApiResponse({
    status: 200,
    description: 'Gift card found',
  })
  @ApiResponse({ status: 404, description: 'Gift card not found' })
  async findByCode(@Param('code') code: string) {
    return this.giftsService.findByCode(code);
  }

  @Get('code/:code/balance')
  @ApiOperation({ summary: 'Check gift card balance' })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved',
  })
  @ApiResponse({ status: 404, description: 'Gift card not found' })
  async checkBalance(@Param('code') code: string) {
    return this.giftsService.checkBalance(code);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get gift cards sent by current user' })
  @ApiResponse({
    status: 200,
    description: 'Gift cards retrieved',
  })
  async findSent(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.giftsService.findBySender(userId, limit);
  }

  @Get('received')
  @ApiOperation({ summary: 'Get gift cards received by current user' })
  @ApiResponse({
    status: 200,
    description: 'Gift cards retrieved',
  })
  async findReceived(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.giftsService.findByRecipient(userId, limit);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a gift card' })
  @ApiResponse({
    status: 200,
    description: 'Gift card cancelled',
  })
  @ApiResponse({ status: 400, description: 'Cannot cancel gift card' })
  @ApiResponse({ status: 404, description: 'Gift card not found' })
  async cancel(
    @CurrentUser('sub') userId: string,
    @Param('id') giftCardId: string,
  ) {
    return this.giftsService.cancel(giftCardId, userId);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate gift card after payment (internal use)' })
  @ApiResponse({
    status: 200,
    description: 'Gift card activated',
  })
  @ApiResponse({ status: 400, description: 'Invalid gift card state' })
  @ApiResponse({ status: 404, description: 'Gift card not found' })
  async activate(
    @Param('id') giftCardId: string,
    @Body('stripePaymentIntentId') stripePaymentIntentId: string,
  ) {
    return this.giftsService.activate(giftCardId, stripePaymentIntentId);
  }
}
