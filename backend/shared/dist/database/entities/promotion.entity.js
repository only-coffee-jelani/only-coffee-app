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
exports.Promotion = exports.PromotionType = void 0;
const typeorm_1 = require("typeorm");
var PromotionType;
(function (PromotionType) {
    PromotionType["LAUNCH_MODAL"] = "launch_modal";
    PromotionType["BANNER"] = "banner";
    PromotionType["CARD"] = "card";
})(PromotionType || (exports.PromotionType = PromotionType = {}));
let Promotion = class Promotion {
};
exports.Promotion = Promotion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Promotion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Promotion.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Promotion.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'promotion_type', type: 'enum', enum: PromotionType }),
    __metadata("design:type", String)
], Promotion.prototype, "promotionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], Promotion.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_menu_item_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Promotion.prototype, "targetMenuItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_url', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Promotion.prototype, "targetUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Promotion.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Promotion.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Promotion.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_duration', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Promotion.prototype, "displayDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Promotion.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Promotion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Promotion.prototype, "updatedAt", void 0);
exports.Promotion = Promotion = __decorate([
    (0, typeorm_1.Entity)('promotions'),
    (0, typeorm_1.Index)(['isActive', 'startDate', 'endDate']),
    (0, typeorm_1.Index)(['promotionType'])
], Promotion);
//# sourceMappingURL=promotion.entity.js.map