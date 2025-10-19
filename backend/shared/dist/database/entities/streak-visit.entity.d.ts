import { User } from './user.entity';
import { Order } from './order.entity';
export declare class StreakVisit {
    id: string;
    userId: string;
    orderId: string;
    visitDate: Date;
    orderAmount: number;
    isMorningRush: boolean;
    pointsEarned: number;
    xpEarned: number;
    basePoints: number;
    baseXP: number;
    multiplier: number;
    streakDayAtVisit: number;
    createdAt: Date;
    user: User;
    order: Order;
}
