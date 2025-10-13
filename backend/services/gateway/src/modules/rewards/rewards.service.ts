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
  RewardsLedger,
  Order,
  RewardTransactionType,
  UserTier,
} from '@shared/database/entities';
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
    @InjectRepository(RewardsLedger)
    private readonly rewardsLedgerRepository: Repository<RewardsLedger>,
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
  ): Promise<RewardsLedger> {
    return await this.dataSource.transaction(async (manager) => {
      // Calculate points (10 points per $1)
      const pointsEarned = Math.floor(orderAmount * POINTS_PER_DOLLAR);

      // Get current user
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Calculate expiration date (1 year from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + POINTS_EXPIRATION_DAYS);

      // Create ledger entry
      const newBalance = user.loyaltyPoints + pointsEarned;
      const ledgerEntry = manager.create(RewardsLedger, {
        userId,
        orderId,
        transactionType: RewardTransactionType.EARNED,
        points: pointsEarned,
        balanceAfter: newBalance,
        orderAmount,
        description: `Earned ${pointsEarned} points from order`,
        expiresAt,
      });

      await manager.save(RewardsLedger, ledgerEntry);

      // Update user points
      user.loyaltyPoints = newBalance;

      // Check for tier upgrade
      const newTier = this.calculateTier(newBalance);
      if (newTier !== user.loyaltyTier) {
        user.loyaltyTier = newTier;
        this.logger.log(
          `User ${userId} upgraded to ${newTier} tier with ${newBalance} points`,
        );
        // TODO: Send tier upgrade notification
      }

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
  ): Promise<{ ledgerEntry: RewardsLedger; discountAmount: number }> {
    const { points, orderId, description } = redeemPointsDto;

    // Validate redemption amount (must be multiple of 500)
    if (points % REDEMPTION_RATE.points !== 0) {
      throw new BadRequestException(
        `Points must be redeemed in multiples of ${REDEMPTION_RATE.points}`,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      // Get user
      const user = await manager.findOne(User, { where: { id: userId } });
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
        where: { id: orderId, userId },
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Calculate discount amount ($6 per 500 points)
      const discountAmount =
        (points / REDEMPTION_RATE.points) * REDEMPTION_RATE.dollars;

      // Create ledger entry
      const newBalance = user.loyaltyPoints - points;
      const ledgerEntry = manager.create(RewardsLedger, {
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

      await manager.save(RewardsLedger, ledgerEntry);

      // Update user points
      user.loyaltyPoints = newBalance;

      // Check for tier downgrade
      const newTier = this.calculateTier(newBalance);
      if (newTier !== user.loyaltyTier) {
        user.loyaltyTier = newTier;
        this.logger.log(
          `User ${userId} changed to ${newTier} tier with ${newBalance} points`,
        );
      }

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
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentTier = user.loyaltyTier;
    const currentPoints = user.loyaltyPoints;

    // Calculate next tier info
    let nextTier: UserTier | null = null;
    let pointsToNextTier = 0;

    if (currentTier === UserTier.SILVER) {
      nextTier = UserTier.GOLD;
      pointsToNextTier = TIER_THRESHOLDS.gold - currentPoints;
    } else if (currentTier === UserTier.GOLD) {
      nextTier = UserTier.PLATINUM;
      pointsToNextTier = TIER_THRESHOLDS.platinum - currentPoints;
    }

    // Get points expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringPoints = await this.rewardsLedgerRepository
      .createQueryBuilder('ledger')
      .where('ledger.userId = :userId', { userId })
      .andWhere('ledger.transactionType = :type', {
        type: RewardTransactionType.EARNED,
      })
      .andWhere('ledger.expiresAt <= :expiryDate', {
        expiryDate: thirtyDaysFromNow,
      })
      .andWhere('ledger.expiresAt > :now', { now: new Date() })
      .select('SUM(ledger.points)', 'total')
      .getRawOne();

    return {
      currentPoints,
      currentTier,
      nextTier,
      pointsToNextTier: nextTier ? pointsToNextTier : null,
      expiringPointsNext30Days: parseInt(expiringPoints?.total || '0', 10),
      redemptionValue: this.calculateRedemptionValue(currentPoints),
      tierBenefits: this.getTierBenefits(currentTier),
    };
  }

  /**
   * Get user's rewards history
   */
  async getRewardsHistory(userId: string, limit: number = 50) {
    return await this.rewardsLedgerRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Award birthday bonus points
   * Called by scheduled job on user's birthday
   */
  async awardBirthdayBonus(userId: string): Promise<RewardsLedger> {
    const BIRTHDAY_BONUS_POINTS = 250;

    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newBalance = user.loyaltyPoints + BIRTHDAY_BONUS_POINTS;

      const ledgerEntry = manager.create(RewardsLedger, {
        userId,
        orderId: null,
        transactionType: RewardTransactionType.BIRTHDAY_BONUS,
        points: BIRTHDAY_BONUS_POINTS,
        balanceAfter: newBalance,
        description: 'Happy Birthday! Enjoy your bonus points',
        expiresAt: new Date(
          Date.now() + POINTS_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
        ),
      });

      await manager.save(RewardsLedger, ledgerEntry);

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
  ): Promise<RewardsLedger> {
    const { points, reason } = adjustPointsDto;

    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newBalance = user.loyaltyPoints + points;

      // Prevent negative balance
      if (newBalance < 0) {
        throw new BadRequestException('Adjustment would result in negative balance');
      }

      const ledgerEntry = manager.create(RewardsLedger, {
        userId,
        orderId: null,
        transactionType: RewardTransactionType.ADJUSTED,
        points,
        balanceAfter: newBalance,
        description: reason,
      });

      await manager.save(RewardsLedger, ledgerEntry);

      user.loyaltyPoints = newBalance;

      const newTier = this.calculateTier(newBalance);
      if (newTier !== user.loyaltyTier) {
        user.loyaltyTier = newTier;
      }

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
   */
  async expireOldPoints(): Promise<number> {
    let totalExpired = 0;

    const expiredEntries = await this.rewardsLedgerRepository.find({
      where: {
        transactionType: RewardTransactionType.EARNED,
        expiresAt: MoreThan(new Date()),
      },
    });

    for (const entry of expiredEntries) {
      await this.dataSource.transaction(async (manager) => {
        const user = await manager.findOne(User, {
          where: { id: entry.userId },
        });
        if (!user) return;

        const newBalance = Math.max(0, user.loyaltyPoints - entry.points);

        const expiryEntry = manager.create(RewardsLedger, {
          userId: entry.userId,
          orderId: null,
          transactionType: RewardTransactionType.EXPIRED,
          points: -entry.points,
          balanceAfter: newBalance,
          description: `Expired points from ${entry.createdAt.toLocaleDateString()}`,
        });

        await manager.save(RewardsLedger, expiryEntry);

        user.loyaltyPoints = newBalance;
        const newTier = this.calculateTier(newBalance);
        if (newTier !== user.loyaltyTier) {
          user.loyaltyTier = newTier;
        }
        await manager.save(User, user);

        totalExpired += entry.points;
      });
    }

    this.logger.log(`Expired ${totalExpired} total points`);
    return totalExpired;
  }

  /**
   * Calculate user's tier based on points
   */
  private calculateTier(points: number): UserTier {
    if (points >= TIER_THRESHOLDS.platinum) {
      return UserTier.PLATINUM;
    } else if (points >= TIER_THRESHOLDS.gold) {
      return UserTier.GOLD;
    }
    return UserTier.SILVER;
  }

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
   */
  private getTierBenefits(tier: UserTier): string[] {
    const benefits = {
      [UserTier.SILVER]: [
        'Earn 10 points per $1 spent',
        'Redeem 500 points for $6',
        'Birthday bonus: 250 points',
      ],
      [UserTier.GOLD]: [
        'All Silver benefits',
        'Earn 10 points per $1 spent',
        'Priority order processing',
        'Exclusive menu item access',
      ],
      [UserTier.PLATINUM]: [
        'All Gold benefits',
        'Earn 10 points per $1 spent',
        'Free delivery on all orders',
        'VIP customer support',
        'Early access to new locations',
      ],
    };

    return benefits[tier] || benefits[UserTier.SILVER];
  }
}
