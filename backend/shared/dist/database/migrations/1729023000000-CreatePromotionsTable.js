"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePromotionsTable1729023000000 = void 0;
const typeorm_1 = require("typeorm");
class CreatePromotionsTable1729023000000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'promotions',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'title',
                    type: 'varchar',
                    length: '255',
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'promotion_type',
                    type: 'enum',
                    enum: ['launch_modal', 'banner', 'card'],
                },
                {
                    name: 'image_url',
                    type: 'varchar',
                    length: '500',
                },
                {
                    name: 'target_menu_item_id',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'target_url',
                    type: 'varchar',
                    length: '500',
                    isNullable: true,
                },
                {
                    name: 'start_date',
                    type: 'timestamp with time zone',
                },
                {
                    name: 'end_date',
                    type: 'timestamp with time zone',
                },
                {
                    name: 'is_active',
                    type: 'boolean',
                    default: true,
                },
                {
                    name: 'display_duration',
                    type: 'integer',
                    default: 0,
                },
                {
                    name: 'sort_order',
                    type: 'integer',
                    default: 0,
                },
                {
                    name: 'created_at',
                    type: 'timestamp with time zone',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'timestamp with time zone',
                    default: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);
    }
    async down(queryRunner) {
        await queryRunner.dropTable('promotions');
    }
}
exports.CreatePromotionsTable1729023000000 = CreatePromotionsTable1729023000000;
//# sourceMappingURL=1729023000000-CreatePromotionsTable.js.map