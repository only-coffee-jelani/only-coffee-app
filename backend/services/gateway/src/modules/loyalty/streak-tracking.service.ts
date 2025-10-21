import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { UserStreak } from '@shared/database/entities/user-streak.entity';
import { StreakVisit } from '@shared/database/entities/streak-visit.entity';
import { User } from '@shared/database/entities/user.entity';
import { Order } from '@shared/database/entities/order.entity';
import { DateTime } from 'luxon';
import { EventEmitterService } from '../../common/services/event-emitter.service';

// Constants
const TIMEZONE = 'America/Chicago';
const MINIMUM_ORDER_AMOUNT = 3.00; // $3 minimum for qualifying orders
const MORNING_RUSH_START_HOUR = 5;
const MORNING_RUSH_END_HOUR = 10;
const MORNING_RUSH_MULTIPLIER = 2;
const POINTS_PER_DOLLAR = 10; // Base points before multiplier
const XP_PER_DOLLAR = 10; // Base XP before multiplier

@Injectable()
export class StreakTrackingService {
  private readonly logger = new Logger(StreakTrackingService.name);

  constructor(
    @InjectRepository(UserStreak)
    private readonly userStreakRepository: Repository<UserStreak>,
    @InjectRepository(StreakVisit)
    private readonly streakVisitRepository: Repository<StreakVisit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly eventEmitterService: EventEmitterService,
  ) {}

  /**
   * Process an order for streak tracking
   * Called after order completion
   */
  async processOrderForStreak(orderId: string): Promise<{
    qualified: boolean;
    streak?: UserStreak;
    visit?: StreakVisit;
    milestoneReached?: number;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      // Fetch order with user
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['user'],
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const userId = order.userId;
      const orderTotal = parseFloat(order.total.toString());

      // Check if order qualifies ($3+ minimum)
      if (orderTotal < MINIMUM_ORDER_AMOUNT) {
        this.logger.debug(
          `Order ${orderId} does not qualify for streak tracking (${orderTotal} < ${MINIMUM_ORDER_AMOUNT})`,
        );
        return { qualified: false };
      }

      const now = DateTime.now().setZone(TIMEZONE);
      const visitDate = now.toISODate();

      // Check if user already has a visit today
      const existingVisit = await manager.findOne(StreakVisit, {
        where: {
          userId,
          visitDate: new Date(visitDate),
        },
      });

      if (existingVisit) {
        this.logger.debug(
          `User ${userId} already has a visit logged for ${visitDate}`,
        );
        return { qualified: false };
      }

      // Determine if it's morning rush (5:00-10:00 AM CST)
      const hour = now.hour;
      const isMorningRush = hour >= MORNING_RUSH_START_HOUR && hour < MORNING_RUSH_END_HOUR;
      const multiplier = isMorningRush ? MORNING_RUSH_MULTIPLIER : 1;

      // Calculate points and XP
      const basePoints = Math.floor(orderTotal * POINTS_PER_DOLLAR);
      const baseXP = Math.floor(orderTotal * XP_PER_DOLLAR);
      const pointsEarned = basePoints * multiplier;
      const xpEarned = baseXP * multiplier;

      // Get or create user streak
      let userStreak = await manager.findOne(UserStreak, {
        where: { userId },
      });

      if (!userStreak) {
        userStreak = manager.create(UserStreak, {
          userId,
          consecutiveDays: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastVisitDate: null,
          firstQualifyingPurchaseDate: now.toJSDate(),
          streakStartDate: new Date(visitDate),
          monthlyPoints: 0,
          tierXP: 0,
          monthlyVisits: 0,
          annualSpend: 0,
          sevenDayStreakCount: 0,
          lastMonthlyReset: new Date(now.startOf('month').toISODate()),
        });
      }

      // Check for broken streak
      const lastVisitDate = userStreak.lastVisitDate
        ? DateTime.fromJSDate(userStreak.lastVisitDate).setZone(TIMEZONE)
        : null;

      let streakBroken = false;
      if (lastVisitDate) {
        const daysSinceLastVisit = now.diff(lastVisitDate, 'days').days;

        // Streak broken if more than 1 day gap (allowing for same-day repeat)
        if (daysSinceLastVisit > 1.5) {
          streakBroken = true;
          this.logger.log(
            `Streak broken for user ${userId}. Last visit: ${lastVisitDate.toISODate()}, current: ${visitDate}`,
          );
          userStreak.consecutiveDays = 0;
          userStreak.streakStartDate = new Date(visitDate);
        }
      }

      // Update streak
      const previousStreak = userStreak.consecutiveDays;
      userStreak.consecutiveDays += 1;
      userStreak.currentStreak = userStreak.consecutiveDays;
      userStreak.lastVisitDate = new Date(visitDate);

      // Update longest streak
      if (userStreak.consecutiveDays > userStreak.longestStreak) {
        userStreak.longestStreak = userStreak.consecutiveDays;
      }

      // Track 7-day streak milestones
      let milestoneReached: number | undefined = undefined;
      if (userStreak.consecutiveDays === 7) {
        userStreak.sevenDayStreakCount += 1;
        milestoneReached = 7;
        this.logger.log(
          `User ${userId} reached 7-day streak milestone! Total count: ${userStreak.sevenDayStreakCount}`,
        );
      }

      // Track milestone rewards (2, 7, 14, 30, 90)
      const milestones = [2, 7, 14, 30, 90];
      if (milestones.includes(userStreak.consecutiveDays)) {
        milestoneReached = userStreak.consecutiveDays;
      }

      // Update monthly points and tier XP (with morning rush multiplier)
      userStreak.monthlyPoints += pointsEarned;
      userStreak.tierXP += xpEarned;
      userStreak.monthlyVisits += 1;

      // Update annual spend (rolling 365 days)
      const oneYearAgo = now.minus({ days: 365 }).toJSDate();
      const annualOrders = await manager
        .createQueryBuilder(Order, 'order')
        .where('order.userId = :userId', { userId })
        .andWhere('order.status = :status', { status: 'completed' })
        .andWhere('order.createdAt >= :oneYearAgo', { oneYearAgo })
        .getMany();

      userStreak.annualSpend = annualOrders.reduce(
        (sum, order) => sum + parseFloat(order.total.toString()),
        0,
      );

      // Save user streak
      await manager.save(UserStreak, userStreak);

      // Create streak visit record
      const streakVisit = manager.create(StreakVisit, {
        userId,
        orderId,
        visitDate: new Date(visitDate),
        orderAmount: orderTotal,
        isMorningRush,
        pointsEarned,
        xpEarned,
        basePoints,
        baseXP,
        multiplier,
        streakDayAtVisit: userStreak.consecutiveDays,
      });

      await manager.save(StreakVisit, streakVisit);

      // Emit analytics event
      await this.eventEmitterService.emitCouponGranted(
        userId,
        'streak_visit_logged',
        {
          orderId,
          visitDate,
          isMorningRush,
          pointsEarned,
          xpEarned,
          streakDay: userStreak.consecutiveDays,
          streakBroken,
        },
      );

      this.logger.log(
        `Streak visit logged for user ${userId}: Day ${userStreak.consecutiveDays}, ${pointsEarned} points, ${xpEarned} XP${isMorningRush ? ' (MORNING RUSH 2x)' : ''}`,
      );

      return {
        qualified: true,
        streak: userStreak,
        visit: streakVisit,
        milestoneReached,
      };
    });
  }

  /**
   * Get user's current streak data
   */
  async getUserStreak(userId: string): Promise<UserStreak> {
    let userStreak = await this.userStreakRepository.findOne({
      where: { userId },
    });

    if (!userStreak) {
      // Create initial streak record
      const now = DateTime.now().setZone(TIMEZONE);
      userStreak = this.userStreakRepository.create({
        userId,
        consecutiveDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastVisitDate: null,
        firstQualifyingPurchaseDate: null,
        streakStartDate: null,
        monthlyPoints: 0,
        tierXP: 0,
        monthlyVisits: 0,
        annualSpend: 0,
        sevenDayStreakCount: 0,
        lastMonthlyReset: new Date(now.startOf('month').toISODate()),
      });

      await this.userStreakRepository.save(userStreak);
    }

    return userStreak;
  }

  /**
   * Get user's visit history
   */
  async getUserVisits(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StreakVisit[]> {
    const query = this.streakVisitRepository
      .createQueryBuilder('visit')
      .where('visit.userId = :userId', { userId })
      .orderBy('visit.visitDate', 'DESC');

    if (startDate) {
      query.andWhere('visit.visitDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('visit.visitDate <= :endDate', { endDate });
    }

    return await query.getMany();
  }

  /**
   * Check if user has visited today
   */
  async hasVisitedToday(userId: string): Promise<boolean> {
    const now = DateTime.now().setZone(TIMEZONE);
    const today = new Date(now.toISODate());

    const visit = await this.streakVisitRepository.findOne({
      where: {
        userId,
        visitDate: today,
      },
    });

    return !!visit;
  }

  /**
   * Reset monthly counters (run by cron on 1st of each month)
   */
  async resetMonthlyCounters(): Promise<number> {
    const now = DateTime.now().setZone(TIMEZONE);
    const currentMonth = now.startOf('month').toISODate();

    const streaksToReset = await this.userStreakRepository
      .createQueryBuilder('streak')
      .where('streak.lastMonthlyReset < :currentMonth', { currentMonth })
      .orWhere('streak.lastMonthlyReset IS NULL')
      .getMany();

    if (streaksToReset.length === 0) {
      return 0;
    }

    for (const streak of streaksToReset) {
      streak.monthlyPoints = 0;
      streak.monthlyVisits = 0;
      streak.lastMonthlyReset = new Date(currentMonth);
      await this.userStreakRepository.save(streak);
    }

    this.logger.log(
      `Reset monthly counters for ${streaksToReset.length} users`,
    );

    return streaksToReset.length;
  }

  /**
   * Get streak statistics (admin analytics)
   */
  async getStreakStatistics(): Promise<{
    totalActiveStreaks: number;
    averageStreakLength: number;
    longestCurrentStreak: number;
    sevenDayStreaksThisMonth: number;
  }> {
    const now = DateTime.now().setZone(TIMEZONE);
    const yesterday = now.minus({ days: 1 }).toISODate();

    const activeStreaks = await this.userStreakRepository
      .createQueryBuilder('streak')
      .where('streak.lastVisitDate >= :yesterday', {
        yesterday: new Date(yesterday),
      })
      .andWhere('streak.consecutiveDays > 0')
      .getMany();

    const totalActiveStreaks = activeStreaks.length;
    const averageStreakLength =
      totalActiveStreaks > 0
        ? activeStreaks.reduce((sum, s) => sum + s.consecutiveDays, 0) /
          totalActiveStreaks
        : 0;

    const longestStreak = await this.userStreakRepository
      .createQueryBuilder('streak')
      .orderBy('streak.consecutiveDays', 'DESC')
      .getOne();

    const longestCurrentStreak = longestStreak?.consecutiveDays || 0;

    // Count 7-day streaks this month
    const monthStart = now.startOf('month').toJSDate();
    const sevenDayVisits = await this.streakVisitRepository
      .createQueryBuilder('visit')
      .where('visit.streakDayAtVisit = 7')
      .andWhere('visit.createdAt >= :monthStart', { monthStart })
      .getCount();

    return {
      totalActiveStreaks,
      averageStreakLength: Math.round(averageStreakLength * 10) / 10,
      longestCurrentStreak,
      sevenDayStreaksThisMonth: sevenDayVisits,
    };
  }
}
