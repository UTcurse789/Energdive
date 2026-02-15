/**
 * seed-sub-industries.js
 * Seeds sub_industries for all industries that currently have none.
 * Idempotent — checks before inserting.
 * Run: node scripts/seed-sub-industries.js
 */
require("dotenv").config();
const { Pool } = require("pg");

const rawUrl = process.env.DATABASE_URL || "";
const connStr = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

const pool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
});

// Map: industry name → sub-industry names
const SUB_INDUSTRIES = {
    "Agriculture": ["Agri-Tech", "Farm Equipment", "Irrigation", "Crop Science", "Dairy & Livestock"],
    "Automobile": ["EV Manufacturing", "Auto Components", "Fleet Management", "Two-Wheeler", "Commercial Vehicles"],
    "Aviation": ["Airlines", "Airport Infrastructure", "MRO Services", "Cargo Aviation", "Defence Aviation"],
    "Battery & Storage": ["Battery Manufacturing", "BESS Developer", "Battery Recycling", "Cell Chemistry R&D", "Thermal Storage"],
    "Beauty & Wellness": ["Cosmetics", "Personal Care", "Spa & Salon", "Ayurveda & Herbal"],
    "BFSI": ["Banking", "Insurance", "Fintech", "Asset Management", "NBFCs"],
    "Chemical": ["Specialty Chemicals", "Petrochemicals", "Agrochemicals", "Industrial Gases", "Paints & Coatings"],
    "Construction Material": ["Cement", "Ready-Mix Concrete", "Steel Structures", "Bricks & Blocks", "Aggregates"],
    "Consulting": ["Management Consulting", "Strategy Advisory", "Technical Advisory", "ESG Advisory", "IT Consulting"],
    "Consumer Durables": ["Home Appliances", "Kitchen Appliances", "Air Conditioning", "Consumer Electronics"],
    "Distribution": ["Power Distribution", "EV Charging Infra", "Smart Meters", "DISCOMs", "Microgrids"],
    "E-Commerce": ["B2C Marketplace", "B2B Commerce", "Quick Commerce", "Logistics Tech", "Payment Solutions"],
    "Electrical": ["Switchgear", "Cables & Wires", "Motors & Drives", "Transformers", "Electrical Panels"],
    "Electricity Markets": ["Power Trading", "Exchange Operations", "Market Analysis", "Regulatory", "REC & Carbon Trading"],
    "Energy Efficiency Management": ["Energy Auditing", "Building Management", "Industrial Efficiency", "Smart Lighting", "ESCO Services"],
    "Engineering": ["Heavy Engineering", "Precision Engineering", "Turnkey Projects", "Design & Consulting"],
    "Entertainment": ["Film & Media", "OTT Platforms", "Gaming", "Events & Live", "Music Industry"],
    "Environment": ["Waste Management", "Air Quality", "Water Treatment", "Environmental Consulting", "Carbon Credits"],
    "EV Charging": ["AC Charging", "DC Fast Charging", "Battery Swapping", "Fleet Charging", "Charging Software"],
    "Exporters-Importers": ["Commodity Trading", "EXIM Finance", "Customs & Compliance", "Freight Forwarding"],
    "Facility Management": ["Building Maintenance", "Housekeeping", "Security Services", "Utility Management"],
    "Gems": ["Diamond Processing", "Gemstone Trading", "Jewellery Manufacturing", "Certification"],
    "Government": ["Central Government", "State Government", "PSU & Utilities", "Regulatory Bodies", "Defence"],
    "Hotels": ["Luxury Hotels", "Business Hotels", "Budget Hotels", "Resorts & Homestays"],
    "Institutes - Educational": ["Universities", "Vocational Training", "Ed-Tech", "Research Institutes"],
    "Iron & Steel": ["Steel Manufacturing", "Stainless Steel", "Steel Trading", "Alloy Steel", "Pig Iron"],
    "ITES": ["BPO", "KPO", "IT Outsourcing", "Tech Support"],
    "Leather": ["Leather Manufacturing", "Footwear", "Leather Goods", "Tanning"],
    "Lighting": ["LED Manufacturing", "Smart Lighting", "Solar Lighting", "Industrial Lighting"],
    "Logistics": ["Warehousing", "Freight & Cargo", "Last Mile Delivery", "Cold Chain", "Supply Chain Tech"],
    "Media": ["Print Media", "Digital Media", "Broadcasting", "Advertising"],
    "Mining": ["Coal Mining", "Metal Mining", "Mineral Exploration", "Mine Safety", "Mine Equipment"],
    "NGOs": ["Climate Action", "Rural Development", "Education NGO", "Policy Advocacy", "Health NGO"],
    "Pharmaceuticals": ["Drug Manufacturing", "API & Bulk Drugs", "Clinical Research", "Medical Devices", "Biotech"],
    "Power": ["Thermal Power", "Hydro Power", "Gas-Based Power", "Nuclear Power", "Power EPC"],
    "Publishing": ["Book Publishing", "Digital Publishing", "Academic Publishing", "Magazine & Journals"],
    "Railways": ["Rolling Stock", "Rail Infrastructure", "Metro Systems", "Signalling & Telecom", "High-Speed Rail"],
    "Renewable": ["Solar EPC", "Wind EPC", "Solar OEM", "Wind OEM", "Hybrid Systems", "Rooftop Solar", "Offshore Wind"],
    "Retail": ["Retail Stores", "D2C Brands", "Franchise Retail", "Fashion Retail"],
    "Shipping": ["Container Shipping", "Bulk Carriers", "Tankers", "Port Operations", "Ship Building"],
    "Sports": ["Sports Management", "Sports Tech", "Fitness", "Sports Infrastructure"],
    "Telecommunication": ["Mobile Operators", "Tower Infrastructure", "Broadband", "5G Networks", "Satellite Comms"],
    "Textile": ["Spinning & Weaving", "Apparel Manufacturing", "Technical Textiles", "Home Textiles"],
    "Tourism": ["Travel Agencies", "Adventure Tourism", "Heritage Tourism", "Medical Tourism"],
    "Transmission": ["High Voltage Lines", "HVDC Transmission", "Substations", "Smart Grid"],
    "Water Utility": ["Water Treatment", "Wastewater", "Desalination", "Water Distribution", "Rainwater Harvesting"],
    "Wood": ["Timber & Plywood", "Furniture Manufacturing", "Paper & Pulp", "Wood Products"],
};

async function run() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Get all industries
        const industries = await client.query("SELECT id, name FROM industry ORDER BY name");
        let insertedCount = 0;

        for (const ind of industries.rows) {
            const subs = SUB_INDUSTRIES[ind.name];
            if (!subs) continue;

            // Check if already has subs
            const existing = await client.query(
                "SELECT COUNT(*) FROM sub_industries WHERE industry_id = $1",
                [ind.id]
            );
            if (parseInt(existing.rows[0].count) > 0) {
                console.log(`  ⏭️  ${ind.name} already has ${existing.rows[0].count} subs — skipping`);
                continue;
            }

            for (const subName of subs) {
                await client.query(
                    "INSERT INTO sub_industries (industry_id, name) VALUES ($1, $2)",
                    [ind.id, subName]
                );
                insertedCount++;
            }
            console.log(`  ✅ ${ind.name} → ${subs.length} sub-industries seeded`);
        }

        await client.query("COMMIT");
        console.log(`\n🎉 Done! Inserted ${insertedCount} sub-industries total.`);

        // Summary
        const summary = await client.query(
            `SELECT ind.name, COUNT(si.id) as sub_count
             FROM industry ind
             LEFT JOIN sub_industries si ON ind.id = si.industry_id
             GROUP BY ind.name ORDER BY ind.name`
        );
        console.log("\n📊 Summary:");
        summary.rows.forEach((r) => console.log(`   ${r.name}: ${r.sub_count} subs`));

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
