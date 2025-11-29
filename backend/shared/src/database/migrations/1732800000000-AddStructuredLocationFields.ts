import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add Structured Location Fields to Stores
 * 
 * Adds enterprise-level location fields with conditional requirements:
 * - North America + USA: address, city, state, zip_code required
 * - Other locations: address, city, country required (state/zip optional)
 * 
 * New fields:
 * - city: City name (required for all)
 * - state: State/Province (required for USA, optional for others)
 * - zip_code: Postal/ZIP code (required for USA, optional for others)
 * - country: Full country name (required for all)
 * - country_code: ISO 3166-1 alpha-2 code (US, CA, MX, etc.)
 * - continent: Continent name (North America, Europe, Asia, etc.)
 */
export class AddStructuredLocationFields1732800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add city column
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'city',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'City name (required for all stores)',
      }),
    );

    // Add state column
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'state',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'State/Province (required for USA, optional for other countries)',
      }),
    );

    // Add zip_code column
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'zip_code',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'Postal/ZIP code (required for USA, optional for other countries)',
      }),
    );

    // Add country column
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'country',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'Full country name (required for all stores)',
      }),
    );

    // Add country_code column
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'country_code',
        type: 'varchar',
        length: '2',
        isNullable: true,
        comment: 'ISO 3166-1 alpha-2 country code (US, CA, MX, GB, etc.)',
      }),
    );

    // Add continent column
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'continent',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Continent name (North America, Europe, Asia, Africa, South America, Oceania, Antarctica)',
      }),
    );

    // Create index on country_code for faster filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_stores_country_code" ON "stores" ("country_code");
    `);

    // Create index on continent for analytics
    await queryRunner.query(`
      CREATE INDEX "IDX_stores_continent" ON "stores" ("continent");
    `);

    // Create composite index for city + state searches
    await queryRunner.query(`
      CREATE INDEX "IDX_stores_city_state" ON "stores" ("city", "state");
    `);

    console.log('✅ Added structured location fields to stores table');
    console.log('   - city, state, zip_code, country, country_code, continent');
    console.log('   - Created indexes for performance');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stores_city_state"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stores_continent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stores_country_code"`);

    // Drop columns
    await queryRunner.dropColumn('stores', 'continent');
    await queryRunner.dropColumn('stores', 'country_code');
    await queryRunner.dropColumn('stores', 'country');
    await queryRunner.dropColumn('stores', 'zip_code');
    await queryRunner.dropColumn('stores', 'state');
    await queryRunner.dropColumn('stores', 'city');

    console.log('✅ Removed structured location fields from stores table');
  }
}

