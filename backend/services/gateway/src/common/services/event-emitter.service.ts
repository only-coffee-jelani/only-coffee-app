import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEvent, ProgramEventType } from '@shared/database/entities';

export interface EmitEventOptions {
  eventType: ProgramEventType;
  userId?: string;
  couponId?: string;
  orderId?: string;
  promoCodeId?: string;
  eventData?: Record<string, any>;
}

@Injectable()
export class EventEmitterService {
  private readonly logger = new Logger(EventEmitterService.name);

  constructor(
    @InjectRepository(ProgramEvent)
    private readonly programEventRepository: Repository<ProgramEvent>,
  ) {}

  /**
   * Emit a program event for analytics tracking
   */
  async emitEvent(options: EmitEventOptions): Promise<ProgramEvent> {
    const programEvent = this.programEventRepository.create({
      userId: options.userId || null,
      eventType: options.eventType,
      couponId: options.couponId || null,
      orderId: options.orderId || null,
      promoCodeId: options.promoCodeId || null,
      eventData: options.eventData || null,
    });

    const savedEvent = await this.programEventRepository.save(programEvent);
    this.logger.log(`Emitted program event: ${options.eventType} for user ${options.userId || 'N/A'}`);
    return savedEvent;
  }

  /**
   * Emit a coupon granted event
   */
  async emitCouponGranted(
    userId: string,
    couponId: string,
    eventData: Record<string, any> = {},
  ): Promise<ProgramEvent> {
    return this.emitEvent({
      eventType: ProgramEventType.COUPON_GRANTED,
      userId,
      couponId,
      eventData: {
        ...eventData,
        source: eventData.source || 'unknown',
        type: eventData.type,
      },
    });
  }

  /**
   * Emit a coupon redeemed event
   */
  async emitCouponRedeemed(
    userId: string,
    couponId: string,
    orderId: string,
    eventData: Record<string, any> = {},
  ): Promise<ProgramEvent> {
    return this.emitEvent({
      eventType: ProgramEventType.COUPON_REDEEMED,
      userId,
      couponId,
      orderId,
      eventData,
    });
  }

  /**
   * Emit a coupon expired event
   */
  async emitCouponExpired(
    userId: string | null,
    couponId: string,
    eventData: Record<string, any> = {},
  ): Promise<ProgramEvent> {
    return this.emitEvent({
      eventType: ProgramEventType.COUPON_EXPIRED,
      userId: userId || undefined,
      couponId,
      eventData,
    });
  }

  /**
   * Emit a promo code redeemed event
   */
  async emitPromoCodeRedeemed(
    userId: string,
    promoCodeId: string,
    eventData: Record<string, any> = {},
  ): Promise<ProgramEvent> {
    return this.emitEvent({
      eventType: ProgramEventType.PROMO_CODE_REDEEMED,
      userId,
      promoCodeId,
      eventData: {
        ...eventData,
        code: eventData.code,
        couponsGranted: eventData.couponsGranted || 0,
      },
    });
  }
}
