import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAllergenTables1732910000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create allergens lookup table
    await queryRunner.query(`
      CREATE TABLE allergens (
        allergen_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name              VARCHAR(100) NOT NULL UNIQUE,
        description       TEXT,
        icon              VARCHAR(50),
        sort_order        INT NOT NULL DEFAULT 0,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Create index on name for fast lookups
    await queryRunner.query(`
      CREATE INDEX idx_allergens_name ON allergens(name);
    `);

    // Create menu_item_allergens junction table
    await queryRunner.query(`
      CREATE TABLE menu_item_allergens (
        menu_item_id      UUID NOT NULL REFERENCES menu_items(menu_item_id) ON DELETE CASCADE,
        allergen_id       UUID NOT NULL REFERENCES allergens(allergen_id) ON DELETE CASCADE,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (menu_item_id, allergen_id)
      );
    `);

    // Create indexes for efficient queries
    await queryRunner.query(`
      CREATE INDEX idx_menu_item_allergens_menu_item ON menu_item_allergens(menu_item_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_menu_item_allergens_allergen ON menu_item_allergens(allergen_id);
    `);

    // Seed allergens data
    await queryRunner.query(`
      INSERT INTO allergens (name, description, icon, sort_order) VALUES
      ('Gluten', 'Contains gluten from wheat, barley, rye, or oats', '🌾', 1),
      ('Eggs', 'Contains eggs or egg products', '🥚', 2),
      ('Soybeans', 'Contains soybeans or soy products', '🫘', 3),
      ('Milk', 'Contains milk or dairy products', '🥛', 4),
      ('Nuts', 'Contains tree nuts or peanuts', '🥜', 5);
    `);

    console.log('✅ Created allergens and menu_item_allergens tables');
    console.log('✅ Seeded 5 allergen types');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS menu_item_allergens CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS allergens CASCADE;`);
    
    console.log('✅ Dropped allergen tables');
  }
}

