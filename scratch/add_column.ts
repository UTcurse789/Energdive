import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

async function run() {
  try {
    const { query } = await import("../lib/db");
    
    console.log("Adding column external_apply_url to energjob_jobs table...");
    await query(`
      ALTER TABLE energjob_jobs 
      ADD COLUMN IF NOT EXISTS external_apply_url TEXT;
    `);
    console.log("Column added successfully or already exists!");
    
    // Double check column exists now
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'energjob_jobs' AND column_name = 'external_apply_url'
    `);
    console.log("Check result:", JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Migration failed:", err);
  }
  process.exit(0);
}

run();
