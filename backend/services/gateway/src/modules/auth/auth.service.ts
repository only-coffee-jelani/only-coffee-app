import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@shared/database/entities';
import { JwtPayload } from '@shared/interfaces/jwt-payload.interface';
import {
  RegisterDto,
  LoginDto,
  SendCodeDto,
  VerifyCodeDto,
  CompleteProfileDto,
} from './dto';
import { CouponsService } from '../coupons/coupons.service';
import { SmsService } from './sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly couponsService: CouponsService,
    private readonly smsService: SmsService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone, birthDate } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      birthDate: birthDate ? new Date(birthDate) : null,
    });

    await this.userRepository.save(user);

    // Grant starter coupons (run async, don't block registration)
    this.couponsService
      .grantStarterCoupons(user.id)
      .then(() => {
        this.logger.log(`Starter coupons granted to new user: ${user.id}`);
      })
      .catch((error) => {
        this.logger.error(
          `Failed to grant starter coupons to user ${user.id}:`,
          error,
        );
      });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.validateUser(payload);
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Send verification code to phone number via Twilio Verify
   * Creates or updates user to track phone and preferences
   */
  async sendCode(sendCodeDto: SendCodeDto) {
    const { phone, marketingOptIn = false } = sendCodeDto;

    // Validate phone number format
    if (!this.smsService.isValidPhoneNumber(phone)) {
      throw new BadRequestException(
        'Invalid phone number format. Please use E.164 format (e.g., +12025551234)',
      );
    }

    // Find or create user by phone
    let user = await this.userRepository.findOne({ where: { phone } });

    if (user) {
      // Update existing user's marketing preference
      user.marketingOptIn = marketingOptIn;
      await this.userRepository.save(user);

      this.logger.log(`Sending verification to existing phone: ${phone}`);
    } else {
      // Create new user with minimal info (phone only)
      // Twilio Verify handles the code generation and storage
      user = this.userRepository.create({
        phone,
        email: `${phone.replace('+', '')}@temp.onlycoffee.com`, // Temporary email
        firstName: 'User',
        lastName: phone.slice(-4), // Last 4 digits as placeholder
        marketingOptIn,
        phoneVerified: false,
      });
      await this.userRepository.save(user);

      this.logger.log(`New user created with phone: ${phone}`);
    }

    // Send verification code via Twilio Verify API
    // Twilio handles code generation, storage, expiry, and SMS delivery
    await this.smsService.sendVerificationCode(phone);

    return {
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: 600, // 10 minutes (Twilio Verify default)
    };
  }

  /**
   * Verify code via Twilio Verify and authenticate user
   * Returns JWT tokens on successful verification
   */
  async verifyCode(verifyCodeDto: VerifyCodeDto) {
    const { phone, code } = verifyCodeDto;

    // Find user by phone
    const user = await this.userRepository.findOne({ where: { phone } });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid phone number. Please send a verification code first.',
      );
    }

    // Verify code via Twilio Verify API
    // Twilio handles code validation, expiry checking, and rate limiting
    const isVerified = await this.smsService.checkVerificationCode(phone, code);

    if (!isVerified) {
      throw new UnauthorizedException(
        'Invalid or expired verification code. Please try again.',
      );
    }

    // Mark phone as verified and update last login
    user.phoneVerified = true;
    user.lastLoginAt = new Date();

    // Check if this is a new user (temp email pattern)
    const isNewUser = user.email.includes('@temp.onlycoffee.com');

    await this.userRepository.save(user);

    this.logger.log(`Phone verified successfully: ${phone}`);

    // Grant starter coupons for new users
    if (isNewUser) {
      this.couponsService
        .grantStarterCoupons(user.id)
        .then(() => {
          this.logger.log(`Starter coupons granted to new user: ${user.id}`);
        })
        .catch((error) => {
          this.logger.error(
            `Failed to grant starter coupons to user ${user.id}:`,
            error,
          );
        });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      isNewUser, // Tell client if profile completion is needed
    };
  }

  /**
   * Complete user profile with email and name
   * Optional step after phone verification
   */
  async completeProfile(userId: string, completeProfileDto: CompleteProfileDto) {
    const { email, firstName, lastName } = completeProfileDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email is already in use');
      }
      user.email = email;
      user.emailVerified = false; // Will need to verify new email
    }

    // Update profile fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    // Log profile update details for debugging
    this.logger.log(
      `Saving profile for user ${userId}: ${JSON.stringify({ email, firstName, lastName })}`,
    );

    try {
      await this.userRepository.save(user);
      this.logger.log(`Profile completed for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Database save failed for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to update profile');
    }

    // Send welcome SMS if they opted in for marketing
    // Don't let SMS failure break profile completion
    if (user.marketingOptIn && user.phone) {
      try {
        await this.smsService.sendWelcomeSms(user.phone, user.firstName);
      } catch (error) {
        this.logger.error(
          `Welcome SMS failed for ${user.phone}, but profile completed:`,
          error,
        );
        // Continue - SMS failure is not critical
      }
    }

    return {
      user: this.sanitizeUser(user),
      success: true,
      message: 'Profile updated successfully',
    };
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
