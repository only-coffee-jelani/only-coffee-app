import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { EventEmitterService } from '../../common/services/event-emitter.service';
import { CouponGrant, CouponType, CouponStatus } from '@shared/database/entities';

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
    const expiresAt = DateTime.now().setZone(TIMEZONE).plus({ days: data.expiresInDays }).toJSDate();

    const couponGrant = this.couponGrantRepository.create({
      userId: data.userId,
      promoCodeId: data.promoCodeId || null,
      type: data.type,
      label: data.label,
      description: data.description || null,
      valueCents: data.valueCents || null,
      percentOff: data.percentOff || null,
      priceOverrideCents: data.priceOverrideCents || null,
      eligibleItems: data.eligibleItems || null,
      channels: data.channels,
      expiresAt,
      status: CouponStatus.ACTIVE,
      source: data.source,
      metadata: data.metadata || null,
    });

    const savedCoupon = await this.couponGrantRepository.save(couponGrant);

    // Emit event
    await this.eventEmitterService.emitCouponGranted(data.userId, savedCoupon.id, {
      type: data.type,
      source: data.source,
      label: data.label,
    });

    this.logger.log(`Granted coupon ${savedCoupon.id} to user ${data.userId}`);
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
