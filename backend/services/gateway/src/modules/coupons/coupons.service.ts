import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, In, DataSource } from 'typeorm';
import { CouponGrant, CouponStatus, CouponType } from '@shared/database/entities/coupon-grant.entity';
import { User } from '@shared/database/entities/user.entity';
import { DateTime } from 'luxon';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { CouponGrantService } from './coupon-grant.service';
import { EventEmitterService } from '../../common/services/event-emitter.service';

// Timezone constant
const TIMEZONE = 'America/Chicago';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @InjectRepository(CouponGrant)
    private readonly couponGrantRepository: Repository<CouponGrant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly promoCodesService: PromoCodesService,
    private readonly couponGrantService: CouponGrantService,
    private readonly dataSource: DataSource,
    private readonly eventEmitterService: EventEmitterService,
  ) {}

  /**
   * Grant starter coupons to new user (delegates to CouponGrantService)
   */
  async grantStarterCoupons(userId: string): Promise<CouponGrant[]> {
    return this.couponGrantService.grantStarterCoupons(userId);
  }

  /**
   * Redeem a promo code and grant associated coupons
   */
  async redeemPromoCode(
    userId: string,
    code: string,
    idempotencyKey?: string,
  ): Promise<{
    success: boolean;
    message: string;
    coupons?: CouponGrant[];
  }> {
    // Check if user already used this code (idempotency)
    if (idempotencyKey) {
      const existing = await this.couponGrantRepository.findOne({
        where: {
          userId,
          metadata: { idempotencyKey } as any,
        },
      });

      if (existing) {
        this.logger.warn(
          `Duplicate promo code redemption attempt: ${code} by user ${userId}`,
        );
        return {
          success: true,
          message: 'Promo code already redeemed',
        };
      }
    }

    // Validate promo code
    const validation = await this.promoCodesService.validatePromoCode(code);

    if (!validation.valid || !validation.promoCode) {
      return {
        success: false,
        message: validation.reason || 'This code is no longer valid',
      };
    }

    const promoCode = validation.promoCode;

    // Check if user already used this specific code
    const alreadyUsed = await this.couponGrantRepository.findOne({
      where: {
        userId,
        promoCodeId: promoCode.id,
      },
    });

    if (alreadyUsed) {
      return {
        success: false,
        message: 'You have already used this promo code',
      };
    }

    // Grant coupons from promo code configuration
    const couponConfigs = promoCode.couponConfig as any[];
    const grantedCoupons = await this.couponGrantService.grantCouponsFromPromoCode(
      userId,
      promoCode.id,
      couponConfigs,
      idempotencyKey,
    );

    // Increment promo code usage
    await this.promoCodesService.incrementUsage(promoCode.id);

    // Emit promo code redeemed event
    await this.eventEmitterService.emitPromoCodeRedeemed(userId, promoCode.id, {
      code: promoCode.code,
      couponsGranted: grantedCoupons.length,
    });

    this.logger.log(
      `Promo code ${code} redeemed by user ${userId}, granted ${grantedCoupons.length} coupons`,
    );

    // Structured logging for CloudWatch
    // Example: logger.log('Promo code redeemed', { userId, promoCodeId: promoCode.id, code, couponsGranted: grantedCoupons.length });

    const firstExpiryDays = couponConfigs[0]?.expiresInDays || 7;
    return {
      success: true,
      message: `✅ ${grantedCoupons.length} new coupon${grantedCoupons.length > 1 ? 's' : ''} added! Expires in ${firstExpiryDays} days.`,
      coupons: grantedCoupons,
    };
  }

  /**
   * Get user's coupons (active and expired)
   */
  async getUserCoupons(
    userId: string,
    status?: CouponStatus,
  ): Promise<CouponGrant[]> {
    const whereClause: any = { userId };

    if (status) {
      whereClause.status = status;
    }

    const coupons = await this.couponGrantRepository.find({
      where: whereClause,
      order: {
        expiresAt: 'ASC', // Soonest to expire first
        createdAt: 'DESC',
      },
    });

    return coupons;
  }

  /**
   * Get a specific coupon by ID
   */
  async getCouponById(id: string, userId?: string): Promise<CouponGrant> {
    const whereClause: any = { id };

    if (userId) {
      whereClause.userId = userId;
    }

    const coupon = await this.couponGrantRepository.findOne({
      where: whereClause,
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  /**
   * Redeem a coupon on an order
   */
  async redeemCoupon(
    couponId: string,
    userId: string,
    orderId: string,
  ): Promise<CouponGrant> {
    return await this.dataSource.transaction(async (manager) => {
      const coupon = await manager.findOne(CouponGrant, {
        where: { id: couponId, userId },
      });

      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      if (coupon.status !== CouponStatus.ACTIVE) {
        throw new BadRequestException('Coupon is not active');
      }

      // Check if expired
      const now = DateTime.now().setZone(TIMEZONE);
      const expiryDate = DateTime.fromJSDate(coupon.expiresAt).setZone(
        TIMEZONE,
      );

      if (now >= expiryDate) {
        throw new BadRequestException('Coupon has expired');
      }

      // Mark as redeemed
      coupon.status = CouponStatus.REDEEMED;
      coupon.redeemedAt = now.toJSDate();
      coupon.redeemedOrderId = orderId;

      await manager.save(CouponGrant, coupon);

      // Emit coupon redeemed event
      await this.eventEmitterService.emitCouponRedeemed(userId, couponId, orderId, {
        type: coupon.type,
        label: coupon.label,
      });

      this.logger.log(
        `Coupon ${couponId} redeemed by user ${userId} on order ${orderId}`,
      );

      return coupon;
    });
  }

  /**
   * Mark expired coupons (run by cron job)
   */
  async markExpiredCoupons(): Promise<number> {
    const now = DateTime.now().setZone(TIMEZONE).toJSDate();

    const expiredCoupons = await this.couponGrantRepository.find({
      where: {
        status: CouponStatus.ACTIVE,
        expiresAt: LessThan(now),
      },
    });

    if (expiredCoupons.length === 0) {
      return 0;
    }

    const ids = expiredCoupons.map((c) => c.id);

    await this.couponGrantRepository.update(
      { id: In(ids) },
      { status: CouponStatus.EXPIRED },
    );

    // Emit coupon expired events
    for (const coupon of expiredCoupons) {
      await this.eventEmitterService.emitCouponExpired(coupon.userId, coupon.id, {
        type: coupon.type,
        label: coupon.label,
        expiresAt: coupon.expiresAt,
      });
    }

    this.logger.log(`Marked ${expiredCoupons.length} coupons as expired`);

    return expiredCoupons.length;
  }

  /**
   * Get coupons expiring soon (for notifications)
   */
  async getCouponsExpiringSoon(hoursBeforeExpiry: number): Promise<
    CouponGrant[]
  > {
    const now = DateTime.now().setZone(TIMEZONE);
    const targetTime = now.plus({ hours: hoursBeforeExpiry });

    const coupons = await this.couponGrantRepository
      .createQueryBuilder('coupon')
      .where('coupon.status = :status', { status: CouponStatus.ACTIVE })
      .andWhere('coupon.expiresAt >= :now', { now: now.toJSDate() })
      .andWhere('coupon.expiresAt <= :targetTime', {
        targetTime: targetTime.toJSDate(),
      })
      .leftJoinAndSelect('coupon.user', 'user')
      .getMany();

    return coupons;
  }

  /**
   * Cancel a coupon (admin or user)
   */
  async cancelCoupon(couponId: string, userId?: string): Promise<CouponGrant> {
    const whereClause: any = { id: couponId };

    if (userId) {
      whereClause.userId = userId;
    }

    const coupon = await this.couponGrantRepository.findOne({
      where: whereClause,
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException('Only active coupons can be cancelled');
    }

    coupon.status = CouponStatus.CANCELLED;
    await this.couponGrantRepository.save(coupon);

    this.logger.log(`Coupon ${couponId} cancelled`);

    return coupon;
  }

  /**
   * Admin: Grant coupon to specific user
   */
  async adminGrantCoupon(
    userId: string,
    couponData: {
      type: CouponType;
      label: string;
      description?: string;
      valueCents?: number;
      percentOff?: number;
      priceOverrideCents?: number;
      eligibleItems?: any;
      channels?: string;
      expiresInDays?: number;
    },
  ): Promise<CouponGrant> {
    return await this.couponGrantService.grantCoupon({
      ...couponData,
      userId,
      channels: couponData.channels || 'both',
      expiresInDays: couponData.expiresInDays || 7,
      source: 'admin_grant',
    });
  }
}
