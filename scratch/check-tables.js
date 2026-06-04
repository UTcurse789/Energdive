require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, ''),
  ssl: { rejectUnauthorized: false },
});

pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'energjob_%' ORDER BY table_name`)
  .then(r => {
    console.log('EnergJob tables found:');
    r.rows.forEach(row => console.log('  ✅', row.table_name));
    return pool.end();
  })
  .catch(e => {
    console.error(e);
    pool.end();
  });
