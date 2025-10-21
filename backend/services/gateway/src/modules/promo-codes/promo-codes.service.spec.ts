import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { PromoCodesService } from './promo-codes.service';
import { PromoCode } from '@shared/database/entities/promo-code.entity';
import { PromoType } from '@shared/database/entities/promo-code.entity';

const TIMEZONE = 'America/Chicago';

describe('PromoCodesService', () => {
  let service: PromoCodesService;
  let repository: Repository<PromoCode>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoCodesService,
        {
          provide: getRepositoryToken(PromoCode),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PromoCodesService>(PromoCodesService);
    repository = module.get<Repository<PromoCode>>(
      getRepositoryToken(PromoCode),
    );

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPromoCode', () => {
    it('should create a promo code with valid data', async () => {
      const expiresAt = DateTime.now().setZone(TIMEZONE).plus({ days: 30 }).toJSDate();
      const dto = {
        code: 'WELCOME2025',
        description: 'Welcome offer',
        type: PromoType.MULTI_USE,
        maxUses: 500,
        expiresAt,
        couponConfig: [
          {
            type: 'PERCENT_OFF',
            percentOff: 50,
            label: '50% Off',
            expiresInDays: 7,
          },
        ],
        createdBy: 'admin-user',
      };

      const mockPromoCode = {
        id: 'test-id',
        ...dto,
        code: 'WELCOME2025',
        usedCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockPromoCode);
      mockRepository.save.mockResolvedValue(mockPromoCode);

      const result = await service.createPromoCode(dto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'WELCOME2025' },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        code: 'WELCOME2025',
        type: PromoType.MULTI_USE,
      }));
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.code).toBe('WELCOME2025');
    });

    it('should throw error if promo code already exists', async () => {
      const dto = {
        code: 'EXISTING',
        type: PromoType.SINGLE_USE,
        couponConfig: [],
        createdBy: 'admin-user',
      };

      mockRepository.findOne.mockResolvedValue({ code: 'EXISTING' });

      await expect(service.createPromoCode(dto)).rejects.toThrow(
        'Promo code EXISTING already exists',
      );
    });

    it('should auto-uppercase the promo code', async () => {
      const dto = {
        code: 'welcome2025',
        type: PromoType.MULTI_USE,
        couponConfig: [],
        createdBy: 'admin-user',
      };

      const mockPromoCode = {
        id: 'test-id',
        code: 'WELCOME2025',
        usedCount: 0,
        isActive: true,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockPromoCode);
      mockRepository.save.mockResolvedValue(mockPromoCode);

      const result = await service.createPromoCode(dto);

      expect(result.code).toBe('WELCOME2025');
    });
  });

  describe('validatePromoCode', () => {
    it('should validate an active promo code successfully', async () => {
      const futureDate = DateTime.now().setZone(TIMEZONE).plus({ days: 7 }).toJSDate();
      const mockPromoCode = {
        id: 'test-id',
        code: 'VALID2025',
        type: PromoType.MULTI_USE,
        maxUses: 100,
        usedCount: 50,
        isActive: true,
        expiresAt: futureDate,
      };

      mockRepository.findOne.mockResolvedValue(mockPromoCode);

      const result = await service.validatePromoCode('valid2025');

      expect(result.valid).toBe(true);
      expect(result.promoCode).toBeDefined();
      expect(result.reason).toBeUndefined();
    });

    it('should reject non-existent promo code', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.validatePromoCode('NONEXISTENT');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('This code is no longer valid');
    });

    it('should reject inactive promo code', async () => {
      const mockPromoCode = {
        id: 'test-id',
        code: 'INACTIVE',
        isActive: false,
      };

      mockRepository.findOne.mockResolvedValue(mockPromoCode);

      const result = await service.validatePromoCode('INACTIVE');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('This code is no longer valid');
    });

    it('should reject expired promo code', async () => {
      const pastDate = DateTime.now().setZone(TIMEZONE).minus({ days: 1 }).toJSDate();
      const mockPromoCode = {
        id: 'test-id',
        code: 'EXPIRED',
        isActive: true,
        expiresAt: pastDate,
      };

      mockRepository.findOne.mockResolvedValue(mockPromoCode);

      const result = await service.validatePromoCode('EXPIRED');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('This code is no longer valid');
    });

    it('should reject promo code that reached max uses', async () => {
      const futureDate = DateTime.now().setZone(TIMEZONE).plus({ days: 7 }).toJSDate();
      const mockPromoCode = {
        id: 'test-id',
        code: 'MAXED',
        type: PromoType.MULTI_USE,
        maxUses: 100,
        usedCount: 100,
        isActive: true,
        expiresAt: futureDate,
      };

      mockRepository.findOne.mockResolvedValue(mockPromoCode);

      const result = await service.validatePromoCode('MAXED');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('This code has reached its maximum uses');
    });

    it('should validate unlimited promo code regardless of uses', async () => {
      const futureDate = DateTime.now().setZone(TIMEZONE).plus({ days: 7 }).toJSDate();
      const mockPromoCode = {
        id: 'test-id',
        code: 'UNLIMITED',
        type: PromoType.UNLIMITED,
        maxUses: null,
        usedCount: 10000,
        isActive: true,
        expiresAt: futureDate,
      };

      mockRepository.findOne.mockResolvedValue(mockPromoCode);

      const result = await service.validatePromoCode('UNLIMITED');

      expect(result.valid).toBe(true);
      expect(result.promoCode).toBeDefined();
    });
  });

  describe('incrementUsage', () => {
    it('should increment the used count', async () => {
      const mockPromoCode = {
        id: 'test-id',
        code: 'TEST',
        usedCount: 5,
      };

      mockRepository.findOne.mockResolvedValue(mockPromoCode);
      mockRepository.save.mockResolvedValue({
        ...mockPromoCode,
        usedCount: 6,
      });

      await service.incrementUsage('test-id');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ usedCount: 6 }),
      );
    });
  });

  describe('getPromoCodeById', () => {
    it('should retrieve a promo code by id', async () => {
      const mockPromoCode = {
        id: 'test-id',
        code: 'TEST',
      };

      mockRepository.findOne.mockResolvedValue(mockPromoCode);

      const result = await service.getPromoCodeById('test-id');

      expect(result).toEqual(mockPromoCode);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('should throw error for non-existent promo code', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getPromoCodeById('nonexistent')).rejects.toThrow(
        'Promo code not found',
      );
    });
  });

  describe('getAllPromoCodes', () => {
    it('should list promo codes with pagination', async () => {
      const mockPromoCodes = [
        { id: '1', code: 'CODE1' },
        { id: '2', code: 'CODE2' },
      ];

      mockRepository.find.mockResolvedValue(mockPromoCodes);
      mockRepository.count.mockResolvedValue(10);

      const result = await service.getAllPromoCodes({ page: 1, limit: 2 });

      expect(result.data).toEqual(mockPromoCodes);
      expect(result.total).toBe(10);
      expect(mockRepository.find).toHaveBeenCalledWith({
        take: 2,
        skip: 0,
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by isActive', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      await service.getAllPromoCodes({ page: 1, limit: 10, isActive: true });

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        take: 10,
        skip: 0,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getPromoCodeStats', () => {
    it('should calculate promo code statistics', async () => {
      const mockPromoCode = {
        id: 'test-id',
        code: 'TEST',
        usedCount: 100,
        coupons: [
          { status: 'REDEEMED' },
          { status: 'REDEEMED' },
          { status: 'ACTIVE' },
        ],
      };

      mockRepository.findOne.mockResolvedValue(mockPromoCode);

      const result = await service.getPromoCodeStats('test-id');

      expect(result.totalUses).toBe(100);
      expect(result.totalCouponsGranted).toBe(3);
      expect(result.totalCouponsRedeemed).toBe(2);
      expect(result.redemptionRate).toBeCloseTo(66.67, 1);
    });

    it('should throw error for non-existent promo code', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getPromoCodeStats('nonexistent')).rejects.toThrow(
        'Promo code not found',
      );
    });

    it('should handle zero division in redemption rate', async () => {
      const mockPromoCode = {
        id: 'test-id',
        code: 'TEST',
        usedCount: 0,
        coupons: [],
      };

      mockRepository.findOne.mockResolvedValue(mockPromoCode);

      const result = await service.getPromoCodeStats('test-id');

      expect(result.redemptionRate).toBe(0);
    });
  });

  describe('deactivatePromoCode', () => {
    it('should deactivate a promo code', async () => {
      const mockPromoCode = {
        id: 'test-id',
        code: 'TEST',
        isActive: true,
      };

      mockRepository.findOne.mockResolvedValue(mockPromoCode);
      mockRepository.save.mockResolvedValue({
        ...mockPromoCode,
        isActive: false,
      });

      const result = await service.deactivatePromoCode('test-id');

      expect(result.isActive).toBe(false);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw error for non-existent promo code', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deactivatePromoCode('nonexistent')).rejects.toThrow(
        'Promo code not found',
      );
    });
  });
});
