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
exports.Order = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const store_entity_1 = require("./store.entity");
const order_status_entity_1 = require("./order-status.entity");
const payment_method_entity_1 = require("./payment-method.entity");
const order_item_entity_1 = require("./order-item.entity");
const payment_entity_1 = require("./payment.entity");
const loyalty_ledger_entity_1 = require("./loyalty-ledger.entity");
const promotion_redemption_entity_1 = require("./promotion-redemption.entity");
const refund_request_entity_1 = require("./refund-request.entity");
const refund_entity_1 = require("./refund.entity");
const fact_orders_entity_1 = require("./fact-orders.entity");
const splash_event_entity_1 = require("./splash-event.entity");
const splash_session_entity_1 = require("./splash-session.entity");
let Order = class Order {
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'order_id' }),
    __metadata("design:type", String)
], Order.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'store_id' }),
    __metadata("design:type", String)
], Order.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'order_status_id' }),
    __metadata("design:type", String)
], Order.prototype, "orderStatusId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "tax", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, name: 'discount_total', default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "discountTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'payment_method_id', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "paymentMethodId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'pickup_time', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "pickupTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'placed_at', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], Order.prototype, "placedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.orders),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Order.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => store_entity_1.Store, (store) => store.orders),
    (0, typeorm_1.JoinColumn)({ name: 'store_id' }),
    __metadata("design:type", store_entity_1.Store)
], Order.prototype, "store", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_status_entity_1.OrderStatus, (orderStatus) => orderStatus.orders),
    (0, typeorm_1.JoinColumn)({ name: 'order_status_id' }),
    __metadata("design:type", order_status_entity_1.OrderStatus)
], Order.prototype, "orderStatus", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_method_entity_1.PaymentMethod, (paymentMethod) => paymentMethod.orders),
    (0, typeorm_1.JoinColumn)({ name: 'payment_method_id' }),
    __metadata("design:type", payment_method_entity_1.PaymentMethod)
], Order.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_item_entity_1.OrderItem, (orderItem) => orderItem.order),
    __metadata("design:type", Array)
], Order.prototype, "orderItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_entity_1.Payment, (payment) => payment.order),
    __metadata("design:type", Array)
], Order.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => loyalty_ledger_entity_1.LoyaltyLedger, (ledger) => ledger.order),
    __metadata("design:type", Array)
], Order.prototype, "loyaltyLedger", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => promotion_redemption_entity_1.PromotionRedemption, (redemption) => redemption.order),
    __metadata("design:type", Array)
], Order.prototype, "promotionRedemptions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => refund_request_entity_1.RefundRequest, (refundRequest) => refundRequest.order),
    __metadata("design:type", Array)
], Order.prototype, "refundRequests", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => refund_entity_1.Refund, (refund) => refund.order),
    __metadata("design:type", Array)
], Order.prototype, "refunds", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => fact_orders_entity_1.FactOrders, (factOrder) => factOrder.order),
    __metadata("design:type", Array)
], Order.prototype, "factOrders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => splash_event_entity_1.SplashEvent, (event) => event.order),
    __metadata("design:type", Array)
], Order.prototype, "splashEvents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => splash_session_entity_1.SplashSession, (session) => session.order),
    __metadata("design:type", Array)
], Order.prototype, "splashSessions", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders'),
    (0, typeorm_1.Index)(['userId', 'placedAt']),
    (0, typeorm_1.Index)(['storeId', 'placedAt'])
], Order);
//# sourceMappingURL=order.entity.js.map