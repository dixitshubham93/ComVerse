import { Client } from 'pg';

const connectionString = "postgresql://postgres.vegtxokntkwaiwfsxnjx:shubhamdixit@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

console.log('🔄 Testing Supabase connection...\n');

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => {
    console.log('✅ Connected to Supabase successfully!\n');
    return client.query('SELECT NOW(), current_database(), current_user');
  })
  .then(result => {
    console.log('📊 Database Info:');
    console.log('Server time:', result.rows[0].now);
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('\n✅ Connection test PASSED!');
    return client.end();
  })
  .catch(err => {
    console.error('❌ Connection FAILED!');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
  });