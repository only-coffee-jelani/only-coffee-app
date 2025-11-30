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
exports.MenuItem = void 0;
const typeorm_1 = require("typeorm");
const menu_category_entity_1 = require("./menu-category.entity");
const media_asset_entity_1 = require("./media-asset.entity");
const order_item_entity_1 = require("./order-item.entity");
const menu_item_modifier_group_entity_1 = require("./menu-item-modifier-group.entity");
const ai_recommendation_entity_1 = require("./ai-recommendation.entity");
const allergen_entity_1 = require("./allergen.entity");
let MenuItem = class MenuItem {
};
exports.MenuItem = MenuItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'menu_item_id' }),
    __metadata("design:type", String)
], MenuItem.prototype, "menuItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'category_id', nullable: true }),
    __metadata("design:type", String)
], MenuItem.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], MenuItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MenuItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, name: 'base_price' }),
    __metadata("design:type", Number)
], MenuItem.prototype, "basePrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], MenuItem.prototype, "calories", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'image_asset_id', nullable: true }),
    __metadata("design:type", String)
], MenuItem.prototype, "imageAssetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'toast_item_id', nullable: true }),
    __metadata("design:type", String)
], MenuItem.prototype, "toastItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], MenuItem.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], MenuItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], MenuItem.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => menu_category_entity_1.MenuCategory, (category) => category.menuItems),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", menu_category_entity_1.MenuCategory)
], MenuItem.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => media_asset_entity_1.MediaAsset, (mediaAsset) => mediaAsset.menuItems),
    (0, typeorm_1.JoinColumn)({ name: 'image_asset_id' }),
    __metadata("design:type", media_asset_entity_1.MediaAsset)
], MenuItem.prototype, "imageAsset", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_item_entity_1.OrderItem, (orderItem) => orderItem.menuItem),
    __metadata("design:type", Array)
], MenuItem.prototype, "orderItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => menu_item_modifier_group_entity_1.MenuItemModifierGroup, (menuItemModifierGroup) => menuItemModifierGroup.menuItem),
    __metadata("design:type", Array)
], MenuItem.prototype, "menuItemModifierGroups", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ai_recommendation_entity_1.AIRecommendation, (recommendation) => recommendation.menuItem),
    __metadata("design:type", Array)
], MenuItem.prototype, "aiRecommendations", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => allergen_entity_1.Allergen, (allergen) => allergen.menuItems),
    (0, typeorm_1.JoinTable)({
        name: 'menu_item_allergens',
        joinColumn: { name: 'menu_item_id', referencedColumnName: 'menuItemId' },
        inverseJoinColumn: { name: 'allergen_id', referencedColumnName: 'allergenId' },
    }),
    __metadata("design:type", Array)
], MenuItem.prototype, "allergens", void 0);
exports.MenuItem = MenuItem = __decorate([
    (0, typeorm_1.Entity)('menu_items'),
    (0, typeorm_1.Index)(['categoryId'])
], MenuItem);
//# sourceMappingURL=menu-item.entity.js.map