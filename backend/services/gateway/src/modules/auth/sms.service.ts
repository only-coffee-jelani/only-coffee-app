import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio;
  private verifyServiceSid: string;
  private messagingPhoneNumber: string; // Only for non-verification messages

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
    this.messagingPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken) {
      this.logger.warn(
        'Twilio credentials not configured. SMS functionality will be disabled.',
      );
    } else {
      this.twilioClient = twilio(accountSid, authToken);

      if (this.verifyServiceSid) {
        this.logger.log('Twilio Verify service initialized');
      } else {
        this.logger.warn(
          'TWILIO_VERIFY_SERVICE_SID not configured. Verification will not work.',
        );
      }
    }
  }

  /**
   * Send verification code via Twilio Verify API
   * Uses Twilio's managed verification service with built-in fraud protection
   * @param phoneNumber - Phone number in E.164 format (e.g., +12025551234)
   * @returns Promise<void>
   */
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    if (!this.twilioClient || !this.verifyServiceSid) {
      this.logger.warn('Twilio Verify not configured. Skipping verification send.');
      // In development, log that code would be sent
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.log(
          `[DEV] Would send verification code to ${phoneNumber} via Twilio Verify`,
        );
        this.logger.log(
          `[DEV] For testing: use code "123456" and call checkVerificationCode with approved=true`,
        );
      }
      return;
    }

    try {
      const verification = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms',
        });

      this.logger.log(
        `Verification sent successfully to ${phoneNumber}. Status: ${verification.status}, SID: ${verification.sid}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send verification to ${phoneNumber}:`, error);

      // In development, still allow testing
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.log(
          `[DEV] Verification send failed, but you can test with code "123456"`,
        );
      }

      // Don't throw error - we want graceful degradation
    }
  }

  /**
   * Check verification code via Twilio Verify API
   * @param phoneNumber - Phone number in E.164 format
   * @param code - 6-digit verification code entered by user
   * @returns Promise<boolean> - true if verification is approved, false otherwise
   */
  async checkVerificationCode(
    phoneNumber: string,
    code: string,
  ): Promise<boolean> {
    if (!this.twilioClient || !this.verifyServiceSid) {
      this.logger.warn('Twilio Verify not configured. Skipping verification check.');
      // In development, accept test code
      if (this.configService.get('NODE_ENV') === 'development') {
        const isTestCode = code === '123456';
        this.logger.log(
          `[DEV] Test code check for ${phoneNumber}: ${isTestCode ? 'APPROVED' : 'DENIED'}`,
        );
        return isTestCode;
      }
      return false;
    }

    try {
      const verificationCheck = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code,
        });

      const isApproved = verificationCheck.status === 'approved';

      this.logger.log(
        `Verification check for ${phoneNumber}: ${verificationCheck.status}`,
      );

      return isApproved;
    } catch (error) {
      this.logger.error(
        `Failed to check verification for ${phoneNumber}:`,
        error,
      );

      // Return false instead of throwing - invalid code is not an error state
      return false;
    }
  }

  /**
   * Send welcome SMS to new user (uses Programmable Messaging, not Verify)
   * @param phoneNumber - Phone number in E.164 format
   * @param firstName - User's first name
   */
  async sendWelcomeSms(phoneNumber: string, firstName?: string): Promise<void> {
    if (!this.twilioClient || !this.messagingPhoneNumber) {
      this.logger.warn(
        'Twilio Messaging not configured. Skipping welcome SMS.',
      );
      return;
    }

    try {
      const greeting = firstName ? `Hi ${firstName}!` : 'Welcome!';
      const message = await this.twilioClient.messages.create({
        body: `${greeting} Thanks for joining Only Coffee. Start earning rewards with every purchase!`,
        from: this.messagingPhoneNumber,
        to: phoneNumber,
      });

      this.logger.log(`Welcome SMS sent to ${phoneNumber}. SID: ${message.sid}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome SMS to ${phoneNumber}:`, error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Send marketing/promotional SMS (uses Programmable Messaging, not Verify)
   * @param phoneNumber - Phone number in E.164 format
   * @param message - Message content
   */
  async sendMarketingSms(phoneNumber: string, message: string): Promise<void> {
    if (!this.twilioClient || !this.messagingPhoneNumber) {
      this.logger.warn(
        'Twilio Messaging not configured. Skipping marketing SMS.',
      );
      return;
    }

    try {
      const sms = await this.twilioClient.messages.create({
        body: `${message}\n\nReply STOP to opt out.`,
        from: this.messagingPhoneNumber,
        to: phoneNumber,
      });

      this.logger.log(`Marketing SMS sent to ${phoneNumber}. SID: ${sms.sid}`);
    } catch (error) {
      this.logger.error(
        `Failed to send marketing SMS to ${phoneNumber}:`,
        error,
      );
      // Don't throw - this is not critical
    }
  }

  /**
   * Validate phone number format (E.164)
   * @param phoneNumber - Phone number to validate
   * @returns true if valid E.164 format
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number] (e.g., +12025551234)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }
}
