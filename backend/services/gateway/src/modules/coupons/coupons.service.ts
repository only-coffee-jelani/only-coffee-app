/**
 * NOTE: CouponsService is temporarily disabled because the CouponGrant entity
 * does not exist in the new enterprise schema. The coupon functionality needs
 * to be redesigned or removed.
 *
 * TODO: Either add coupon tables to enterprise schema or remove coupon functionality
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, In, DataSource } from 'typeorm';
import { CouponGrant, CouponStatus, CouponType, User } from '@shared/database/entities';
import { DateTime } from 'luxon';
import { EventEmitterService } from '../../common/services/event-emitter.service';

// Timezone constant
const TIMEZONE = 'America/Chicago';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    // @InjectRepository(CouponGrant)
    // private readonly couponGrantRepository: Repository<CouponGrant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    // private readonly promoCodesService: PromoCodesService,
    // private readonly couponGrantService: CouponGrantService,
    private readonly dataSource: DataSource,
    private readonly eventEmitterService: EventEmitterService,
  ) {}

  /**
   * Grant starter coupons to new user (delegates to CouponGrantService)
   * STUBBED: Coupon functionality not available in new schema
   */
  async grantStarterCoupons(userId: string): Promise<any[]> {
    this.logger.warn('grantStarterCoupons called but coupon functionality is disabled');
    return [];
  }

  /**
   * Redeem a promo code and grant associated coupons
   * STUBBED: Coupon functionality not available in new schema
   */
  async redeemPromoCode(
    userId: string,
    code: string,
    idempotencyKey?: string,
  ): Promise<{
    success: boolean;
    message: string;
    coupons?: any[];
  }> {
    this.logger.warn('redeemPromoCode called but coupon functionality is disabled');
    throw new BadRequestException('Coupon functionality is currently unavailable');
  }

  /**
   * Get user's coupons (active and expired)
   * STUBBED: Coupon functionality not available in new schema
   */
  async getUserCoupons(userId: string, status?: any): Promise<any[]> {
    this.logger.warn('getUserCoupons called but coupon functionality is disabled');
    return [];
  }

  /**
   * Get a specific coupon by ID
   * STUBBED: Coupon functionality not available in new schema
   */
  async getCouponById(id: string, userId?: string): Promise<any> {
    this.logger.warn('getCouponById called but coupon functionality is disabled');
    throw new NotFoundException('Coupon not found');
  }

  /**
   * Redeem a coupon on an order
   * STUBBED: Coupon functionality not available in new schema
   */
  async redeemCoupon(couponId: string, userId: string, orderId: string): Promise<any> {
    this.logger.warn('redeemCoupon called but coupon functionality is disabled');
    throw new BadRequestException('Coupon functionality is currently unavailable');
  }

  /**
   * Mark expired coupons (run by cron job)
   * STUBBED: Coupon functionality not available in new schema
   */
  async markExpiredCoupons(): Promise<number> {
    this.logger.warn('markExpiredCoupons called but coupon functionality is disabled');
    return 0;
  }

  /**
   * Grant anniversary coupons (run by cron job)
   * STUBBED: Coupon functionality not available in new schema
   */
  async grantAnniversaryCoupons(): Promise<number> {
    this.logger.warn('grantAnniversaryCoupons called but coupon functionality is disabled');
    return 0;
  }

  /**
   * Get coupon statistics for admin dashboard
   * STUBBED: Coupon functionality not available in new schema
   */
  async getCouponStats(startDate?: Date, endDate?: Date): Promise<any> {
    this.logger.warn('getCouponStats called but coupon functionality is disabled');
    return {
      totalActive: 0,
      totalRedeemed: 0,
      totalExpired: 0,
      redemptionRate: 0,
    };
  }

  /**
   * Admin grant coupon to user
   * STUBBED: Coupon functionality not available in new schema
   */
  async adminGrantCoupon(userId: string, couponData: any): Promise<any> {
    this.logger.warn('adminGrantCoupon called but coupon functionality is disabled');
    throw new BadRequestException('Coupon functionality is currently unavailable');
  }

  /**
   * Cancel a coupon
   * STUBBED: Coupon functionality not available in new schema
   */
  async cancelCoupon(couponId: string): Promise<any> {
    this.logger.warn('cancelCoupon called but coupon functionality is disabled');
    throw new BadRequestException('Coupon functionality is currently unavailable');
  }
}

/* ORIGINAL CODE COMMENTED OUT - Coupon functionality disabled - See git history to restore */
