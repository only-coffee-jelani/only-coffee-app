import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { AdminUser, UserRole } from '@shared/database/entities';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    // Check if admin user exists
    let adminUser = await this.adminUserRepository.findOne({ where: { email } });

    if (!adminUser) {
      // Create admin user if it doesn't exist (for initial setup)
      if (!email.includes('admin') && email !== 'admin@onlycoffee.us') {
        throw new UnauthorizedException('Invalid admin credentials');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      adminUser = this.adminUserRepository.create({
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      });
      await this.adminUserRepository.save(adminUser);
      this.logger.log(`Created new admin user: ${email}`);
    } else {
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Note: last_login_at column doesn't exist in the new schema
      // If needed, add it to the database schema first
    }

    // Generate proper JWT token
    const payload = {
      sub: adminUser.adminUserId,
      email: adminUser.email,
      role: UserRole.ADMIN,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: adminUser.adminUserId,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: UserRole.ADMIN,
      },
    };
  }

  async runMigrations() {
    try {
      const migrations = await this.dataSource.runMigrations();
      return {
        success: true,
        message: `Successfully ran ${migrations.length} migration(s)`,
        migrations: migrations.map((m) => m.name),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to run migrations: ${error.message}`,
        error: error.stack,
      };
    }
  }

  async createPromotionsTable() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS promotions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN ('launch_modal', 'banner', 'card')),
          image_url VARCHAR(500) NOT NULL,
          target_menu_item_id UUID,
          target_url VARCHAR(500),
          start_date TIMESTAMP WITH TIME ZONE NOT NULL,
          end_date TIMESTAMP WITH TIME ZONE NOT NULL,
          is_active BOOLEAN DEFAULT true,
          display_duration INTEGER DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      return {
        success: true,
        message: 'Promotions table created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create promotions table: ${error.message}`,
        error: error.stack,
      };
    }
  }

  async createAllergenTables() {
    try {
      this.logger.log('Creating allergens table...');

      // Create allergens lookup table
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS allergens (
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
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_allergens_name ON allergens(name);
      `);

      this.logger.log('Creating menu_item_allergens junction table...');

      // Create menu_item_allergens junction table
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS menu_item_allergens (
          menu_item_id      UUID NOT NULL REFERENCES menu_items(menu_item_id) ON DELETE CASCADE,
          allergen_id       UUID NOT NULL REFERENCES allergens(allergen_id) ON DELETE CASCADE,
          created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (menu_item_id, allergen_id)
        );
      `);

      // Create indexes for efficient queries
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_menu_item_allergens_menu_item ON menu_item_allergens(menu_item_id);
      `);

      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_menu_item_allergens_allergen ON menu_item_allergens(allergen_id);
      `);

      // Check if allergens already exist
      const existingAllergens = await this.dataSource.query(`SELECT COUNT(*) FROM allergens`);
      const count = parseInt(existingAllergens[0].count);

      if (count === 0) {
        this.logger.log('Seeding allergens data...');
        await this.dataSource.query(`
          INSERT INTO allergens (name, description, icon, sort_order) VALUES
          ('Gluten', 'Contains gluten from wheat, barley, rye, or oats', '🌾', 1),
          ('Eggs', 'Contains eggs or egg products', '🥚', 2),
          ('Soybeans', 'Contains soybeans or soy products', '🫘', 3),
          ('Milk', 'Contains milk or dairy products', '🥛', 4),
          ('Nuts', 'Contains tree nuts or peanuts', '🥜', 5);
        `);
        this.logger.log('Seeded 5 allergen types');
      } else {
        this.logger.log(`Allergens table already has ${count} entries, skipping seed`);
      }

      // Verify the data
      const allergens = await this.dataSource.query(`
        SELECT allergen_id, name, description, icon, sort_order
        FROM allergens
        ORDER BY sort_order
      `);

      return {
        success: true,
        message: 'Allergen tables created successfully',
        allergens: allergens.map((a: any) => ({
          id: a.allergen_id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          sortOrder: a.sort_order,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to create allergen tables: ${error.message}`);
      return {
        success: false,
        message: `Failed to create allergen tables: ${error.message}`,
        error: error.stack,
      };
    }
  }
}
