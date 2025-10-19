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
exports.UserTierHistory = exports.TierChangeReason = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var TierChangeReason;
(function (TierChangeReason) {
    TierChangeReason["QUALIFIED"] = "qualified";
    TierChangeReason["DOWNGRADED"] = "downgraded";
    TierChangeReason["MANUAL_OVERRIDE"] = "manual_override";
    TierChangeReason["INITIAL_SETUP"] = "initial_setup";
})(TierChangeReason || (exports.TierChangeReason = TierChangeReason = {}));
let UserTierHistory = class UserTierHistory {
};
exports.UserTierHistory = UserTierHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserTierHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], UserTierHistory.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_entity_1.UserTier, nullable: true }),
    __metadata("design:type", String)
], UserTierHistory.prototype, "previousTier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_entity_1.UserTier }),
    __metadata("design:type", String)
], UserTierHistory.prototype, "newTier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TierChangeReason }),
    __metadata("design:type", String)
], UserTierHistory.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], UserTierHistory.prototype, "changedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserTierHistory.prototype, "monthlyVisitsAtChange", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserTierHistory.prototype, "tierXPAtChange", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], UserTierHistory.prototype, "annualSpendAtChange", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserTierHistory.prototype, "sevenDayStreakCountAtChange", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], UserTierHistory.prototype, "adminNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UserTierHistory.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], UserTierHistory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], UserTierHistory.prototype, "user", void 0);
exports.UserTierHistory = UserTierHistory = __decorate([
    (0, typeorm_1.Entity)('user_tier_history'),
    (0, typeorm_1.Index)(['userId', 'changedAt']),
    (0, typeorm_1.Index)(['changedAt']),
    (0, typeorm_1.Index)(['newTier'])
], UserTierHistory);
//# sourceMappingURL=user-tier-history.entity.js.map