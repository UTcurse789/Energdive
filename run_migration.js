process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function runMigration() {
  try {
    await pool.query("ALTER TABLE user_downloads ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) DEFAULT 'paper';");
    console.log("Migration successful: added item_type column to user_downloads");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

runMigration();
