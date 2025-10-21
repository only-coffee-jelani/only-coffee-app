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
    ProgramEventType["COUPON_GRANTED"] = "coupon_granted";
    ProgramEventType["COUPON_REDEEMED"] = "coupon_redeemed";
    ProgramEventType["COUPON_EXPIRED"] = "coupon_expired";
    ProgramEventType["PROMO_CODE_REDEEMED"] = "promo_code_redeemed";
})(ProgramEventType || (exports.ProgramEventType = ProgramEventType = {}));
let ProgramEvent = class ProgramEvent {
};
exports.ProgramEvent = ProgramEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProgramEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProgramEventType }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "couponId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ProgramEvent.prototype, "promoCodeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ProgramEvent.prototype, "eventData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ProgramEvent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], ProgramEvent.prototype, "user", void 0);
exports.ProgramEvent = ProgramEvent = __decorate([
    (0, typeorm_1.Entity)('program_events'),
    (0, typeorm_1.Index)(['eventType', 'createdAt']),
    (0, typeorm_1.Index)(['userId', 'createdAt']),
    (0, typeorm_1.Index)(['couponId'])
], ProgramEvent);
//# sourceMappingURL=program-event.entity.js.map