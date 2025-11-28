import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { RedeemPromoCodeDto } from './dto/redeem-promo-code.dto';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';
import { GrantCouponDto } from './dto/grant-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, CouponStatus } from '@shared/database/entities';

@ApiTags('Coupons')
@ApiBearerAuth()
@Controller('v1/coupons')
@UseGuards(JwtAuthGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('redeem-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a promo code to receive coupons' })
  @ApiResponse({
    status: 200,
    description: 'Promo code redeemed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired promo code' })
  async redeemPromoCode(
    @Body() dto: RedeemPromoCodeDto,
    @CurrentUser() user: any,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const result = await this.couponsService.redeemPromoCode(
      user.id,
      dto.code,
      idempotencyKey || dto.idempotencyKey,
    );

    return {
      success: result.success,
      message: result.message,
      data: result.coupons,
    };
  }

  @Get('my-coupons')
  @ApiOperation({ summary: 'Get current user coupons' })
  @ApiResponse({ status: 200, description: 'List of user coupons' })
  async getMyCoupons(
    @CurrentUser() user: any,
    @Query('status') status?: CouponStatus,
  ) {
    const coupons = await this.couponsService.getUserCoupons(user.id, status);

    // Separate active and expired for better UX
    const activeCoupons = coupons.filter(
      (c) => c.status === CouponStatus.ACTIVE,
    );
    const expiredCoupons = coupons.filter(
      (c) => c.status === CouponStatus.EXPIRED,
    );
    const redeemedCoupons = coupons.filter(
      (c) => c.status === CouponStatus.REDEEMED,
    );

    return {
      success: true,
      data: {
        active: activeCoupons,
        expired: expiredCoupons,
        redeemed: redeemedCoupons,
        all: coupons,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get coupon details by ID' })
  @ApiResponse({ status: 200, description: 'Coupon details' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async getCouponById(@Param('id') id: string, @CurrentUser() user: any) {
    const coupon = await this.couponsService.getCouponById(id, user.id);

    return {
      success: true,
      data: coupon,
    };
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a coupon on an order' })
  @ApiResponse({ status: 200, description: 'Coupon redeemed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid coupon or already used' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async redeemCoupon(@Body() dto: RedeemCouponDto, @CurrentUser() user: any) {
    const coupon = await this.couponsService.redeemCoupon(
      dto.couponId,
      user.id,
      dto.orderId,
    );

    return {
      success: true,
      message: 'Coupon redeemed successfully',
      data: coupon,
    };
  }
}

@ApiTags('Admin - Coupons')
@ApiBearerAuth()
@Controller('v1/admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('grant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Manually grant a coupon to a user' })
  @ApiResponse({ status: 201, description: 'Coupon granted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async grantCoupon(@Body() dto: GrantCouponDto) {
    const coupon = await this.couponsService.adminGrantCoupon(dto.userId, {
      type: dto.type,
      label: dto.label,
      description: dto.description,
      valueCents: dto.valueCents,
      percentOff: dto.percentOff,
      priceOverrideCents: dto.priceOverrideCents,
      eligibleItems: dto.eligibleItems,
      channels: dto.channels,
      expiresInDays: dto.expiresInDays,
    });

    return {
      success: true,
      message: 'Coupon granted successfully',
      data: coupon,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all coupons across all users' })
  @ApiResponse({ status: 200, description: 'List of all coupons' })
  async getAllCoupons(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: CouponStatus,
  ) {
    // This would need pagination logic in the service
    const coupons = await this.couponsService.getUserCoupons('', status);

    return {
      success: true,
      data: coupons,
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a coupon' })
  @ApiResponse({ status: 200, description: 'Coupon cancelled' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async cancelCoupon(@Param('id') id: string) {
    const coupon = await this.couponsService.cancelCoupon(id);

    return {
      success: true,
      message: 'Coupon cancelled',
      data: coupon,
    };
  }
}
