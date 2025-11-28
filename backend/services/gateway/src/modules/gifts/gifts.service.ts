import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { GiftCard, Order, OrderStatus } from '@shared/database/entities';
import { CreateGiftCardDto, RedeemGiftCardDto } from './dto';
import { randomBytes } from 'crypto';

// Stub enums since they don't exist in new schema
enum GiftCardType {
  AMOUNT = 'AMOUNT',
  FREE_COFFEE = 'FREE_COFFEE',
}
enum GiftCardStatus {
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Injectable()
export class GiftsService {
  private readonly logger = new Logger(GiftsService.name);

  constructor(
    @InjectRepository(GiftCard)
    private readonly giftCardRepository: Repository<GiftCard>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new gift card
   * Note: GiftCard entity simplified in new schema - only has giftCardId, code, purchasedByUserId,
   * redeemedByUserId, initialBalance, currentBalance, purchasedAt, redeemedAt, expiresAt
   */
  async create(userId: string, createGiftCardDto: CreateGiftCardDto) {
    const { amount } = createGiftCardDto;

    // Validate amount
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Generate unique code
    const code = await this.generateUniqueCode();

    // Create gift card
    const giftCard = this.giftCardRepository.create({
      code,
      purchasedByUserId: userId,
      initialBalance: amount,
      currentBalance: amount,
      purchasedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    });

    const savedGiftCard = await this.giftCardRepository.save(giftCard);

    this.logger.log(`Created gift card ${savedGiftCard.giftCardId} with code ${code}`);

    return savedGiftCard;
  }

  /**
   * Get gift card by code
   */
  async findByCode(code: string) {
    const giftCard = await this.giftCardRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    return giftCard;
  }

  /**
   * Get user's purchased gift cards
   */
  async findBySender(userId: string, limit: number = 20) {
    return this.giftCardRepository.find({
      where: { purchasedByUserId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get user's redeemed gift cards
   */
  async findByRecipient(userId: string, limit: number = 20) {
    return this.giftCardRepository.find({
      where: { redeemedByUserId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Activate gift card (after payment)
   * Note: GiftCard entity no longer has status or stripePaymentIntentId
   */
  async activate(giftCardId: string, stripePaymentIntentId: string) {
    const giftCard = await this.giftCardRepository.findOne({
      where: { giftCardId },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    // Gift card is already active when created with purchasedAt set
    // No status field in new schema

    this.logger.log(`Gift card ${giftCardId} is active`);

    // TODO: Send gift card notification to recipient

    return giftCard;
  }

  /**
   * Redeem gift card for an order
   * Note: GiftCard entity simplified - no status, type, maxRedeemValue, redeemedOrderId
   */
  async redeem(userId: string, redeemGiftCardDto: RedeemGiftCardDto) {
    const { code, orderId, redeemAmount } = redeemGiftCardDto;

    // Get gift card
    const giftCard = await this.giftCardRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    // Validate gift card
    if (giftCard.redeemedAt) {
      throw new BadRequestException('Gift card has already been redeemed');
    }

    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      throw new BadRequestException('Gift card has expired');
    }

    // Get order
    const order = await this.orderRepository.findOne({
      where: { orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Process redemption
    return await this.dataSource.transaction(async (manager) => {
      const availableBalance = parseFloat(giftCard.currentBalance?.toString() || '0');
      const orderTotal = parseFloat(order.total.toString());

      let discountAmount = 0;

      if (redeemAmount) {
        // Partial redemption
        if (redeemAmount > availableBalance) {
          throw new BadRequestException('Insufficient gift card balance');
        }
        if (redeemAmount > orderTotal) {
          throw new BadRequestException('Redeem amount exceeds order total');
        }
        discountAmount = redeemAmount;
      } else {
        // Full redemption (or up to order total)
        discountAmount = Math.min(availableBalance, orderTotal);
      }

      giftCard.currentBalance = availableBalance - discountAmount;

      // Mark as redeemed if fully used
      if (giftCard.currentBalance === 0) {
        giftCard.redeemedAt = new Date();
        giftCard.redeemedByUserId = userId;
      }

      // Update order with discount
      order.total = parseFloat(order.total.toString()) - discountAmount;

      // Recalculate if total is now 0 or negative
      if (order.total <= 0) {
        order.total = 0;
      }

      // Save both entities
      await manager.save(GiftCard, giftCard);
      await manager.save(Order, order);

      this.logger.log(`Redeemed gift card ${giftCard.code} for order ${orderId}. Discount: $${discountAmount}`);

      return {
        giftCard,
        order,
        discountApplied: discountAmount,
        newOrderTotal: order.total,
      };
    });
  }

  /**
   * Check gift card balance
   * Note: GiftCard entity simplified - no type, status, maxRedeemValue
   */
  async checkBalance(code: string) {
    const giftCard = await this.findByCode(code);

    return {
      code: giftCard.code,
      currentBalance: giftCard.currentBalance,
      initialBalance: giftCard.initialBalance,
      expiresAt: giftCard.expiresAt,
      isExpired: giftCard.expiresAt ? new Date() > giftCard.expiresAt : false,
      isRedeemed: !!giftCard.redeemedAt,
    };
  }

  /**
   * Cancel gift card (admin or purchaser can cancel unused cards)
   * Note: GiftCard entity no longer has status field
   */
  async cancel(giftCardId: string, userId: string) {
    const giftCard = await this.giftCardRepository.findOne({
      where: { giftCardId },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    // Only purchaser can cancel
    if (giftCard.purchasedByUserId !== userId) {
      throw new BadRequestException('You can only cancel gift cards you purchased');
    }

    if (giftCard.redeemedAt) {
      throw new BadRequestException('Cannot cancel redeemed gift cards');
    }

    // Delete the gift card (no status field to set to CANCELLED)
    await this.giftCardRepository.remove(giftCard);

    this.logger.log(`Cancelled gift card ${giftCardId}`);

    // TODO: Process refund if already paid

    return { message: 'Gift card cancelled successfully' };
  }

  /**
   * Generate a unique gift card code
   */
  private async generateUniqueCode(): Promise<string> {
    let code = '';
    let exists = true;

    while (exists) {
      // Generate code: COFFEE + 4 random uppercase letters + 4 random numbers
      const letters = randomBytes(2).toString('hex').toUpperCase().substring(0, 4);
      const numbers = Math.floor(1000 + Math.random() * 9000).toString();
      code = `COFFEE${letters}${numbers}`;

      // Check if code already exists
      const existing = await this.giftCardRepository.findOne({
        where: { code },
      });
      exists = !!existing;
    }

    return code;
  }
}
