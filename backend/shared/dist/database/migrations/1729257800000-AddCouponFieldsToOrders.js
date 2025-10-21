"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCouponFieldsToOrders1729257800000 = void 0;
const typeorm_1 = require("typeorm");
class AddCouponFieldsToOrders1729257800000 {
    async up(queryRunner) {
        await queryRunner.addColumn('orders', new typeorm_1.TableColumn({
            name: 'discountAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
        }));
        await queryRunner.addColumn('orders', new typeorm_1.TableColumn({
            name: 'appliedCouponId',
            type: 'uuid',
            isNullable: true,
        }));
        await queryRunner.createForeignKey('orders', new typeorm_1.TableForeignKey({
            name: 'FK_orders_coupon_grants',
            columnNames: ['appliedCouponId'],
            referencedTableName: 'coupon_grants',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropForeignKey('orders', 'FK_orders_coupon_grants');
        await queryRunner.dropColumn('orders', 'appliedCouponId');
        await queryRunner.dropColumn('orders', 'discountAmount');
    }
}
exports.AddCouponFieldsToOrders1729257800000 = AddCouponFieldsToOrders1729257800000;
//# sourceMappingURL=1729257800000-AddCouponFieldsToOrders.js.map