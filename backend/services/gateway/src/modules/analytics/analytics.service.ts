import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ProgramEvent, ProgramEventType, CouponGrant, CouponStatus } from '@shared/database/entities';
import { DateTime } from 'luxon';

const TIMEZONE = 'America/Chicago';

export interface CouponMetrics {
  totalGranted: number;
  totalRedeemed: number;
  totalExpired: number;
  redemptionRate: number;
  revenueImpact: number;
}

export interface CouponBreakdown {
  type: string;
  granted: number;
  redeemed: number;
  redemptionRate: number;
}

export interface ChannelSplit {
  appOnly: number;
  inStore: number;
  both: number;
}

export interface BreakageMetrics {
  totalExpired: number;
  totalGranted: number;
  breakageRate: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ProgramEvent)
    private readonly programEventRepository: Repository<ProgramEvent>,
    @InjectRepository(CouponGrant)
    private readonly couponGrantRepository: Repository<CouponGrant>,
  ) {}

  /**
   * Get overall coupon metrics
   */
  async getCouponMetrics(startDate?: Date, endDate?: Date): Promise<CouponMetrics> {
    const dateFilter = this.getDateFilter(startDate, endDate);

    // Count events by type
    const grantedCount = await this.programEventRepository.count({
      where: {
        eventType: ProgramEventType.COUPON_GRANTED,
        ...dateFilter,
      },
    });

    const redeemedCount = await this.programEventRepository.count({
      where: {
        eventType: ProgramEventType.COUPON_REDEEMED,
        ...dateFilter,
      },
    });

    const expiredCount = await this.programEventRepository.count({
      where: {
        eventType: ProgramEventType.COUPON_EXPIRED,
        ...dateFilter,
      },
    });

    // Calculate redemption rate
    const redemptionRate = grantedCount > 0 ? (redeemedCount / grantedCount) * 100 : 0;

    // Calculate revenue impact (total discount amount from redeemed coupons)
    // TODO: Track discount amounts in event data for accurate calculation
    const revenueImpact = 0; // Placeholder

    return {
      totalGranted: grantedCount,
      totalRedeemed: redeemedCount,
      totalExpired: expiredCount,
      redemptionRate: Math.round(redemptionRate * 100) / 100,
      revenueImpact,
    };
  }

  /**
   * Get coupon breakdown by type
   */
  async getCouponBreakdown(startDate?: Date, endDate?: Date): Promise<CouponBreakdown[]> {
    const dateFilter = this.getDateFilter(startDate, endDate);

    // Get all granted events with coupon type in eventData
    const grantedEvents = await this.programEventRepository.find({
      where: {
        eventType: ProgramEventType.COUPON_GRANTED,
        ...dateFilter,
      },
      select: ['eventData'],
    });

    // Get all redeemed events with coupon type in eventData
    const redeemedEvents = await this.programEventRepository.find({
      where: {
        eventType: ProgramEventType.COUPON_REDEEMED,
        ...dateFilter,
      },
      select: ['eventData'],
    });

    // Group by coupon type
    const typeStats: Record<string, { granted: number; redeemed: number }> = {};

    grantedEvents.forEach((event) => {
      const type = event.eventData?.type || 'unknown';
      if (!typeStats[type]) {
        typeStats[type] = { granted: 0, redeemed: 0 };
      }
      typeStats[type].granted++;
    });

    redeemedEvents.forEach((event) => {
      const type = event.eventData?.type || 'unknown';
      if (!typeStats[type]) {
        typeStats[type] = { granted: 0, redeemed: 0 };
      }
      typeStats[type].redeemed++;
    });

    // Convert to array
    return Object.entries(typeStats).map(([type, stats]) => ({
      type,
      granted: stats.granted,
      redeemed: stats.redeemed,
      redemptionRate:
        stats.granted > 0
          ? Math.round((stats.redeemed / stats.granted) * 100 * 100) / 100
          : 0,
    }));
  }

  /**
   * Get channel split (app vs in-store redemptions)
   */
  async getChannelSplit(startDate?: Date, endDate?: Date): Promise<ChannelSplit> {
    const dateFilter = this.getDateFilter(startDate, endDate);

    // Get all redeemed coupons
    const redeemedCoupons = await this.couponGrantRepository.find({
      where: {
        status: CouponStatus.REDEEMED,
        ...dateFilter,
      },
      select: ['channels'],
    });

    const split: ChannelSplit = {
      appOnly: 0,
      inStore: 0,
      both: 0,
    };

    redeemedCoupons.forEach((coupon) => {
      if (coupon.channels === 'app_only') {
        split.appOnly++;
      } else if (coupon.channels === 'in_store' || coupon.channels === 'store_only') {
        split.inStore++;
      } else if (coupon.channels === 'both') {
        split.both++;
      }
    });

    return split;
  }

  /**
   * Get breakage metrics (expiry rate)
   */
  async getBreakageMetrics(startDate?: Date, endDate?: Date): Promise<BreakageMetrics> {
    const dateFilter = this.getDateFilter(startDate, endDate);

    const totalGranted = await this.programEventRepository.count({
      where: {
        eventType: ProgramEventType.COUPON_GRANTED,
        ...dateFilter,
      },
    });

    const totalExpired = await this.programEventRepository.count({
      where: {
        eventType: ProgramEventType.COUPON_EXPIRED,
        ...dateFilter,
      },
    });

    const breakageRate = totalGranted > 0 ? (totalExpired / totalGranted) * 100 : 0;

    return {
      totalExpired,
      totalGranted,
      breakageRate: Math.round(breakageRate * 100) / 100,
    };
  }

  /**
   * Helper to create date filter
   */
  private getDateFilter(startDate?: Date, endDate?: Date): any {
    if (!startDate && !endDate) {
      return {};
    }

    if (startDate && endDate) {
      return {
        createdAt: Between(startDate, endDate),
      };
    }

    if (startDate) {
      return {
        createdAt: Between(startDate, new Date()),
      };
    }

    return {};
  }
}
