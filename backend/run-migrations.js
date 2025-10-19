const { DataSource } = require('typeorm');
const { join } = require('path');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com',
  port: 5432,
  username: 'postgres',
  password: 'Dieb4utr1I!',
  database: 'postgres',
  entities: [join(__dirname, 'shared/dist/database/entities', '*.entity.js')],
  migrations: [join(__dirname, 'shared/dist/database/migrations', '*.js')],
  synchronize: false,
  logging: true,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigrations() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected!');

    console.log('Running migrations...');
    const migrations = await AppDataSource.runMigrations();

    console.log(`Successfully ran ${migrations.length} migrations:`);
    migrations.forEach(migration => {
      console.log(`  - ${migration.name}`);
    });

    await AppDataSource.destroy();
    console.log('\nMigrations complete!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
