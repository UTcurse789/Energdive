import { query } from "./lib/db";

async function run() {
    try {
        const res = await query("SELECT * FROM users WHERE email = 'www.gamingmindfps@gmail.com'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

run();
