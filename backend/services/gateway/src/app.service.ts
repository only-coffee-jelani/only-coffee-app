import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Only Coffee Gateway API',
      version: '1.0.0',
    };
  }

  async testDatabase() {
    try {
      // Test database connection
      const result = await this.dataSource.query('SELECT NOW() as current_time, version() as pg_version');
      
      // Get table count
      const tables = await this.dataSource.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      return {
        status: 'connected',
        database: this.dataSource.options.database,
        host: this.dataSource.options['host'],
        currentTime: result[0].current_time,
        postgresVersion: result[0].pg_version,
        tableCount: parseInt(tables[0].table_count),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}

