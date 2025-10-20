import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCarouselImagesTable1729100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'carousel_images',
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
            name: 'image_url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'image_size_bytes',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'image_width',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'image_height',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'archived'],
            default: "'active'",
          },
          {
            name: 'target_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'target_menu_item_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'start_date',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'end_date',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'display_duration',
            type: 'int',
            default: 3,
          },
          {
            name: 'click_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'view_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'conversion_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'last_viewed_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'last_clicked_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_carousel_images_is_active_position',
            columnNames: ['is_active', 'position'],
          },
          {
            name: 'IDX_carousel_images_status_created_at',
            columnNames: ['status', 'created_at'],
          },
          {
            name: 'IDX_carousel_images_created_at',
            columnNames: ['created_at'],
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('carousel_images');
  }
}

