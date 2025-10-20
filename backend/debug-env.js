require('dotenv').config({ path: './services/gateway/.env' });

console.log('='.repeat(60));
console.log('Environment Variables Loaded');
console.log('='.repeat(60));
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');
console.log('DB_PASSWORD chars:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' ') : 'undefined');
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_SSL:', process.env.DB_SSL);
console.log('='.repeat(60));

