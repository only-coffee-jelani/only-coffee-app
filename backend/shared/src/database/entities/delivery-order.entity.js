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
exports.DeliveryOrder = exports.DeliveryStatus = exports.DeliveryProvider = void 0;
const typeorm_1 = require("typeorm");
var DeliveryProvider;
(function (DeliveryProvider) {
    DeliveryProvider["DOORDASH"] = "doordash";
    DeliveryProvider["UBER_DIRECT"] = "uber_direct";
    DeliveryProvider["GRUBHUB"] = "grubhub";
})(DeliveryProvider || (exports.DeliveryProvider = DeliveryProvider = {}));
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["QUOTE_REQUESTED"] = "quote_requested";
    DeliveryStatus["QUOTE_RECEIVED"] = "quote_received";
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["CONFIRMED"] = "confirmed";
    DeliveryStatus["PICKUP_ASSIGNED"] = "pickup_assigned";
    DeliveryStatus["PICKED_UP"] = "picked_up";
    DeliveryStatus["EN_ROUTE"] = "en_route";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["CANCELLED"] = "cancelled";
    DeliveryStatus["FAILED"] = "failed";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
let DeliveryOrder = class DeliveryOrder {
};
exports.DeliveryOrder = DeliveryOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DeliveryProvider }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "externalDeliveryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "pickupAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "deliveryAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], DeliveryOrder.prototype, "pickupLatitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], DeliveryOrder.prototype, "pickupLongitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], DeliveryOrder.prototype, "deliveryLatitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", Number)
], DeliveryOrder.prototype, "deliveryLongitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "recipientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "recipientPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], DeliveryOrder.prototype, "deliveryFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], DeliveryOrder.prototype, "quotedFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DeliveryOrder.prototype, "estimatedDurationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], DeliveryOrder.prototype, "estimatedDeliveryTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "courierName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "courierPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "trackingUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DeliveryOrder.prototype, "deliveryInstructions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DeliveryOrder.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], DeliveryOrder.prototype, "pickedUpAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], DeliveryOrder.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], DeliveryOrder.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], DeliveryOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], DeliveryOrder.prototype, "updatedAt", void 0);
exports.DeliveryOrder = DeliveryOrder = __decorate([
    (0, typeorm_1.Entity)('delivery_orders'),
    (0, typeorm_1.Index)(['orderId']),
    (0, typeorm_1.Index)(['provider']),
    (0, typeorm_1.Index)(['status'])
], DeliveryOrder);
//# sourceMappingURL=delivery-order.entity.js.map