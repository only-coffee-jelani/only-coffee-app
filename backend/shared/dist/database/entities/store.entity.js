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
exports.Store = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
const store_type_entity_1 = require("./store-type.entity");
const store_hours_entity_1 = require("./store-hours.entity");
const store_status_history_entity_1 = require("./store-status-history.entity");
const user_entity_1 = require("./user.entity");
const splash_screen_entity_1 = require("./splash-screen.entity");
const inventory_item_entity_1 = require("./inventory-item.entity");
const splash_event_entity_1 = require("./splash-event.entity");
const splash_session_entity_1 = require("./splash-session.entity");
let Store = class Store {
};
exports.Store = Store;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'store_id' }),
    __metadata("design:type", String)
], Store.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Store.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'store_type_id', nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "storeTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Store.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Store.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'toast_location_id', nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "toastLocationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Store.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'accepting_orders', default: true }),
    __metadata("design:type", Boolean)
], Store.prototype, "acceptingOrders", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, name: 'store_image_url', nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "storeImageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Store.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'opened_at', nullable: true }),
    __metadata("design:type", Date)
], Store.prototype, "openedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], Store.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], Store.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => store_type_entity_1.StoreType, (storeType) => storeType.stores),
    (0, typeorm_1.JoinColumn)({ name: 'store_type_id' }),
    __metadata("design:type", store_type_entity_1.StoreType)
], Store.prototype, "storeType", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => store_hours_entity_1.StoreHours, (hours) => hours.store),
    __metadata("design:type", Array)
], Store.prototype, "storeHours", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => store_status_history_entity_1.StoreStatusHistory, (history) => history.store),
    __metadata("design:type", Array)
], Store.prototype, "storeStatusHistory", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_entity_1.User, (user) => user.defaultStore),
    __metadata("design:type", Array)
], Store.prototype, "defaultUsers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_entity_1.Order, (order) => order.store),
    __metadata("design:type", Array)
], Store.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => splash_screen_entity_1.SplashScreen, (splash) => splash.targetStore),
    __metadata("design:type", Array)
], Store.prototype, "splashScreens", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_item_entity_1.InventoryItem, (inventory) => inventory.store),
    __metadata("design:type", Array)
], Store.prototype, "inventoryItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => splash_event_entity_1.SplashEvent, (event) => event.store),
    __metadata("design:type", Array)
], Store.prototype, "splashEvents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => splash_session_entity_1.SplashSession, (session) => session.store),
    __metadata("design:type", Array)
], Store.prototype, "splashSessions", void 0);
exports.Store = Store = __decorate([
    (0, typeorm_1.Entity)('stores'),
    (0, typeorm_1.Index)(['isActive'])
], Store);
//# sourceMappingURL=store.entity.js.map