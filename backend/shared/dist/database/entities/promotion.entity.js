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
exports.Promotion = void 0;
const typeorm_1 = require("typeorm");
const promotion_discount_type_entity_1 = require("./promotion-discount-type.entity");
const admin_user_entity_1 = require("./admin-user.entity");
const promotion_redemption_entity_1 = require("./promotion-redemption.entity");
let Promotion = class Promotion {
    get id() {
        return this.promotionId;
    }
    get title() {
        return this.name;
    }
};
exports.Promotion = Promotion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'promotion_id' }),
    __metadata("design:type", String)
], Promotion.prototype, "promotionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Promotion.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Promotion.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'discount_type_id' }),
    __metadata("design:type", String)
], Promotion.prototype, "discountTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, name: 'discount_value' }),
    __metadata("design:type", Number)
], Promotion.prototype, "discountValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'start_at' }),
    __metadata("design:type", Date)
], Promotion.prototype, "startAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'end_at' }),
    __metadata("design:type", Date)
], Promotion.prototype, "endAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Promotion.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by', nullable: true }),
    __metadata("design:type", String)
], Promotion.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], Promotion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], Promotion.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => promotion_discount_type_entity_1.PromotionDiscountType, (discountType) => discountType.promotions),
    (0, typeorm_1.JoinColumn)({ name: 'discount_type_id' }),
    __metadata("design:type", promotion_discount_type_entity_1.PromotionDiscountType)
], Promotion.prototype, "discountType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => admin_user_entity_1.AdminUser, (adminUser) => adminUser.promotions),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", admin_user_entity_1.AdminUser)
], Promotion.prototype, "createdByAdmin", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => promotion_redemption_entity_1.PromotionRedemption, (redemption) => redemption.promotion),
    __metadata("design:type", Array)
], Promotion.prototype, "promotionRedemptions", void 0);
exports.Promotion = Promotion = __decorate([
    (0, typeorm_1.Entity)('promotions')
], Promotion);
//# sourceMappingURL=promotion.entity.js.map