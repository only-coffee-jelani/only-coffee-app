import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { DateTime } from 'luxon';
import { CouponsService } from './coupons.service';
import { CouponGrantService } from './coupon-grant.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { CouponGrant, CouponType, CouponStatus } from '@shared/database/entities/coupon-grant.entity';
import { PromoCode, PromoType } from '@shared/database/entities/promo-code.entity';
import { User } from '@shared/database/entities/user.entity';

const TIMEZONE = 'America/Chicago';

describe('CouponsService', () => {
  let service: CouponsService;
  let couponRepository: Repository<CouponGrant>;
  let promoCodesService: PromoCodesService;
  let couponGrantService: CouponGrantService;

  const mockCouponRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockPromoCodesService = {
    validatePromoCode: jest.fn(),
    incrementUsage: jest.fn(),
  };

  const mockCouponGrantService = {
    grantStarterCoupons: jest.fn(),
    grantCoupon: jest.fn(),
    grantCouponsFromPromoCode: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: getRepositoryToken(CouponGrant),
          useValue: mockCouponRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PromoCodesService,
          useValue: mockPromoCodesService,
        },
        {
          provide: CouponGrantService,
          useValue: mockCouponGrantService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    couponRepository = module.get<Repository<CouponGrant>>(
      getRepositoryToken(CouponGrant),
    );
    promoCodesService = module.get<PromoCodesService>(PromoCodesService);
    couponGrantService = module.get<CouponGrantService>(CouponGrantService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('grantStarterCoupons', () => {
    it('should delegate to CouponGrantService', async () => {
      const mockCoupons = [
        { id: '1', type: CouponType.PERCENT_OFF },
        { id: '2', type: CouponType.PERCENT_OFF },
        { id: '3', type: CouponType.FIXED_PRICE },
        { id: '4', type: CouponType.FIXED_PRICE },
      ];

      mockCouponGrantService.grantStarterCoupons.mockResolvedValue(mockCoupons);

      const result = await service.grantStarterCoupons('user-123');

      expect(result).toEqual(mockCoupons);
      expect(mockCouponGrantService.grantStarterCoupons).toHaveBeenCalledWith('user-123');
    });
  });

  describe('redeemPromoCode', () => {
    it('should redeem a valid promo code and grant coupons', async () => {
      const mockPromoCode = {
        id: 'promo-123',
        code: 'WELCOME2025',
        type: PromoType.MULTI_USE,
        couponConfig: [
          {
            type: CouponType.PERCENT_OFF,
            percentOff: 50,
            label: '50% Off',
            expiresInDays: 7,
          },
        ],
      };

      mockPromoCodesService.validatePromoCode.mockResolvedValue({
        valid: true,
        promoCode: mockPromoCode,
      });

      mockCouponRepository.findOne.mockResolvedValue(null); // No existing redemption
      mockCouponRepository.create.mockReturnValue({});
      mockCouponRepository.save.mockResolvedValue({ id: 'coupon-123' });

      const result = await service.redeemPromoCode(
        'user-123',
        'WELCOME2025',
        'idempotency-key-123',
      );

      expect(result.success).toBe(true);
      expect(result.coupons).toHaveLength(1);
      expect(mockPromoCodesService.incrementUsage).toHaveBeenCalledWith(mockPromoCode.id);
    });

    it('should reject invalid promo code', async () => {
      mockPromoCodesService.validatePromoCode.mockResolvedValue({
        valid: false,
        reason: 'This code is no longer valid',
      });

      const result = await service.redeemPromoCode(
        'user-123',
        'INVALID',
        'idempotency-key-123',
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('This code is no longer valid');
      expect(result.coupons).toEqual([]);
    });

    it('should handle idempotency - return existing coupons', async () => {
      const existingCoupon = {
        id: 'coupon-123',
        userId: 'user-123',
        idempotencyKey: 'idempotency-key-123',
      };

      mockCouponRepository.findOne.mockResolvedValue(existingCoupon);
      mockCouponRepository.find.mockResolvedValue([existingCoupon]);

      const result = await service.redeemPromoCode(
        'user-123',
        'WELCOME2025',
        'idempotency-key-123',
      );

      expect(result.success).toBe(true);
      expect(result.coupons).toEqual([existingCoupon]);
      expect(mockPromoCodesService.validatePromoCode).not.toHaveBeenCalled();
    });

    it('should grant multiple coupons from one promo code', async () => {
      const mockPromoCode = {
        id: 'promo-123',
        code: 'WELCOME2025',
        couponConfig: [
          { type: CouponType.PERCENT_OFF, percentOff: 50, label: '50% Off', expiresInDays: 7 },
          { type: CouponType.FIXED_PRICE, priceOverrideCents: 199, label: '$1.99 Drink', expiresInDays: 7 },
        ],
      };

      mockPromoCodesService.validatePromoCode.mockResolvedValue({
        valid: true,
        promoCode: mockPromoCode,
      });

      mockCouponRepository.findOne.mockResolvedValue(null);
      mockCouponRepository.create.mockReturnValue({});
      mockCouponRepository.save.mockResolvedValue({});

      const result = await service.redeemPromoCode(
        'user-123',
        'WELCOME2025',
        'idempotency-key-123',
      );

      expect(result.coupons).toHaveLength(2);
      expect(mockCouponRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUserCoupons', () => {
    it('should return user coupons', async () => {
      const now = DateTime.now().setZone(TIMEZONE);
      const mockCoupons = [
        {
          id: 'coupon-1',
          userId: 'user-123',
          status: CouponStatus.ACTIVE,
          expiresAt: now.plus({ days: 5 }).toJSDate(),
        },
        {
          id: 'coupon-2',
          userId: 'user-123',
          status: CouponStatus.EXPIRED,
          expiresAt: now.minus({ days: 2 }).toJSDate(),
        },
      ];

      mockCouponRepository.find.mockResolvedValue(mockCoupons);

      const result = await service.getUserCoupons('user-123');

      expect(result).toEqual(mockCoupons);
      expect(result).toHaveLength(2);
    });

    it('should filter by status if provided', async () => {
      mockCouponRepository.find.mockResolvedValue([]);

      await service.getUserCoupons('user-123', CouponStatus.ACTIVE);

      expect(mockCouponRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123', status: CouponStatus.ACTIVE },
        order: { expiresAt: 'ASC' },
      });
    });
  });

  describe('redeemCoupon', () => {
    it('should redeem a valid active coupon', async () => {
      const now = DateTime.now().setZone(TIMEZONE);
      const mockCoupon = {
        id: 'coupon-123',
        userId: 'user-123',
        status: CouponStatus.ACTIVE,
        expiresAt: now.plus({ days: 5 }).toJSDate(),
      };

      const redeemedCoupon = {
        ...mockCoupon,
        status: CouponStatus.REDEEMED,
        redeemedAt: new Date(),
        redeemedOrderId: 'order-456',
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockCoupon),
        save: jest.fn().mockResolvedValue(redeemedCoupon),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      const result = await service.redeemCoupon('coupon-123', 'user-123', 'order-456');

      expect(result.status).toBe(CouponStatus.REDEEMED);
      expect(result.redeemedOrderId).toBe('order-456');
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should throw error if coupon not found', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.redeemCoupon('nonexistent', 'user-123', 'order-456'),
      ).rejects.toThrow('Coupon not found');
    });

    it('should throw error if coupon belongs to different user', async () => {
      const mockCoupon = {
        id: 'coupon-123',
        userId: 'user-999',
        status: CouponStatus.ACTIVE,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.redeemCoupon('coupon-123', 'user-123', 'order-456'),
      ).rejects.toThrow('Coupon not found');
    });

    it('should throw error if coupon already redeemed', async () => {
      const mockCoupon = {
        id: 'coupon-123',
        userId: 'user-123',
        status: CouponStatus.REDEEMED,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockCoupon),
        save: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.redeemCoupon('coupon-123', 'user-123', 'order-456'),
      ).rejects.toThrow('Coupon is not active');
    });

    it('should throw error if coupon is expired', async () => {
      const now = DateTime.now().setZone(TIMEZONE);
      const mockCoupon = {
        id: 'coupon-123',
        userId: 'user-123',
        status: CouponStatus.ACTIVE,
        expiresAt: now.minus({ days: 1 }).toJSDate(),
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockCoupon),
        save: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await expect(
        service.redeemCoupon('coupon-123', 'user-123', 'order-456'),
      ).rejects.toThrow('Coupon has expired');
    });
  });

  describe('markExpiredCoupons', () => {
    it('should mark expired coupons as EXPIRED', async () => {
      const result = { affected: 5 };
      mockCouponRepository.update.mockResolvedValue(result);

      const count = await service.markExpiredCoupons();

      expect(count).toBe(5);
      expect(mockCouponRepository.update).toHaveBeenCalledWith(
        {
          status: CouponStatus.ACTIVE,
          expiresAt: LessThan(expect.any(Date)),
        },
        { status: CouponStatus.EXPIRED },
      );
    });

    it('should return 0 if no coupons expired', async () => {
      mockCouponRepository.update.mockResolvedValue({ affected: 0 });

      const count = await service.markExpiredCoupons();

      expect(count).toBe(0);
    });
  });

  describe('getCouponsExpiringSoon', () => {
    it('should find coupons expiring in next 48 hours', async () => {
      const now = DateTime.now().setZone(TIMEZONE);
      const expiringCoupon = {
        id: 'expiring-1',
        status: CouponStatus.ACTIVE,
        expiresAt: now.plus({ hours: 24 }).toJSDate(),
      };

      mockCouponRepository.find.mockResolvedValue([expiringCoupon]);

      const result = await service.getCouponsExpiringSoon(48);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('expiring-1');
    });
  });

  describe('cancelCoupon', () => {
    it('should cancel an active coupon', async () => {
      const mockCoupon = {
        id: 'coupon-123',
        status: CouponStatus.ACTIVE,
      };

      mockCouponRepository.findOne.mockResolvedValue(mockCoupon);
      mockCouponRepository.save.mockResolvedValue({
        ...mockCoupon,
        status: CouponStatus.CANCELLED,
      });

      const result = await service.cancelCoupon('coupon-123');

      expect(result.status).toBe(CouponStatus.CANCELLED);
      expect(mockCouponRepository.save).toHaveBeenCalled();
    });

    it('should throw error if coupon not found', async () => {
      mockCouponRepository.findOne.mockResolvedValue(null);

      await expect(service.cancelCoupon('nonexistent')).rejects.toThrow(
        'Coupon not found',
      );
    });
  });
});
