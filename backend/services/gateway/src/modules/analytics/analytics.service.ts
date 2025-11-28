/**
 * NOTE: AnalyticsService is temporarily disabled because ProgramEvent and CouponGrant
 * entities do not exist in the new enterprise schema.
 *
 * TODO: Redesign analytics to work with new schema entities
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
// import { ProgramEvent, ProgramEventType, CouponGrant, CouponStatus } from '@shared/database/entities';
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
    // @InjectRepository(ProgramEvent)
    // private readonly programEventRepository: Repository<ProgramEvent>,
    // @InjectRepository(CouponGrant)
    // private readonly couponGrantRepository: Repository<CouponGrant>,
  ) {}

  /**
   * Get overall coupon metrics
   * STUBBED: ProgramEvent and CouponGrant don't exist in new schema
   */
  async getCouponMetrics(startDate?: Date, endDate?: Date): Promise<CouponMetrics> {
    return {
      totalGranted: 0,
      totalRedeemed: 0,
      totalExpired: 0,
      redemptionRate: 0,
      revenueImpact: 0,
    };
  }

  /**
   * Get coupon breakdown by type
   * STUBBED: ProgramEvent and CouponGrant don't exist in new schema
   */
  async getCouponBreakdown(startDate?: Date, endDate?: Date): Promise<CouponBreakdown[]> {
    return [];
  }

  /**
   * Get channel split
   * STUBBED: ProgramEvent and CouponGrant don't exist in new schema
   */
  async getChannelSplit(startDate?: Date, endDate?: Date): Promise<ChannelSplit> {
    return {
      appOnly: 0,
      inStore: 0,
      both: 0,
    };
  }

  /**
   * Get breakage metrics
   * STUBBED: ProgramEvent and CouponGrant don't exist in new schema
   */
  async getBreakageMetrics(startDate?: Date, endDate?: Date): Promise<BreakageMetrics> {
    return {
      totalExpired: 0,
      totalGranted: 0,
      breakageRate: 0,
    };
  }

  /**
   * Get date filter
   */
  private getDateFilter(startDate?: Date, endDate?: Date): any {
    if (!startDate && !endDate) {
      return {};
    }
    return Between(startDate || new Date(0), endDate || new Date());
  }
}

/* ORIGINAL CODE COMMENTED OUT - See git history to restore

    // Note: Program events not implemented in new schema
    return {
      granted: 0,
      redeemed: 0,
      expired: 0,
      cancelled: 0,
    };
  }
*/