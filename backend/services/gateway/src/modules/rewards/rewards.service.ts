import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import {
  User,
  LoyaltyLedger,
  Order,
} from '@shared/database/entities';
import { RewardTransactionType } from '@shared/enums/reward-transaction-type.enum';
import { UserTier } from '@shared/enums/user-tier.enum';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';

// Loyalty tier thresholds
const TIER_THRESHOLDS = {
  silver: 0,
  gold: 2500,
  platinum: 5000,
};

// Points per dollar spent (10 points = $1)
const POINTS_PER_DOLLAR = 10;

// Redemption rate (500 points = $6)
const REDEMPTION_RATE = {
  points: 500,
  dollars: 6,
};

// Points expiration (1 year)
const POINTS_EXPIRATION_DAYS = 365;

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LoyaltyLedger)
    private readonly loyaltyLedgerRepository: Repository<LoyaltyLedger>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Award points for a completed order
   * Called when order is completed
   */
  async awardPointsForOrder(
    userId: string,
    orderId: string,
    orderAmount: number,
  ): Promise<LoyaltyLedger> {
    return await this.dataSource.transaction(async (manager) => {
      // Calculate points (10 points per $1)
      const pointsEarned = Math.floor(orderAmount * POINTS_PER_DOLLAR);

      // Get current user
      const user = await manager.findOne(User, { where: { userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Calculate expiration date (1 year from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + POINTS_EXPIRATION_DAYS);

      // Create ledger entry
      const newBalance = user.loyaltyPoints + pointsEarned;
      const ledgerEntry = manager.create(LoyaltyLedger, {
        userId,
        orderId,
        transactionType: RewardTransactionType.EARNED,
        points: pointsEarned,
        balanceAfter: newBalance,
        orderAmount,
        description: `Earned ${pointsEarned} points from order`,
        expiresAt,
      });

      await manager.save(LoyaltyLedger, ledgerEntry);

      // Update user points
      user.loyaltyPoints = newBalance;

      // TODO: Check for tier upgrade
      // Tier upgrade logic needs to be refactored to work with LoyaltyTier entity
      // const newTier = this.calculateTier(newBalance);
      // if (newTier !== user.loyaltyTier) {
      //   user.loyaltyTier = newTier;
      //   this.logger.log(
      //     `User ${userId} upgraded to ${newTier} tier with ${newBalance} points`,
      //   );
      //   // TODO: Send tier upgrade notification
      // }

      await manager.save(User, user);

      this.logger.log(
        `Awarded ${pointsEarned} points to user ${userId} for order ${orderId}`,
      );

      return ledgerEntry;
    });
  }

  /**
   * Redeem points for discount
   * Must be in multiples of 500 points ($6 per 500 points)
   */
  async redeemPoints(
    userId: string,
    redeemPointsDto: RedeemPointsDto,
  ): Promise<{ ledgerEntry: LoyaltyLedger; discountAmount: number }> {
    const { points, orderId, description } = redeemPointsDto;

    // Validate redemption amount (must be multiple of 500)
    if (points % REDEMPTION_RATE.points !== 0) {
      throw new BadRequestException(
        `Points must be redeemed in multiples of ${REDEMPTION_RATE.points}`,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      // Get user
      const user = await manager.findOne(User, { where: { userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user has enough points
      if (user.loyaltyPoints < points) {
        throw new BadRequestException(
          `Insufficient points. Available: ${user.loyaltyPoints}, Requested: ${points}`,
        );
      }

      // Verify order exists and belongs to user
      const order = await manager.findOne(Order, {
        where: { orderId, userId },
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Calculate discount amount ($6 per 500 points)
      const discountAmount =
        (points / REDEMPTION_RATE.points) * REDEMPTION_RATE.dollars;

      // Create ledger entry
      const newBalance = user.loyaltyPoints - points;
      const ledgerEntry = manager.create(LoyaltyLedger, {
        userId,
        orderId,
        transactionType: RewardTransactionType.REDEEMED,
        points: -points, // Negative for redemption
        balanceAfter: newBalance,
        description:
          description || `Redeemed ${points} points for $${discountAmount.toFixed(2)} discount`,
        metadata: {
          discountAmount,
          redemptionRate: REDEMPTION_RATE,
        },
      });

      await manager.save(LoyaltyLedger, ledgerEntry);

      // Update user points
      user.loyaltyPoints = newBalance;

      // TODO: Check for tier downgrade
      // Tier downgrade logic needs to be refactored to work with LoyaltyTier entity
      // const newTier = this.calculateTier(newBalance);
      // if (newTier !== user.loyaltyTier) {
      //   user.loyaltyTier = newTier;
      //   this.logger.log(
      //     `User ${userId} changed to ${newTier} tier with ${newBalance} points`,
      //   );
      // }

      await manager.save(User, user);

      this.logger.log(
        `User ${userId} redeemed ${points} points for $${discountAmount} discount on order ${orderId}`,
      );

      return { ledgerEntry, discountAmount };
    });
  }

  /**
   * Get user's loyalty summary
   */
  async getLoyaltySummary(userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentTier = user.loyaltyTier;
    const currentPoints = user.loyaltyPoints;

    // TODO: Refactor tier calculation to work with LoyaltyTier entity
    // For now, return basic info without tier progression
    return {
      currentPoints,
      currentTier: currentTier ? currentTier.name : 'Bronze',
      nextTier: null,
      pointsToNextTier: null,
      expiringPointsNext30Days: 0,
      redemptionValue: this.calculateRedemptionValue(currentPoints),
      tierBenefits: [],
    };
  }

  /**
   * Get user's rewards history
   */
  async getRewardsHistory(userId: string, limit: number = 50) {
    // Use LoyaltyLedger repository instead
    return await this.loyaltyLedgerRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Award birthday bonus points
   * Called by scheduled job on user's birthday
   */
  async awardBirthdayBonus(userId: string): Promise<LoyaltyLedger> {
    const BIRTHDAY_BONUS_POINTS = 250;

    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newBalance = user.loyaltyPoints + BIRTHDAY_BONUS_POINTS;

      const ledgerEntry = manager.create(LoyaltyLedger, {
        userId,
        orderId: null,
        pointsDelta: BIRTHDAY_BONUS_POINTS,
        reason: 'Happy Birthday! Enjoy your bonus points',
      });

      await manager.save(LoyaltyLedger, ledgerEntry);

      user.loyaltyPoints = newBalance;
      await manager.save(User, user);

      this.logger.log(`Awarded birthday bonus to user ${userId}`);

      return ledgerEntry;
    });
  }

  /**
   * Manually adjust points (admin only)
   */
  async adjustPoints(
    userId: string,
    adjustPointsDto: AdjustPointsDto,
  ): Promise<LoyaltyLedger> {
    const { points, reason } = adjustPointsDto;

    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newBalance = user.loyaltyPoints + points;

      // Prevent negative balance
      if (newBalance < 0) {
        throw new BadRequestException('Adjustment would result in negative balance');
      }

      const ledgerEntry = manager.create(LoyaltyLedger, {
        userId,
        orderId: null,
        pointsDelta: points,
        reason: reason,
      });

      await manager.save(LoyaltyLedger, ledgerEntry);

      user.loyaltyPoints = newBalance;

      // TODO: Refactor tier calculation to work with LoyaltyTier entity
      // const newTier = this.calculateTier(newBalance);
      // if (newTier !== user.loyaltyTier) {
      //   user.loyaltyTier = newTier;
      // }

      await manager.save(User, user);

      this.logger.log(
        `Adjusted ${points} points for user ${userId}. Reason: ${reason}`,
      );

      return ledgerEntry;
    });
  }

  /**
   * Expire old points
   * Called by scheduled job
   * TODO: LoyaltyLedger doesn't have transactionType or expiresAt fields
   * This needs to be refactored to work with the new schema
   */
  async expireOldPoints(): Promise<number> {
    this.logger.warn('expireOldPoints called but LoyaltyLedger does not have transactionType or expiresAt fields.');
    return 0;
  }

  /**
   * Calculate user's tier based on points
   * TODO: Refactor to work with LoyaltyTier entity
   */
  // private calculateTier(points: number): UserTier {
  //   if (points >= TIER_THRESHOLDS.platinum) {
  //     return UserTier.PLATINUM;
  //   } else if (points >= TIER_THRESHOLDS.gold) {
  //     return UserTier.GOLD;
  //   }
  //   return UserTier.SILVER;
  // }

  /**
   * Calculate redemption value
   */
  private calculateRedemptionValue(points: number): number {
    const redeemablePoints =
      Math.floor(points / REDEMPTION_RATE.points) * REDEMPTION_RATE.points;
    return (redeemablePoints / REDEMPTION_RATE.points) * REDEMPTION_RATE.dollars;
  }

  /**
   * Get tier benefits description
   * TODO: Refactor to work with LoyaltyTier entity
   */
  // private getTierBenefits(tier: UserTier): string[] {
  //   const benefits = {
  //     [UserTier.SILVER]: [
  //       'Earn 10 points per $1 spent',
  //       'Redeem 500 points for $6',
  //       'Birthday bonus: 250 points',
  //     ],
  //     [UserTier.GOLD]: [
  //       'All Silver benefits',
  //       'Earn 10 points per $1 spent',
  //       'Priority order processing',
  //       'Exclusive menu item access',
  //     ],
  //     [UserTier.PLATINUM]: [
  //       'All Gold benefits',
  //       'Earn 10 points per $1 spent',
  //       'Free delivery on all orders',
  //       'VIP customer support',
  //       'Early access to new locations',
  //     ],
  //   };
  //
  //   return benefits[tier] || benefits[UserTier.SILVER];
  // }
}
