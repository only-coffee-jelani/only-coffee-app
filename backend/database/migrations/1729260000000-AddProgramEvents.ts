import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddProgramEvents1729260000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for event types
    await queryRunner.query(`
      CREATE TYPE program_event_type_enum AS ENUM (
        'coupon_granted',
        'coupon_redeemed',
        'coupon_expired',
        'promo_code_redeemed'
      )
    `);

    // Create program_events table
    await queryRunner.createTable(
      new Table({
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
      }),
      true,
    );

    // Create indexes for fast analytics queries
    await queryRunner.createIndex(
      'program_events',
      new TableIndex({
        name: 'IDX_program_events_eventType_createdAt',
        columnNames: ['eventType', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'program_events',
      new TableIndex({
        name: 'IDX_program_events_userId_createdAt',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'program_events',
      new TableIndex({
        name: 'IDX_program_events_couponId',
        columnNames: ['couponId'],
      }),
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'program_events',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('program_events');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('userId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('program_events', foreignKey);
    }

    // Drop indexes
    await queryRunner.dropIndex('program_events', 'IDX_program_events_eventType_createdAt');
    await queryRunner.dropIndex('program_events', 'IDX_program_events_userId_createdAt');
    await queryRunner.dropIndex('program_events', 'IDX_program_events_couponId');

    // Drop table
    await queryRunner.dropTable('program_events');

    // Drop enum type
    await queryRunner.query(`DROP TYPE program_event_type_enum`);
  }
}
