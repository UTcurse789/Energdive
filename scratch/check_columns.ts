import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

async function run() {
  try {
    // Dynamically import after config() to avoid hoisting
    const { query } = await import("../lib/db");
    
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'energjob_jobs'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
