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
exports.TierPerk = exports.PerkType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var PerkType;
(function (PerkType) {
    PerkType["BIRTHDAY_REWARD"] = "birthday_reward";
    PerkType["EARLY_ACCESS"] = "early_access";
    PerkType["EXCLUSIVE_DISCOUNT"] = "exclusive_discount";
    PerkType["FREE_UPGRADE"] = "free_upgrade";
    PerkType["PRIORITY_SUPPORT"] = "priority_support";
    PerkType["CUSTOM_REWARD"] = "custom_reward";
})(PerkType || (exports.PerkType = PerkType = {}));
let TierPerk = class TierPerk {
};
exports.TierPerk = TierPerk;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TierPerk.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_entity_1.UserTier }),
    __metadata("design:type", String)
], TierPerk.prototype, "tier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PerkType }),
    __metadata("design:type", String)
], TierPerk.prototype, "perkType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TierPerk.prototype, "perkName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TierPerk.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], TierPerk.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TierPerk.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TierPerk.prototype, "configuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TierPerk.prototype, "iconName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TierPerk.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TierPerk.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TierPerk.prototype, "updatedAt", void 0);
exports.TierPerk = TierPerk = __decorate([
    (0, typeorm_1.Entity)('tier_perks'),
    (0, typeorm_1.Index)(['tier', 'perkType']),
    (0, typeorm_1.Index)(['isActive'])
], TierPerk);
//# sourceMappingURL=tier-perk.entity.js.map