import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { GiftCard, GiftCardType, GiftCardStatus, Order, OrderStatus } from '@shared/database/entities';
import { CreateGiftCardDto, RedeemGiftCardDto } from './dto';
import { randomBytes } from 'crypto';

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
   */
  async create(userId: string, createGiftCardDto: CreateGiftCardDto) {
    const { type, amount, maxRedeemValue, recipientEmail, recipientPhone, message } = createGiftCardDto;

    // Validate based on type
    if (type === GiftCardType.AMOUNT) {
      if (!amount) {
        throw new BadRequestException('Amount is required for AMOUNT type gift cards');
      }
    } else if (type === GiftCardType.FREE_COFFEE) {
      if (!maxRedeemValue) {
        throw new BadRequestException('Max redeem value is required for FREE_COFFEE type gift cards');
      }
    }

    // Generate unique code
    const code = await this.generateUniqueCode();

    // Create gift card
    const giftCard = this.giftCardRepository.create({
      code,
      type,
      status: GiftCardStatus.PENDING, // Will be ACTIVE after payment
      senderUserId: userId,
      recipientEmail,
      recipientPhone,
      amount: type === GiftCardType.AMOUNT ? amount : null,
      remainingBalance: type === GiftCardType.AMOUNT ? amount : null,
      maxRedeemValue: type === GiftCardType.FREE_COFFEE ? maxRedeemValue : null,
      message,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    });

    const savedGiftCard = await this.giftCardRepository.save(giftCard);

    this.logger.log(`Created gift card ${savedGiftCard.id} with code ${code}`);

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
   * Get user's sent gift cards
   */
  async findBySender(userId: string, limit: number = 20) {
    return this.giftCardRepository.find({
      where: { senderUserId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get user's received gift cards
   */
  async findByRecipient(userId: string, limit: number = 20) {
    return this.giftCardRepository.find({
      where: { recipientUserId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Activate gift card (after payment)
   */
  async activate(giftCardId: string, stripePaymentIntentId: string) {
    const giftCard = await this.giftCardRepository.findOne({
      where: { id: giftCardId },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (giftCard.status !== GiftCardStatus.PENDING) {
      throw new BadRequestException('Gift card is not in pending status');
    }

    giftCard.status = GiftCardStatus.ACTIVE;
    giftCard.stripePaymentIntentId = stripePaymentIntentId;

    await this.giftCardRepository.save(giftCard);

    this.logger.log(`Activated gift card ${giftCardId}`);

    // TODO: Send gift card notification to recipient

    return giftCard;
  }

  /**
   * Redeem gift card for an order
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
    if (giftCard.status !== GiftCardStatus.ACTIVE) {
      throw new BadRequestException(`Gift card is ${giftCard.status}`);
    }

    if (new Date() > giftCard.expiresAt) {
      giftCard.status = GiftCardStatus.EXPIRED;
      await this.giftCardRepository.save(giftCard);
      throw new BadRequestException('Gift card has expired');
    }

    // Get order
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate order status
    if (order.status !== OrderStatus.INITIATED && order.status !== OrderStatus.SLOT_RESERVED) {
      throw new BadRequestException('Order is not in a valid state for gift card redemption');
    }

    // Process redemption based on type
    return await this.dataSource.transaction(async (manager) => {
      let discountAmount = 0;

      if (giftCard.type === GiftCardType.AMOUNT) {
        // Amount-based gift card
        const availableBalance = parseFloat(giftCard.remainingBalance?.toString() || '0');
        const orderTotal = parseFloat(order.total.toString());

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

        giftCard.remainingBalance = availableBalance - discountAmount;

        // Mark as redeemed if fully used
        if (giftCard.remainingBalance === 0) {
          giftCard.status = GiftCardStatus.REDEEMED;
          giftCard.redeemedAt = new Date();
          giftCard.redeemedOrderId = orderId;
        }
      } else if (giftCard.type === GiftCardType.FREE_COFFEE) {
        // Free coffee voucher (one-time use)
        const maxValue = parseFloat(giftCard.maxRedeemValue?.toString() || '0');
        const orderTotal = parseFloat(order.total.toString());

        discountAmount = Math.min(maxValue, orderTotal);

        giftCard.status = GiftCardStatus.REDEEMED;
        giftCard.redeemedAt = new Date();
        giftCard.redeemedOrderId = orderId;
        giftCard.remainingBalance = 0;
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
   */
  async checkBalance(code: string) {
    const giftCard = await this.findByCode(code);

    return {
      code: giftCard.code,
      type: giftCard.type,
      status: giftCard.status,
      remainingBalance: giftCard.remainingBalance,
      maxRedeemValue: giftCard.maxRedeemValue,
      expiresAt: giftCard.expiresAt,
      isExpired: new Date() > giftCard.expiresAt,
    };
  }

  /**
   * Cancel gift card (admin or sender can cancel unused cards)
   */
  async cancel(giftCardId: string, userId: string) {
    const giftCard = await this.giftCardRepository.findOne({
      where: { id: giftCardId },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    // Only sender can cancel
    if (giftCard.senderUserId !== userId) {
      throw new BadRequestException('You can only cancel gift cards you created');
    }

    if (giftCard.status !== GiftCardStatus.ACTIVE && giftCard.status !== GiftCardStatus.PENDING) {
      throw new BadRequestException('Can only cancel active or pending gift cards');
    }

    giftCard.status = GiftCardStatus.CANCELLED;
    await this.giftCardRepository.save(giftCard);

    this.logger.log(`Cancelled gift card ${giftCardId}`);

    // TODO: Process refund if already paid

    return giftCard;
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
