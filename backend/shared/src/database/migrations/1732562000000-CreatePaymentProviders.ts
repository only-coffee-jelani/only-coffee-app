import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePaymentProviders1732562000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_providers table
    await queryRunner.createTable(
      new Table({
        name: 'payment_providers',
        columns: [
          {
            name: 'payment_provider_id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider_name',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'provider_customer_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Create unique index on user_id + provider_name
    await queryRunner.createIndex(
      'payment_providers',
      new TableIndex({
        name: 'idx_payment_providers_user_provider',
        columnNames: ['user_id', 'provider_name'],
        isUnique: true,
      }),
    );

    // Create index on provider_customer_id for lookups
    await queryRunner.createIndex(
      'payment_providers',
      new TableIndex({
        name: 'idx_payment_providers_customer_id',
        columnNames: ['provider_customer_id'],
      }),
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'payment_providers',
      new TableForeignKey({
        name: 'fk_payment_providers_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['user_id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('payment_providers', 'fk_payment_providers_user');

    // Drop indexes
    await queryRunner.dropIndex('payment_providers', 'idx_payment_providers_customer_id');
    await queryRunner.dropIndex('payment_providers', 'idx_payment_providers_user_provider');

    // Drop table
    await queryRunner.dropTable('payment_providers');
  }
}

