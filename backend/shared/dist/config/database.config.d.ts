import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
export declare const getDatabaseConfig: () => TypeOrmModuleOptions;
export declare const dataSourceOptions: DataSourceOptions;
export declare const AppDataSource: DataSource;
