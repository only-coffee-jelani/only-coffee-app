import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../services/gateway/.env') });

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

(async () => {
  await ds.initialize();
  const assets = await ds.query('SELECT asset_id, url, alt_text FROM media_assets');
  console.log('\nMedia Assets:');
  assets.forEach((a: any, i: number) => {
    console.log(`${i + 1}. ${a.url}`);
    console.log(`   ID: ${a.asset_id}`);
    console.log(`   Alt: ${a.alt_text || 'N/A'}\n`);
  });
  await ds.destroy();
})();

