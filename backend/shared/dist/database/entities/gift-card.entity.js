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
exports.GiftCard = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let GiftCard = class GiftCard {
};
exports.GiftCard = GiftCard;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'gift_card_id' }),
    __metadata("design:type", String)
], GiftCard.prototype, "giftCardId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], GiftCard.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'purchased_by_user_id', nullable: true }),
    __metadata("design:type", String)
], GiftCard.prototype, "purchasedByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'redeemed_by_user_id', nullable: true }),
    __metadata("design:type", String)
], GiftCard.prototype, "redeemedByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, name: 'initial_balance' }),
    __metadata("design:type", Number)
], GiftCard.prototype, "initialBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, name: 'current_balance' }),
    __metadata("design:type", Number)
], GiftCard.prototype, "currentBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'purchased_at', nullable: true }),
    __metadata("design:type", Date)
], GiftCard.prototype, "purchasedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'redeemed_at', nullable: true }),
    __metadata("design:type", Date)
], GiftCard.prototype, "redeemedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'expires_at', nullable: true }),
    __metadata("design:type", Date)
], GiftCard.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], GiftCard.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], GiftCard.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.giftCardsPurchased),
    (0, typeorm_1.JoinColumn)({ name: 'purchased_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], GiftCard.prototype, "purchasedByUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.giftCardsRedeemed),
    (0, typeorm_1.JoinColumn)({ name: 'redeemed_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], GiftCard.prototype, "redeemedByUser", void 0);
exports.GiftCard = GiftCard = __decorate([
    (0, typeorm_1.Entity)('gift_cards'),
    (0, typeorm_1.Index)(['code'], { unique: true })
], GiftCard);
//# sourceMappingURL=gift-card.entity.js.map