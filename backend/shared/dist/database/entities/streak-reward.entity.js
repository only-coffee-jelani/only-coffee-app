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
exports.StreakReward = exports.RewardType = void 0;
const typeorm_1 = require("typeorm");
const coupon_grant_entity_1 = require("./coupon-grant.entity");
var RewardType;
(function (RewardType) {
    RewardType["COUPON_GRANT"] = "coupon_grant";
    RewardType["POINTS_GRANT"] = "points_grant";
})(RewardType || (exports.RewardType = RewardType = {}));
let StreakReward = class StreakReward {
};
exports.StreakReward = StreakReward;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StreakReward.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', unique: true }),
    __metadata("design:type", Number)
], StreakReward.prototype, "streakDay", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RewardType, default: RewardType.COUPON_GRANT }),
    __metadata("design:type", String)
], StreakReward.prototype, "rewardType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: coupon_grant_entity_1.CouponType }),
    __metadata("design:type", String)
], StreakReward.prototype, "couponType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], StreakReward.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StreakReward.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], StreakReward.prototype, "valueCents", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], StreakReward.prototype, "maxValueCents", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 7 }),
    __metadata("design:type", Number)
], StreakReward.prototype, "expiryDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'both' }),
    __metadata("design:type", String)
], StreakReward.prototype, "channels", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], StreakReward.prototype, "eligibleItems", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], StreakReward.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], StreakReward.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], StreakReward.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StreakReward.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StreakReward.prototype, "updatedAt", void 0);
exports.StreakReward = StreakReward = __decorate([
    (0, typeorm_1.Entity)('streak_rewards'),
    (0, typeorm_1.Index)(['streakDay'], { unique: true }),
    (0, typeorm_1.Index)(['isActive'])
], StreakReward);
//# sourceMappingURL=streak-reward.entity.js.map