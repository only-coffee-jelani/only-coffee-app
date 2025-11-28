import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
// Note: PromoCode and CouponGrant entities don't exist in new enterprise schema
// Promotions are now handled via the Promotion entity
// TODO: Refactor this module to use new Promotion schema
import { DateTime } from 'luxon';

// Timezone constant
const TIMEZONE = 'America/Chicago';

// Stub types for backward compatibility
type PromoCode = any;
type PromoType = any;
type CouponGrant = any;

@Injectable()
export class PromoCodesService {
  private readonly logger = new Logger(PromoCodesService.name);

  constructor(
    // @InjectRepository(PromoCode)
    // private readonly promoCodeRepository: Repository<PromoCode>,
    // @InjectRepository(CouponGrant)
    // private readonly couponGrantRepository: Repository<CouponGrant>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new promo code (admin only)
   */
  async createPromoCode(data: {
    code: string;
    description?: string;
    type: PromoType;
    maxUses?: number;
    expiresAt?: Date;
    couponConfig: any; // Array of coupon definitions
    metadata?: any;
    createdBy: string;
  }): Promise<PromoCode> {
    // STUB: PromoCode entity doesn't exist in new schema
    this.logger.warn('createPromoCode called but PromoCode entity does not exist. Use Promotion entity instead.');
    throw new BadRequestException('Promo codes are not supported. Use promotions instead.');
  }

  /**
   * Validate and check if promo code can be used
   */
  async validatePromoCode(code: string): Promise<{
    valid: boolean;
    promoCode?: PromoCode;
    reason?: string;
  }> {
    // STUB: PromoCode entity doesn't exist in new schema
    this.logger.warn('validatePromoCode called but PromoCode entity does not exist.');
    return { valid: false, reason: 'Promo codes are not supported. Use promotions instead.' };
  }

  /**
   * Increment usage count for a promo code
   */
  async incrementUsage(promoCodeId: string): Promise<void> {
    // STUB: PromoCode entity doesn't exist in new schema
    this.logger.warn('incrementUsage called but PromoCode entity does not exist.');
    throw new BadRequestException('Promo codes are not supported. Use promotions instead.');
  }

  /**
   * Get all promo codes with statistics (admin only)
   */
  async getAllPromoCodes(params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: PromoCode[]; total: number }> {
    // STUB: PromoCode entity doesn't exist in new schema
    this.logger.warn('getAllPromoCodes called but PromoCode entity does not exist.');
    return { data: [], total: 0 };
  }

  /**
   * Get promo code by ID with usage stats (admin only)
   */
  async getPromoCodeById(id: string): Promise<PromoCode> {
    // STUB: PromoCode entity doesn't exist in new schema
    this.logger.warn('getPromoCodeById called but PromoCode entity does not exist.');
    throw new NotFoundException('Promo codes are not supported. Use promotions instead.');
  }

  /**
   * Deactivate a promo code (admin only)
   */
  async deactivatePromoCode(id: string): Promise<PromoCode> {
    // STUB: PromoCode entity doesn't exist in new schema
    this.logger.warn('deactivatePromoCode called but PromoCode entity does not exist.');
    throw new NotFoundException('Promo codes are not supported. Use promotions instead.');
  }

  /**
   * Get promo code stats for analytics (admin only)
   */
  async getPromoCodeStats(id: string): Promise<{
    totalUses: number;
    totalCouponsGranted: number;
    totalCouponsRedeemed: number;
    redemptionRate: number;
  }> {
    // STUB: PromoCode entity doesn't exist in new schema
    this.logger.warn('getPromoCodeStats called but PromoCode entity does not exist.');
    return {
      totalUses: 0,
      totalCouponsGranted: 0,
      totalCouponsRedeemed: 0,
      redemptionRate: 0,
    };
  }
}
