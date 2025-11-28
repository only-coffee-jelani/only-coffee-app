/**
 * EventType Enum
 * Represents user event types tracked in the system
 * These correspond to the event_type values in the user_events table
 */
export enum EventType {
  APP_OPENED = 'app_opened',
  APP_CLOSED = 'app_closed',
  PURCHASE_COMPLETED = 'purchase_completed',
  CART_ABANDONED = 'cart_abandoned',
  MENU_VIEWED = 'menu_viewed',
  ITEM_VIEWED = 'item_viewed',
  SEARCH_PERFORMED = 'search_performed',
  FILTER_APPLIED = 'filter_applied',
  NOTIFICATION_OPENED = 'notification_opened',
  NOTIFICATION_DISMISSED = 'notification_dismissed',
  PROMOTION_VIEWED = 'promotion_viewed',
  PROMOTION_CLICKED = 'promotion_clicked',
  PROMOTION_REDEEMED = 'promotion_redeemed',
  LOCATION_ENTERED = 'location_entered',
  LOCATION_EXITED = 'location_exited',
  GEOFENCE_TRIGGERED = 'geofence_triggered',
  PROFILE_UPDATED = 'profile_updated',
  PREFERENCE_CHANGED = 'preference_changed',
  LOYALTY_CHECKED = 'loyalty_checked',
  REWARD_VIEWED = 'reward_viewed',
}

