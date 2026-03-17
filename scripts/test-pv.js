const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function checkRecentVerifications() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log("Connected to DB...");

        const result = await client.query(`
            SELECT id, email, name, phone, communities, sub_communities, community_portal, created_at 
            FROM pending_verifications 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        console.table(result.rows.map(r => ({
            email: r.email,
            phone: r.phone || 'NULL',
            comm: r.communities,
            sub: r.sub_communities,
            portal: r.community_portal
        })));

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await client.end();
    }
}

checkRecentVerifications();
