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
exports.GiftCard = exports.GiftCardStatus = exports.GiftCardType = void 0;
const typeorm_1 = require("typeorm");
var GiftCardType;
(function (GiftCardType) {
    GiftCardType["AMOUNT"] = "amount";
    GiftCardType["FREE_COFFEE"] = "free_coffee";
})(GiftCardType || (exports.GiftCardType = GiftCardType = {}));
var GiftCardStatus;
(function (GiftCardStatus) {
    GiftCardStatus["PENDING"] = "pending";
    GiftCardStatus["ACTIVE"] = "active";
    GiftCardStatus["REDEEMED"] = "redeemed";
    GiftCardStatus["EXPIRED"] = "expired";
    GiftCardStatus["CANCELLED"] = "cancelled";
})(GiftCardStatus || (exports.GiftCardStatus = GiftCardStatus = {}));
let GiftCard = class GiftCard {
};
exports.GiftCard = GiftCard;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GiftCard.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, unique: true }),
    __metadata("design:type", String)
], GiftCard.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: GiftCardType }),
    __metadata("design:type", String)
], GiftCard.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: GiftCardStatus, default: GiftCardStatus.PENDING }),
    __metadata("design:type", String)
], GiftCard.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], GiftCard.prototype, "senderUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], GiftCard.prototype, "recipientUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], GiftCard.prototype, "recipientEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], GiftCard.prototype, "recipientPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GiftCard.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GiftCard.prototype, "remainingBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GiftCard.prototype, "maxRedeemValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GiftCard.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], GiftCard.prototype, "stripePaymentIntentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], GiftCard.prototype, "redeemedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], GiftCard.prototype, "redeemedOrderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], GiftCard.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], GiftCard.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], GiftCard.prototype, "updatedAt", void 0);
exports.GiftCard = GiftCard = __decorate([
    (0, typeorm_1.Entity)('gift_cards'),
    (0, typeorm_1.Index)(['code'], { unique: true }),
    (0, typeorm_1.Index)(['senderUserId']),
    (0, typeorm_1.Index)(['recipientUserId']),
    (0, typeorm_1.Index)(['status'])
], GiftCard);
//# sourceMappingURL=gift-card.entity.js.map