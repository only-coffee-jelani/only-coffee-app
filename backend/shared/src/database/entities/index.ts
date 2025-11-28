// ===================================================================
// ENTERPRISE SCHEMA ENTITIES - ONLY COFFEE
// ===================================================================

// Enums (for backward compatibility)
export { UserRole } from '../../enums/user-role.enum';
// Note: OrderStatus enum removed to avoid conflict with OrderStatus entity
// Import OrderStatus enum directly from '@shared/enums/order-status.enum'
export { StoreType } from '../../enums/store-type.enum';
export { EventType } from '../../enums/event-type.enum';

// Lookup/Reference Tables
export * from './loyalty-tier.entity';
export * from './store-type.entity';
export * from './promotion-discount-type.entity';
export * from './payment-method.entity';
export * from './order-status.entity';
export * from './admin-role.entity';
export * from './user-segment.entity';
export * from './reportable-entity.entity';
export * from './filter-operator.entity';

// Admin & RBAC
export * from './admin-user.entity';
export * from './admin-user-role.entity';
export * from './audit-log.entity';

// Users & Sessions
export * from './user.entity';
export * from './user-device.entity';
export * from './anonymous-device.entity';
export * from './user-session.entity';
export * from './user-profile.entity';

// Stores
export * from './store.entity';
export * from './store-hours.entity';
export * from './store-status-history.entity';

// Menu & Modifiers
export * from './media-asset.entity';
export * from './menu-category.entity';
export * from './menu-item.entity';
export * from './modifier-group.entity';
export * from './modifier.entity';
export * from './menu-item-modifier-group.entity';

// Splash & Carousel
export * from './splash-screen.entity';
export * from './splash-event.entity';
export * from './splash-session.entity';
export * from './splash-daily-aggregate.entity';
export * from './carousel.entity';
export * from './carousel-item.entity';
export * from './carousel-event.entity';
export * from './carousel-session.entity';
export * from './carousel-daily-aggregate.entity';
export * from './carousel-ab-test.entity';

// Coupons & Loyalty Programs
export * from './coupon-grant.entity';
export * from './program-event.entity';

// Orders & Payments
export * from './order.entity';
export * from './order-item.entity';
export * from './order-item-modifier.entity';
export * from './payment.entity';
export * from './payment-provider.entity';
export * from './loyalty-ledger.entity';
export * from './gift-card.entity';

// Promotions
export * from './promotion.entity';
export * from './promotion-redemption.entity';

// AI & Personalization
export * from './user-event.entity';
export * from './user-segment-assignment.entity';
export * from './ai-recommendation.entity';
export * from './ai-model-version.entity';
export * from './ai-training-job.entity';

// Reporting & Analytics
export * from './report-definition.entity';
export * from './report-schedule.entity';
export * from './fact-orders.entity';
export * from './dim-date.entity';
export * from './dim-time.entity';
export * from './dim-store.entity';
export * from './dim-user.entity';

// Inventory
export * from './inventory-item.entity';
export * from './inventory-transaction.entity';

// Refunds
export * from './refund-request.entity';
export * from './refund.entity';
