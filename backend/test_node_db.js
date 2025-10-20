const { Client } = require('pg');

const client = new Client({
  host: 'only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'Dieb4utr1I!',
  database: 'only_coffee',
  ssl: { rejectUnauthorized: false },
});

console.log('Attempting to connect to PostgreSQL...');
console.log('Host: only-coffee-db.cu96ksosqdq2.us-east-1.rds.amazonaws.com');
console.log('User: postgres');
console.log('Database: only_coffee');
console.log('SSL: enabled');

client.connect((err) => {
  if (err) {
    console.error('Connection error:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  } else {
    console.log('✅ Connected successfully!');
    
    client.query('SELECT version();', (err, res) => {
      if (err) {
        console.error('Query error:', err);
      } else {
        console.log('PostgreSQL version:', res.rows[0].version);
      }
      
      client.end();
    });
  }
});

