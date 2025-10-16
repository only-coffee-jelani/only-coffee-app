import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

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
