import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CouponGrant, CouponType, CouponStatus } from '@shared/database/entities/coupon-grant.entity';
import { DateTime } from 'luxon';

const TIMEZONE = 'America/Chicago';

export interface OrderItemForCoupon {
  menuItemId: string;
  itemName: string;
  quantity: number;
  basePrice: number;
  totalPrice: number;
}

export interface CouponApplicationResult {
  valid: boolean;
  discountAmount: number;
  reason?: string;
  appliedToItems?: string[]; // Item IDs that discount was applied to
}

@Injectable()
export class CouponApplicationService {
  private readonly logger = new Logger(CouponApplicationService.name);

  /**
   * Calculate discount for an order based on coupon
   * @param coupon The coupon to apply
   * @param items The order items
   * @param channel The order channel ('app_only' | 'in_store' | 'both')
   * @param subtotal The order subtotal before discount
   * @returns Application result with discount amount
   */
  calculateDiscount(
    coupon: CouponGrant,
    items: OrderItemForCoupon[],
    channel: 'app_only' | 'in_store' | 'both',
    subtotal: number,
  ): CouponApplicationResult {
    // Validate coupon status
    if (coupon.status !== CouponStatus.ACTIVE) {
      return {
        valid: false,
        discountAmount: 0,
        reason: 'Coupon is not active',
      };
    }

    // Validate expiration
    const now = DateTime.now().setZone(TIMEZONE);
    const expiryDate = DateTime.fromJSDate(coupon.expiresAt).setZone(TIMEZONE);

    if (now >= expiryDate) {
      return {
        valid: false,
        discountAmount: 0,
        reason: 'Coupon has expired',
      };
    }

    // Validate channel
    const channelValid = this.validateChannel(coupon.channels, channel);
    if (!channelValid.valid) {
      return {
        valid: false,
        discountAmount: 0,
        reason: channelValid.reason,
      };
    }

    // Get eligible items
    const eligibleItems = this.getEligibleItems(coupon, items);

    if (eligibleItems.length === 0) {
      return {
        valid: false,
        discountAmount: 0,
        reason: 'No eligible items in order for this coupon',
      };
    }

    // Calculate discount based on coupon type
    let discountAmount = 0;
    const appliedToItems: string[] = [];

    switch (coupon.type) {
      case CouponType.PERCENT_OFF:
        discountAmount = this.calculatePercentOff(
          coupon.percentOff!,
          eligibleItems,
          appliedToItems,
        );
        break;

      case CouponType.FIXED_PRICE:
        discountAmount = this.calculateFixedPrice(
          coupon.priceOverrideCents!,
          eligibleItems,
          appliedToItems,
        );
        break;

      case CouponType.FIXED_AMOUNT:
        discountAmount = this.calculateFixedAmount(
          coupon.valueCents!,
          eligibleItems,
          appliedToItems,
        );
        break;

      case CouponType.FREE_ITEM:
        discountAmount = this.calculateFreeItem(
          eligibleItems,
          appliedToItems,
        );
        break;

      default:
        return {
          valid: false,
          discountAmount: 0,
          reason: 'Unknown coupon type',
        };
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    this.logger.log(
      `Coupon ${coupon.id} applied: $${discountAmount.toFixed(2)} discount on ${appliedToItems.length} items`,
    );

    return {
      valid: true,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      appliedToItems,
    };
  }

  /**
   * Validate that the coupon channel matches the order channel
   */
  private validateChannel(
    couponChannel: string,
    orderChannel: 'app_only' | 'in_store' | 'both',
  ): { valid: boolean; reason?: string } {
    // If coupon is for 'both' channels, it's always valid
    if (couponChannel === 'both') {
      return { valid: true };
    }

    // If coupon is app_only and order is in_store, invalid
    if (couponChannel === 'app_only' && orderChannel === 'in_store') {
      return {
        valid: false,
        reason: 'This coupon can only be used in the app',
      };
    }

    // If coupon is in_store and order is app_only, invalid
    if (couponChannel === 'in_store' && orderChannel === 'app_only') {
      return {
        valid: false,
        reason: 'This coupon can only be used in-store',
      };
    }

    return { valid: true };
  }

  /**
   * Get items that are eligible for the coupon based on eligibleItems JSON
   */
  private getEligibleItems(
    coupon: CouponGrant,
    items: OrderItemForCoupon[],
  ): OrderItemForCoupon[] {
    // If no eligibleItems restriction, all items are eligible
    if (!coupon.eligibleItems) {
      return items;
    }

    const eligibleConfig = coupon.eligibleItems as any;

    // Filter items based on include/exclude lists
    return items.filter((item) => {
      const itemNameLower = item.itemName.toLowerCase();

      // Check exclude list
      if (eligibleConfig.exclude && Array.isArray(eligibleConfig.exclude)) {
        const isExcluded = eligibleConfig.exclude.some((excluded: string) =>
          itemNameLower.includes(excluded.toLowerCase()),
        );
        if (isExcluded) {
          return false;
        }
      }

      // Check include list (if specified, item must be in it)
      if (eligibleConfig.include && Array.isArray(eligibleConfig.include)) {
        const isIncluded = eligibleConfig.include.some((included: string) =>
          itemNameLower.includes(included.toLowerCase()),
        );
        return isIncluded;
      }

      // If no include list, and not excluded, item is eligible
      return true;
    });
  }

  /**
   * Calculate discount for PERCENT_OFF coupon type
   */
  private calculatePercentOff(
    percentOff: number,
    items: OrderItemForCoupon[],
    appliedToItems: string[],
  ): number {
    let totalDiscount = 0;

    for (const item of items) {
      const itemDiscount = item.totalPrice * item.quantity * (percentOff / 100);
      totalDiscount += itemDiscount;
      appliedToItems.push(item.menuItemId);
    }

    return totalDiscount;
  }

  /**
   * Calculate discount for FIXED_PRICE coupon type
   * Applies to the first eligible item, making it cost the fixed price
   */
  private calculateFixedPrice(
    priceOverrideCents: number,
    items: OrderItemForCoupon[],
    appliedToItems: string[],
  ): number {
    if (items.length === 0) {
      return 0;
    }

    // Apply to first item
    const firstItem = items[0];
    const fixedPrice = priceOverrideCents / 100; // Convert cents to dollars
    const discount = Math.max(0, firstItem.totalPrice - fixedPrice);

    appliedToItems.push(firstItem.menuItemId);

    return discount;
  }

  /**
   * Calculate discount for FIXED_AMOUNT coupon type
   */
  private calculateFixedAmount(
    valueCents: number,
    items: OrderItemForCoupon[],
    appliedToItems: string[],
  ): number {
    const fixedAmount = valueCents / 100; // Convert cents to dollars

    // Mark all eligible items (discount is capped at their total)
    for (const item of items) {
      appliedToItems.push(item.menuItemId);
    }

    return fixedAmount;
  }

  /**
   * Calculate discount for FREE_ITEM coupon type
   * Makes the first eligible item free
   */
  private calculateFreeItem(
    items: OrderItemForCoupon[],
    appliedToItems: string[],
  ): number {
    if (items.length === 0) {
      return 0;
    }

    // Free the first item
    const firstItem = items[0];
    appliedToItems.push(firstItem.menuItemId);

    return firstItem.totalPrice * firstItem.quantity;
  }

  /**
   * Validate that a coupon can be applied (for preview/validation before order creation)
   */
  async validateCouponForOrder(
    coupon: CouponGrant,
    userId: string,
    items: OrderItemForCoupon[],
    channel: 'app_only' | 'in_store' | 'both',
    subtotal: number,
  ): Promise<CouponApplicationResult> {
    // Check ownership
    if (coupon.userId !== userId) {
      return {
        valid: false,
        discountAmount: 0,
        reason: 'This coupon does not belong to you',
      };
    }

    // Calculate discount
    return this.calculateDiscount(coupon, items, channel, subtotal);
  }
}
