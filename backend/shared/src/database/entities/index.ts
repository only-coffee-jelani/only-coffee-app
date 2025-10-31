export * from './user.entity';
export * from './store.entity';
export * from './order.entity';
export * from './order-item.entity';
export * from './menu-item.entity';
export * from './category.entity';
export * from './rewards-ledger.entity';
export * from './gift-card.entity';
export * from './delivery-order.entity';
export * from './review.entity';
export * from './promotion.entity';
export * from './splash-screen.entity';
export * from './carousel-image.entity';
export * from './promo-code.entity';
export * from './coupon-grant.entity';
export * from './program-event.entity';

// Loyalty System Entities
export * from './user-streak.entity';
export * from './streak-visit.entity';
export * from './streak-saver-token.entity';
export * from './streak-reward.entity';
export * from './anniversary-reward.entity';
export * from './user-tier-history.entity';
export * from './tier-perk.entity';

// AI Personalization System Entities
export * from './user-event.entity';
export { UserEvent as Event } from './user-event.entity'; // Alias for backward compatibility
export * from './user-profile.entity';
export * from './user-segment-assignment.entity';
export { UserSegmentAssignment as UserSegment } from './user-segment-assignment.entity'; // Alias for backward compatibility - UserSegment enum is also exported
export * from './ai-promotion.entity';
export * from './promotion-execution.entity';
export * from './user-segment.entity';
export * from './model-log.entity';
export * from './notification-preference.entity';
