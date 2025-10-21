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
exports.RewardsLedger = exports.RewardTransactionType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var RewardTransactionType;
(function (RewardTransactionType) {
    RewardTransactionType["EARNED"] = "earned";
    RewardTransactionType["REDEEMED"] = "redeemed";
    RewardTransactionType["EXPIRED"] = "expired";
    RewardTransactionType["ADJUSTED"] = "adjusted";
    RewardTransactionType["BIRTHDAY_BONUS"] = "birthday_bonus";
})(RewardTransactionType || (exports.RewardTransactionType = RewardTransactionType = {}));
let RewardsLedger = class RewardsLedger {
};
exports.RewardsLedger = RewardsLedger;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RewardsLedger.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RewardsLedger.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], RewardsLedger.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RewardTransactionType }),
    __metadata("design:type", String)
], RewardsLedger.prototype, "transactionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], RewardsLedger.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], RewardsLedger.prototype, "balanceAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RewardsLedger.prototype, "orderAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], RewardsLedger.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RewardsLedger.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], RewardsLedger.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], RewardsLedger.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.rewardsLedger),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], RewardsLedger.prototype, "user", void 0);
exports.RewardsLedger = RewardsLedger = __decorate([
    (0, typeorm_1.Entity)('rewards_ledger'),
    (0, typeorm_1.Index)(['userId', 'createdAt']),
    (0, typeorm_1.Index)(['transactionType'])
], RewardsLedger);
//# sourceMappingURL=rewards-ledger.entity.js.map