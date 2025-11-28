/**
 * OrderStatus Enum
 * Represents order statuses in the system
 * These correspond to the codes in the order_statuses lookup table
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

