"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProgramEvents1729260000000 = void 0;
const typeorm_1 = require("typeorm");
class AddProgramEvents1729260000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TYPE program_event_type_enum AS ENUM (
        'coupon_granted',
        'coupon_redeemed',
        'coupon_expired',
        'promo_code_redeemed'
      )
    `);
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'program_events',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'userId',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'eventType',
                    type: 'program_event_type_enum',
                    isNullable: false,
                },
                {
                    name: 'couponId',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'orderId',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'promoCodeId',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'eventData',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamptz',
                    default: 'now()',
                },
            ],
        }), true);
        await queryRunner.createIndex('program_events', new typeorm_1.TableIndex({
            name: 'IDX_program_events_eventType_createdAt',
            columnNames: ['eventType', 'createdAt'],
        }));
        await queryRunner.createIndex('program_events', new typeorm_1.TableIndex({
            name: 'IDX_program_events_userId_createdAt',
            columnNames: ['userId', 'createdAt'],
        }));
        await queryRunner.createIndex('program_events', new typeorm_1.TableIndex({
            name: 'IDX_program_events_couponId',
            columnNames: ['couponId'],
        }));
        await queryRunner.createForeignKey('program_events', new typeorm_1.TableForeignKey({
            columnNames: ['userId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
        }));
    }
    async down(queryRunner) {
        const table = await queryRunner.getTable('program_events');
        const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('userId') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('program_events', foreignKey);
        }
        await queryRunner.dropIndex('program_events', 'IDX_program_events_eventType_createdAt');
        await queryRunner.dropIndex('program_events', 'IDX_program_events_userId_createdAt');
        await queryRunner.dropIndex('program_events', 'IDX_program_events_couponId');
        await queryRunner.dropTable('program_events');
        await queryRunner.query(`DROP TYPE program_event_type_enum`);
    }
}
exports.AddProgramEvents1729260000000 = AddProgramEvents1729260000000;
//# sourceMappingURL=1729260000000-AddProgramEvents.js.map