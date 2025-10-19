import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  PromoCode,
  PromoType,
  CouponGrant,
} from '@shared/database/entities';
import { DateTime } from 'luxon';

// Timezone constant
const TIMEZONE = 'America/Chicago';

@Injectable()
export class PromoCodesService {
  private readonly logger = new Logger(PromoCodesService.name);

  constructor(
    @InjectRepository(PromoCode)
    private readonly promoCodeRepository: Repository<PromoCode>,
    @InjectRepository(CouponGrant)
    private readonly couponGrantRepository: Repository<CouponGrant>,
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
    // Normalize code to uppercase
    const normalizedCode = data.code.toUpperCase().trim();

    // Check if code already exists
    const existing = await this.promoCodeRepository.findOne({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new ConflictException('Promo code already exists');
    }

    // Validate expiration date if provided
    if (data.expiresAt) {
      const now = DateTime.now().setZone(TIMEZONE);
      const expiryDate = DateTime.fromJSDate(data.expiresAt).setZone(TIMEZONE);

      if (expiryDate <= now) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    // Create promo code
    const promoCode = this.promoCodeRepository.create({
      code: normalizedCode,
      description: data.description,
      type: data.type,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt,
      couponConfig: data.couponConfig,
      metadata: data.metadata,
      createdBy: data.createdBy,
      isActive: true,
      usedCount: 0,
    });

    await this.promoCodeRepository.save(promoCode);

    this.logger.log(
      `Promo code created: ${normalizedCode} by ${data.createdBy}`,
    );

    return promoCode;
  }

  /**
   * Validate and check if promo code can be used
   */
  async validatePromoCode(code: string): Promise<{
    valid: boolean;
    promoCode?: PromoCode;
    reason?: string;
  }> {
    const normalizedCode = code.toUpperCase().trim();

    const promoCode = await this.promoCodeRepository.findOne({
      where: { code: normalizedCode },
    });

    if (!promoCode) {
      return { valid: false, reason: 'Promo code not found' };
    }

    if (!promoCode.isActive) {
      return { valid: false, reason: 'Promo code is inactive' };
    }

    // Check expiration
    if (promoCode.expiresAt) {
      const now = DateTime.now().setZone(TIMEZONE);
      const expiryDate = DateTime.fromJSDate(promoCode.expiresAt).setZone(
        TIMEZONE,
      );

      if (now >= expiryDate) {
        return { valid: false, reason: 'This code is no longer valid' };
      }
    }

    // Check usage limit
    if (
      promoCode.type !== PromoType.UNLIMITED &&
      promoCode.maxUses &&
      promoCode.usedCount >= promoCode.maxUses
    ) {
      return {
        valid: false,
        reason: 'Promo code has reached its usage limit',
      };
    }

    return { valid: true, promoCode };
  }

  /**
   * Increment usage count for a promo code
   */
  async incrementUsage(promoCodeId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const promoCode = await manager.findOne(PromoCode, {
        where: { id: promoCodeId },
      });

      if (!promoCode) {
        throw new NotFoundException('Promo code not found');
      }

      promoCode.usedCount += 1;
      await manager.save(PromoCode, promoCode);
    });
  }

  /**
   * Get all promo codes with statistics (admin only)
   */
  async getAllPromoCodes(params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: PromoCode[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (params.isActive !== undefined) {
      whereClause.isActive = params.isActive;
    }

    const [data, total] = await this.promoCodeRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  /**
   * Get promo code by ID with usage stats (admin only)
   */
  async getPromoCodeById(id: string): Promise<PromoCode> {
    const promoCode = await this.promoCodeRepository.findOne({
      where: { id },
      relations: ['coupons'],
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    return promoCode;
  }

  /**
   * Deactivate a promo code (admin only)
   */
  async deactivatePromoCode(id: string): Promise<PromoCode> {
    const promoCode = await this.promoCodeRepository.findOne({
      where: { id },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    promoCode.isActive = false;
    await this.promoCodeRepository.save(promoCode);

    this.logger.log(`Promo code deactivated: ${promoCode.code}`);

    return promoCode;
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
    const promoCode = await this.getPromoCodeById(id);

    const totalCouponsGranted = await this.couponGrantRepository.count({
      where: { promoCodeId: id },
    });

    const totalCouponsRedeemed = await this.couponGrantRepository.count({
      where: {
        promoCodeId: id,
        status: 'redeemed' as any,
      },
    });

    const redemptionRate =
      totalCouponsGranted > 0
        ? (totalCouponsRedeemed / totalCouponsGranted) * 100
        : 0;

    return {
      totalUses: promoCode.usedCount,
      totalCouponsGranted,
      totalCouponsRedeemed,
      redemptionRate: Math.round(redemptionRate * 100) / 100,
    };
  }
}
