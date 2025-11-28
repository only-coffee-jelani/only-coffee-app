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
exports.ProgramEvent = exports.ProgramEventType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var ProgramEventType;
(function (ProgramEventType) {
    ProgramEventType["COUPON_GRANTED"] = "COUPON_GRANTED";
    ProgramEventType["COUPON_REDEEMED"] = "COUPON_REDEEMED";
    ProgramEventType["COUPON_EXPIRED"] = "COUPON_EXPIRED";
    ProgramEventType["PROMO_CODE_REDEEMED"] = "PROMO_CODE_REDEEMED";
    ProgramEventType["PROMO_CODE_USED"] = "PROMO_CODE_USED";
    ProgramEventType["ORDER_PLACED"] = "ORDER_PLACED";
})(ProgramEventType || (exports.ProgramEventType = ProgramEventType = {}));
let ProgramEvent = class ProgramEvent {
};
exports.ProgramEvent = ProgramEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'event_id' }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProgramEventType,
        name: 'event_type',
    }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'coupon_id', nullable: true }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "couponId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'order_id', nullable: true }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'promo_code_id', nullable: true }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "promoCodeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'event_data', nullable: true }),
    __metadata("design:type", Object)
], ProgramEvent.prototype, "eventData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], ProgramEvent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ProgramEvent.prototype, "user", void 0);
exports.ProgramEvent = ProgramEvent = __decorate([
    (0, typeorm_1.Entity)('program_events'),
    (0, typeorm_1.Index)(['userId', 'eventType', 'createdAt']),
    (0, typeorm_1.Index)(['couponId']),
    (0, typeorm_1.Index)(['orderId'])
], ProgramEvent);
//# sourceMappingURL=program-event.entity.js.map