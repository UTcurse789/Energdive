import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query('SELECT name FROM communities');
  console.log("Communities:", res.rows.map(r => r.name));
  const res2 = await client.query('SELECT name FROM sub_communities LIMIT 20');
  console.log("SubCommunities:", res2.rows.map(r => r.name));
  await client.end();
}
run();
