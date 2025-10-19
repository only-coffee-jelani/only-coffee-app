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
exports.SplashScreen = void 0;
const typeorm_1 = require("typeorm");
let SplashScreen = class SplashScreen {
};
exports.SplashScreen = SplashScreen;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SplashScreen.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SplashScreen.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SplashScreen.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], SplashScreen.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_size_bytes', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "imageSizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_duration', type: 'int', default: 3 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "displayDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SplashScreen.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SplashScreen.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], SplashScreen.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'impressions', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "impressions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clicks', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "clicks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'skips', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "skips", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ctr', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "ctr", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'skip_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "skipRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'associated_orders', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "associatedOrders", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'associated_revenue', type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "associatedRevenue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversion_rate', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "conversionRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'average_order_value', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "averageOrderValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_users_shown', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "uniqueUsersShown", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_users_clicked', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "uniqueUsersClicked", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'average_view_time', type: 'decimal', precision: 8, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SplashScreen.prototype, "averageViewTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_impression_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SplashScreen.prototype, "lastImpressionAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_click_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SplashScreen.prototype, "lastClickAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_menu_item_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SplashScreen.prototype, "targetMenuItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_url', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], SplashScreen.prototype, "targetUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SplashScreen.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SplashScreen.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SplashScreen.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'replaced_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SplashScreen.prototype, "replacedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'replaced_by_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SplashScreen.prototype, "replacedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SplashScreen.prototype, "createdById", void 0);
exports.SplashScreen = SplashScreen = __decorate([
    (0, typeorm_1.Entity)('splash_screens'),
    (0, typeorm_1.Index)(['isActive']),
    (0, typeorm_1.Index)(['startDate', 'endDate']),
    (0, typeorm_1.Index)(['createdAt'])
], SplashScreen);
//# sourceMappingURL=splash-screen.entity.js.map