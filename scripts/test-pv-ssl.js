const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function checkRecentVerifications() {
    // Add ?sslmode=no-verify if not present
    let connStr = process.env.DATABASE_URL;
    
    const client = new Client({
        connectionString: connStr,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log("Connected to DB...");

        const result = await client.query(`
            SELECT id, email, phone, communities, sub_communities, community_portal, created_at 
            FROM pending_verifications 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        console.table(result.rows.map(r => ({
            email: r.email,
            phone: r.phone || 'NULL',
            comm: JSON.stringify(r.communities),
            sub: JSON.stringify(r.sub_communities),
            portal: r.community_portal || 'NULL'
        })));

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await client.end();
    }
}

checkRecentVerifications();
