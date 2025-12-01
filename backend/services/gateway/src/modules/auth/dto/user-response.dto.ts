import { ApiProperty } from '@nestjs/swagger';
import { User } from '@shared/database/entities';

/**
 * User Response DTO
 * Defines the API contract for user data in responses
 * Maps internal userId field to id for client consistency
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'Unique user identifier',
    example: 'e00c8f9a-bd7c-4a1c-bdea-2909be29f2e8',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+12025551234',
    required: false,
  })
  phone: string | null;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string | null;

  @ApiProperty({
    description: 'User birthdate',
    example: '1990-01-01',
    required: false,
  })
  birthdate: Date | null;

  @ApiProperty({
    description: 'Email verification status',
    example: false,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Phone verification status',
    example: false,
  })
  phoneVerified: boolean;

  @ApiProperty({
    description: 'Marketing opt-in status',
    example: false,
  })
  marketingOptIn: boolean;

  @ApiProperty({
    description: 'Account active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'User role',
    example: 'CUSTOMER',
  })
  role: string;

  @ApiProperty({
    description: 'Loyalty tier ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  loyaltyTierId: string | null;

  @ApiProperty({
    description: 'Loyalty points balance',
    example: 0,
  })
  loyaltyPoints: number;

  @ApiProperty({
    description: 'Default store ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  defaultStoreId: string | null;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2025-12-01T04:45:50.269Z',
    required: false,
  })
  lastLoginAt: Date | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-12-01T04:45:50.269Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-12-01T04:45:50.269Z',
  })
  updatedAt: Date;

  /**
   * Factory method to create UserResponseDto from User entity
   * Maps userId to id for API consistency
   */
  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.userId; // Map userId to id
    dto.email = user.email;
    dto.phone = user.phone;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.birthdate = user.birthdate;
    dto.emailVerified = user.emailVerified;
    dto.phoneVerified = user.phoneVerified;
    dto.marketingOptIn = user.marketingOptIn;
    dto.isActive = user.isActive;
    dto.role = user.role;
    dto.loyaltyTierId = user.loyaltyTierId;
    dto.loyaltyPoints = user.loyaltyPoints;
    dto.defaultStoreId = user.defaultStoreId;
    dto.lastLoginAt = user.lastLoginAt;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}

/**
 * Auth Response DTO
 * Response structure for authentication endpoints
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'User data',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;
}

