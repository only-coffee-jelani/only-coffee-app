import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { CouponGrant, CouponType, CouponStatus } from '@shared/database/entities/coupon-grant.entity';
import { EventEmitterService } from '../../common/services/event-emitter.service';

const TIMEZONE = 'America/Chicago';

// Starter coupons configuration
const STARTER_COUPONS_CONFIG = [
  {
    type: CouponType.PERCENT_OFF,
    percentOff: 50,
    label: '50% Off Drink',
    description: 'Get 50% off any drink',
    expiresInDays: 7,
    eligibleItems: { exclude: ['waffolino'] },
    channels: 'both',
    source: 'new_user',
  },
  {
    type: CouponType.PERCENT_OFF,
    percentOff: 50,
    label: '50% Off Drink',
    description: 'Get 50% off any drink',
    expiresInDays: 7,
    eligibleItems: { exclude: ['waffolino'] },
    channels: 'both',
    source: 'new_user',
  },
  {
    type: CouponType.FIXED_PRICE,
    priceOverrideCents: 199,
    label: 'First Sip for $1.99',
    description: 'Your first drink for just $1.99',
    expiresInDays: 7,
    eligibleItems: { exclude: ['waffolino', 'pistacchio'] },
    channels: 'both',
    source: 'new_user',
  },
  {
    type: CouponType.FIXED_PRICE,
    priceOverrideCents: 199,
    label: 'First Sip for $1.99',
    description: 'Your first drink for just $1.99',
    expiresInDays: 7,
    eligibleItems: { exclude: ['waffolino', 'pistacchio'] },
    channels: 'both',
    source: 'new_user',
  },
];

/**
 * Service responsible for granting coupons to users
 * Handles low-level coupon creation and starter coupon logic
 */
@Injectable()
export class CouponGrantService {
  private readonly logger = new Logger(CouponGrantService.name);

  constructor(
    @InjectRepository(CouponGrant)
    private readonly couponGrantRepository: Repository<CouponGrant>,
    private readonly eventEmitterService: EventEmitterService,
  ) {}

  /**
   * Grant a single coupon to a user
   */
  async grantCoupon(data: {
    userId: string;
    promoCodeId?: string;
    type: CouponType;
    label: string;
    description?: string;
    valueCents?: number;
    percentOff?: number;
    priceOverrideCents?: number;
    eligibleItems?: any;
    channels: string;
    expiresInDays: number;
    source: string;
    metadata?: any;
    idempotencyKey?: string;
  }): Promise<CouponGrant> {
    const now = DateTime.now().setZone(TIMEZONE);
    const expiresAt = now
      .plus({ days: data.expiresInDays })
      .endOf('day')
      .toJSDate();

    const coupon = this.couponGrantRepository.create({
      userId: data.userId,
      promoCodeId: data.promoCodeId,
      type: data.type,
      label: data.label,
      description: data.description,
      valueCents: data.valueCents,
      percentOff: data.percentOff,
      priceOverrideCents: data.priceOverrideCents,
      eligibleItems: data.eligibleItems,
      channels: data.channels,
      expiresAt,
      status: CouponStatus.ACTIVE,
      source: data.source,
      metadata: data.metadata,
      idempotencyKey: data.idempotencyKey,
    } as any) as unknown as CouponGrant;

    const savedCoupon = await this.couponGrantRepository.save(coupon);

    this.logger.log(
      `Granted ${data.type} coupon to user ${data.userId} (source: ${data.source})`,
    );

    // Emit coupon granted event
    await this.eventEmitterService.emitCouponGranted(
      savedCoupon.userId!,
      savedCoupon.id,
      {
        type: savedCoupon.type,
        source: savedCoupon.source,
        label: savedCoupon.label,
      },
    );

    return savedCoupon;
  }

  /**
   * Grant all 4 starter coupons to a new user
   */
  async grantStarterCoupons(userId: string): Promise<CouponGrant[]> {
    this.logger.log(`Granting starter coupons to user ${userId}`);

    const coupons: CouponGrant[] = [];

    for (const config of STARTER_COUPONS_CONFIG) {
      const coupon = await this.grantCoupon({
        userId,
        ...config,
      });
      coupons.push(coupon);
    }

    this.logger.log(
      `Successfully granted ${coupons.length} starter coupons to user ${userId}`,
    );

    return coupons;
  }

  /**
   * Grant multiple coupons from a promo code configuration
   */
  async grantCouponsFromPromoCode(
    userId: string,
    promoCodeId: string,
    couponConfig: any[],
    idempotencyKey?: string,
  ): Promise<CouponGrant[]> {
    this.logger.log(
      `Granting ${couponConfig.length} coupons from promo code to user ${userId}`,
    );

    const coupons: CouponGrant[] = [];

    for (const config of couponConfig) {
      const coupon = await this.grantCoupon({
        userId,
        promoCodeId,
        type: config.type,
        label: config.label,
        description: config.description,
        valueCents: config.valueCents,
        percentOff: config.percentOff,
        priceOverrideCents: config.priceOverrideCents,
        eligibleItems: config.eligibleItems,
        channels: config.channels || 'both',
        expiresInDays: config.expiresInDays,
        source: 'promo_code',
        metadata: config.metadata,
        idempotencyKey,
      });
      coupons.push(coupon);
    }

    return coupons;
  }
}
