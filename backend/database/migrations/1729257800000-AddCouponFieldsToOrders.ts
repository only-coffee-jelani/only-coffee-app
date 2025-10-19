import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCouponFieldsToOrders1729257800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add discountAmount column
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'discountAmount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );

    // Add appliedCouponId column
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'appliedCouponId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add foreign key to coupon_grants table
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'FK_orders_coupon_grants',
        columnNames: ['appliedCouponId'],
        referencedTableName: 'coupon_grants',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('orders', 'FK_orders_coupon_grants');

    // Drop columns
    await queryRunner.dropColumn('orders', 'appliedCouponId');
    await queryRunner.dropColumn('orders', 'discountAmount');
  }
}
