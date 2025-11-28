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
}
