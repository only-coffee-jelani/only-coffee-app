import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStreak } from '@shared/database/entities/user-streak.entity';
import { StreakVisit } from '@shared/database/entities/streak-visit.entity';
import { StreakSaverToken } from '@shared/database/entities/streak-saver-token.entity';
import { StreakReward } from '@shared/database/entities/streak-reward.entity';
import { AnniversaryReward } from '@shared/database/entities/anniversary-reward.entity';
import { UserTierHistory } from '@shared/database/entities/user-tier-history.entity';
import { TierPerk } from '@shared/database/entities/tier-perk.entity';
import { User } from '@shared/database/entities/user.entity';
import { Order } from '@shared/database/entities/order.entity';
import { CouponGrant } from '@shared/database/entities/coupon-grant.entity';

// Services
import { StreakTrackingService } from './streak-tracking.service';
import { StreakRewardService } from './streak-reward.service';
import { StreakSaverService } from './streak-saver.service';
import { TierManagementService } from './tier-management.service';
import { AnniversaryService } from './anniversary.service';
import { LoyaltyTasksService } from './loyalty-tasks.service';

// Import CouponsModule for CouponGrantService
import { CouponsModule } from '../coupons/coupons.module';

// Import EventEmitterService
import { EventEmitterService } from '../../common/services/event-emitter.service';
import { ProgramEvent } from '@shared/database/entities/program-event.entity';

// Controller
import { LoyaltyController } from './loyalty.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Loyalty entities
      UserStreak,
      StreakVisit,
      StreakSaverToken,
      StreakReward,
      AnniversaryReward,
      UserTierHistory,
      TierPerk,
      // Shared entities
      User,
      Order,
      CouponGrant,
      ProgramEvent,
    ]),
    CouponsModule, // For CouponGrantService
  ],
  controllers: [LoyaltyController],
  providers: [
    // Core services
    StreakTrackingService,
    StreakRewardService,
    StreakSaverService,
    TierManagementService,
    AnniversaryService,
    LoyaltyTasksService,
    // Shared services
    EventEmitterService,
  ],
  exports: [
    // Export services for use in other modules
    StreakTrackingService,
    StreakRewardService,
    StreakSaverService,
    TierManagementService,
    AnniversaryService,
  ],
})
export class LoyaltyModule {}
