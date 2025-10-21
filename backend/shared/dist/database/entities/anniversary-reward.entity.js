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
exports.AnniversaryReward = exports.AnniversaryBadge = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const coupon_grant_entity_1 = require("./coupon-grant.entity");
var AnniversaryBadge;
(function (AnniversaryBadge) {
    AnniversaryBadge["YEAR_1"] = "year_1_anniversary";
    AnniversaryBadge["YEAR_2"] = "year_2_anniversary";
    AnniversaryBadge["YEAR_3"] = "year_3_anniversary";
    AnniversaryBadge["YEAR_5"] = "year_5_anniversary";
    AnniversaryBadge["YEAR_10"] = "year_10_anniversary";
})(AnniversaryBadge || (exports.AnniversaryBadge = AnniversaryBadge = {}));
let AnniversaryReward = class AnniversaryReward {
};
exports.AnniversaryReward = AnniversaryReward;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AnniversaryReward.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], AnniversaryReward.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], AnniversaryReward.prototype, "anniversaryYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], AnniversaryReward.prototype, "anniversaryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AnniversaryReward.prototype, "isGranted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], AnniversaryReward.prototype, "grantedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AnniversaryReward.prototype, "couponId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AnniversaryBadge, nullable: true }),
    __metadata("design:type", String)
], AnniversaryReward.prototype, "badgeAwarded", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AnniversaryReward.prototype, "isRedeemed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], AnniversaryReward.prototype, "redeemedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], AnniversaryReward.prototype, "customMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AnniversaryReward.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], AnniversaryReward.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], AnniversaryReward.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => coupon_grant_entity_1.CouponGrant, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'couponId' }),
    __metadata("design:type", coupon_grant_entity_1.CouponGrant)
], AnniversaryReward.prototype, "coupon", void 0);
exports.AnniversaryReward = AnniversaryReward = __decorate([
    (0, typeorm_1.Entity)('anniversary_rewards'),
    (0, typeorm_1.Index)(['userId', 'anniversaryYear'], { unique: true }),
    (0, typeorm_1.Index)(['anniversaryDate']),
    (0, typeorm_1.Index)(['isGranted'])
], AnniversaryReward);
//# sourceMappingURL=anniversary-reward.entity.js.map