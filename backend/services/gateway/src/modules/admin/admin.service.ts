import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { User, UserRole } from '@shared/database/entities';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  async login(email: string, password: string) {
    // For now, allow any admin with the correct email pattern
    // In production, you'd want to check against an admin users table
    if (!email.includes('admin') && email !== 'admin@onlycoffee.us') {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Check if admin user exists, if not create it
    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Create admin user if it doesn't exist
      const passwordHash = await bcrypt.hash(password, 10);
      user = this.userRepository.create({
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        emailVerified: true,
        isActive: true,
      });
      await this.userRepository.save(user);
    }

    // Use the auth service to login
    const result = await this.authService.login({ email, password });

    return {
      token: result.accessToken,
      user: result.user,
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
