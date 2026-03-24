import { query } from "./lib/db";

async function check() {
  const comm = await query("SELECT * FROM communities");
  console.log("COMMUNITIES:");
  console.log(comm.rows);

  const sub = await query("SELECT * FROM sub_communities");
  console.log("SUB_COMMUNITIES:");
  console.log(sub.rows);
}

check().then(() => process.exit(0)).catch(console.error);
