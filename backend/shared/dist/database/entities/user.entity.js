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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
const loyalty_tier_entity_1 = require("./loyalty-tier.entity");
const store_entity_1 = require("./store.entity");
const user_device_entity_1 = require("./user-device.entity");
const user_session_entity_1 = require("./user-session.entity");
const user_profile_entity_1 = require("./user-profile.entity");
const user_segment_assignment_entity_1 = require("./user-segment-assignment.entity");
const user_event_entity_1 = require("./user-event.entity");
const ai_recommendation_entity_1 = require("./ai-recommendation.entity");
const loyalty_ledger_entity_1 = require("./loyalty-ledger.entity");
const gift_card_entity_1 = require("./gift-card.entity");
const promotion_redemption_entity_1 = require("./promotion-redemption.entity");
const refund_request_entity_1 = require("./refund-request.entity");
const payment_provider_entity_1 = require("./payment-provider.entity");
const splash_event_entity_1 = require("./splash-event.entity");
const splash_session_entity_1 = require("./splash-session.entity");
let User = class User {
    get birthDate() {
        return this.birthdate;
    }
    get id() {
        return this.userId;
    }
    get name() {
        return `${this.firstName || ''} ${this.lastName || ''}`.trim();
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'user_id' }),
    __metadata("design:type", String)
], User.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'password_hash', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'first_name', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'last_name', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "birthdate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'email_verified', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "emailVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'phone_verified', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "phoneVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'marketing_opt_in', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "marketingOptIn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'last_login_at', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lastLoginAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'CUSTOMER' }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'loyalty_tier_id', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "loyaltyTierId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'loyalty_points', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "loyaltyPoints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'default_store_id', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "defaultStoreId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => loyalty_tier_entity_1.LoyaltyTier, (loyaltyTier) => loyaltyTier.users),
    (0, typeorm_1.JoinColumn)({ name: 'loyalty_tier_id' }),
    __metadata("design:type", loyalty_tier_entity_1.LoyaltyTier)
], User.prototype, "loyaltyTier", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => store_entity_1.Store, (store) => store.defaultUsers),
    (0, typeorm_1.JoinColumn)({ name: 'default_store_id' }),
    __metadata("design:type", store_entity_1.Store)
], User.prototype, "defaultStore", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_device_entity_1.UserDevice, (device) => device.user),
    __metadata("design:type", Array)
], User.prototype, "userDevices", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_session_entity_1.UserSession, (session) => session.user),
    __metadata("design:type", Array)
], User.prototype, "userSessions", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_profile_entity_1.UserProfile, (profile) => profile.user),
    __metadata("design:type", user_profile_entity_1.UserProfile)
], User.prototype, "userProfile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_segment_assignment_entity_1.UserSegmentAssignment, (assignment) => assignment.user),
    __metadata("design:type", Array)
], User.prototype, "segmentAssignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_event_entity_1.UserEvent, (event) => event.user),
    __metadata("design:type", Array)
], User.prototype, "userEvents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_entity_1.Order, (order) => order.user),
    __metadata("design:type", Array)
], User.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => loyalty_ledger_entity_1.LoyaltyLedger, (ledger) => ledger.user),
    __metadata("design:type", Array)
], User.prototype, "loyaltyLedger", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gift_card_entity_1.GiftCard, (giftCard) => giftCard.purchasedByUser),
    __metadata("design:type", Array)
], User.prototype, "giftCardsPurchased", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gift_card_entity_1.GiftCard, (giftCard) => giftCard.redeemedByUser),
    __metadata("design:type", Array)
], User.prototype, "giftCardsRedeemed", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => promotion_redemption_entity_1.PromotionRedemption, (redemption) => redemption.user),
    __metadata("design:type", Array)
], User.prototype, "promotionRedemptions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ai_recommendation_entity_1.AIRecommendation, (recommendation) => recommendation.user),
    __metadata("design:type", Array)
], User.prototype, "aiRecommendations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => refund_request_entity_1.RefundRequest, (refundRequest) => refundRequest.user),
    __metadata("design:type", Array)
], User.prototype, "refundRequests", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_provider_entity_1.PaymentProvider, (paymentProvider) => paymentProvider.user),
    __metadata("design:type", Array)
], User.prototype, "paymentProviders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => splash_event_entity_1.SplashEvent, (event) => event.user),
    __metadata("design:type", Array)
], User.prototype, "splashEvents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => splash_session_entity_1.SplashSession, (session) => session.user),
    __metadata("design:type", Array)
], User.prototype, "splashSessions", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users'),
    (0, typeorm_1.Index)(['email'], { unique: true }),
    (0, typeorm_1.Index)(['phone'], { unique: true })
], User);
//# sourceMappingURL=user.entity.js.map