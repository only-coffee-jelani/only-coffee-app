"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponGrant = exports.CouponStatus = exports.CouponType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const promo_code_entity_1 = require("./promo-code.entity");
var CouponType;
(function (CouponType) {
    CouponType["PERCENT_OFF"] = "percent_off";
    CouponType["FIXED_PRICE"] = "fixed_price";
    CouponType["FIXED_AMOUNT"] = "fixed_amount";
    CouponType["FREE_ITEM"] = "free_item";
})(CouponType || (exports.CouponType = CouponType = {}));
var CouponStatus;
(function (CouponStatus) {
    CouponStatus["ACTIVE"] = "active";
    CouponStatus["REDEEMED"] = "redeemed";
    CouponStatus["EXPIRED"] = "expired";
    CouponStatus["CANCELLED"] = "cancelled";
})(CouponStatus || (exports.CouponStatus = CouponStatus = {}));
let CouponGrant = class CouponGrant {
};
exports.CouponGrant = CouponGrant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CouponGrant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], CouponGrant.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CouponGrant.prototype, "promoCodeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CouponType }),
    __metadata("design:type", String)
], CouponGrant.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CouponGrant.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CouponGrant.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CouponGrant.prototype, "valueCents", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CouponGrant.prototype, "percentOff", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CouponGrant.prototype, "priceOverrideCents", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CouponGrant.prototype, "eligibleItems", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'both' }),
    __metadata("design:type", String)
], CouponGrant.prototype, "channels", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CouponGrant.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], CouponGrant.prototype, "redeemedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CouponGrant.prototype, "redeemedOrderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CouponStatus, default: CouponStatus.ACTIVE }),
    __metadata("design:type", String)
], CouponGrant.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], CouponGrant.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CouponGrant.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CouponGrant.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.rewardsLedger),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], CouponGrant.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => promo_code_entity_1.PromoCode, (promoCode) => promoCode.coupons, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'promoCodeId' }),
    __metadata("design:type", promo_code_entity_1.PromoCode)
], CouponGrant.prototype, "promoCode", void 0);
exports.CouponGrant = CouponGrant = __decorate([
    (0, typeorm_1.Entity)('coupon_grants'),
    (0, typeorm_1.Index)(['userId', 'status']),
    (0, typeorm_1.Index)(['status', 'expiresAt']),
    (0, typeorm_1.Index)(['promoCodeId'])
], CouponGrant);
//# sourceMappingURL=coupon-grant.entity.js.map