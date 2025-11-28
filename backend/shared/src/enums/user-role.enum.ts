/**
 * UserRole Enum
 * Represents user roles in the system
 * Note: In the new schema, regular users don't have roles - only admin users do
 * This enum is kept for backward compatibility with existing code
 */
export enum UserRole {
  CUSTOMER = 'customer',
  STORE_STAFF = 'store_staff',
  ADMIN = 'admin',
}

