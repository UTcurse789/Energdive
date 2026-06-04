require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, ''),
  ssl: { rejectUnauthorized: false },
});

async function run() {
  // Delete old test applications so we can re-test
  const result = await pool.query(
    `DELETE FROM energjob_applications WHERE applicant_email ILIKE '%ukutkarsh%' OR applicant_email ILIKE '%webadmin%' RETURNING id, applicant_email`
  );
  console.log('Deleted test applications:', result.rows);
  
  // Also check current state
  const apps = await pool.query('SELECT id, applicant_name, applicant_email, sync_status FROM energjob_applications ORDER BY id');
  console.log('Remaining applications:', apps.rows);
  
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
