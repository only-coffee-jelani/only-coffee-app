"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = exports.dataSourceOptions = exports.getDatabaseConfig = void 0;
const typeorm_1 = require("typeorm");
const path = __importStar(require("path"));
const getDatabaseConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const useSSL = process.env.DB_SSL === 'true' || isProduction;
    return {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'only_coffee',
        entities: [path.join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
        migrations: [path.join(__dirname, '../database/migrations/**/*{.ts,.js}')],
        synchronize: !isProduction && process.env.DB_SYNCHRONIZE === 'true',
        logging: !isProduction && process.env.DB_LOGGING === 'true',
        ssl: useSSL ? { rejectUnauthorized: false } : false,
        extra: {
            max: parseInt(process.env.DB_POOL_MAX || '20', 10),
            min: parseInt(process.env.DB_POOL_MIN || '2', 10),
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        },
    };
};
exports.getDatabaseConfig = getDatabaseConfig;
exports.dataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'only_coffee',
    entities: [path.join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
    migrations: [path.join(__dirname, '../database/migrations/**/*{.ts,.js}')],
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
};
exports.AppDataSource = new typeorm_1.DataSource(exports.dataSourceOptions);
//# sourceMappingURL=database.config.js.map