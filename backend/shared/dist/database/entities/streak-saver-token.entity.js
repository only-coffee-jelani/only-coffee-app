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
exports.StreakSaverToken = exports.TokenStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var TokenStatus;
(function (TokenStatus) {
    TokenStatus["AVAILABLE"] = "available";
    TokenStatus["USED"] = "used";
    TokenStatus["EXPIRED"] = "expired";
})(TokenStatus || (exports.TokenStatus = TokenStatus = {}));
let StreakSaverToken = class StreakSaverToken {
};
exports.StreakSaverToken = StreakSaverToken;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StreakSaverToken.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StreakSaverToken.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TokenStatus, default: TokenStatus.AVAILABLE }),
    __metadata("design:type", String)
], StreakSaverToken.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StreakSaverToken.prototype, "grantedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], StreakSaverToken.prototype, "usedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], StreakSaverToken.prototype, "appliedToDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], StreakSaverToken.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], StreakSaverToken.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StreakSaverToken.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], StreakSaverToken.prototype, "user", void 0);
exports.StreakSaverToken = StreakSaverToken = __decorate([
    (0, typeorm_1.Entity)('streak_saver_tokens'),
    (0, typeorm_1.Index)(['userId', 'status']),
    (0, typeorm_1.Index)(['grantedAt'])
], StreakSaverToken);
//# sourceMappingURL=streak-saver-token.entity.js.map