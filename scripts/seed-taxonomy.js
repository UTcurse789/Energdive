/**
 * seed-taxonomy.js
 * ──────────────────────────────────────────────────────────────────
 * Seeds the industries, sub_industries, and communities tables.
 * Idempotent — uses INSERT ... ON CONFLICT DO NOTHING.
 * Run:  node scripts/seed-taxonomy.js
 * ──────────────────────────────────────────────────────────────────
 */

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// ─── TAXONOMY DATA ──────────────────────────────────────────────────

const INDUSTRIES = [
    { name: "Agriculture", slug: "agriculture", subs: ["Agri-Tech", "Farm Equipment", "Irrigation", "Crop Science"] },
    { name: "Automobile", slug: "automobile", subs: ["EV Manufacturing", "Auto Components", "Fleet Management", "Two-Wheeler"] },
    { name: "Aviation", slug: "aviation", subs: ["Airlines", "Airport Infrastructure", "MRO Services", "Cargo Aviation"] },
    { name: "BFSI", slug: "bfsi", subs: ["Banking", "Insurance", "Fintech", "Asset Management", "NBFCs"] },
    { name: "Chemical", slug: "chemical", subs: ["Specialty Chemicals", "Petrochemicals", "Agrochemicals", "Industrial Gases"] },
    { name: "Construction", slug: "construction", subs: ["Civil Engineering", "Real Estate", "Building Materials", "Prefab"] },
    { name: "Consulting", slug: "consulting", subs: ["Management Consulting", "Strategy", "Technical Advisory", "ESG Advisory"] },
    { name: "Electrical", slug: "electrical", subs: ["Switchgear", "Cables & Wires", "Motors & Drives", "Transformers"] },
    { name: "Power", slug: "power", subs: ["EPC", "Thermal Power", "Hydro Power", "Gas-based Power", "Nuclear Power", "Power Trading"] },
    { name: "Renewable Energy", slug: "renewable-energy", subs: ["Solar OEM", "Wind OEM", "Solar EPC", "Wind EPC", "Hybrid Systems", "Rooftop Solar", "Offshore Wind"] },
    { name: "Oil & Gas", slug: "oil-gas", subs: ["Upstream Operator", "Midstream Pipelines", "Downstream Refining", "LNG", "Oilfield Services", "E&P"] },
    { name: "IT & Technology", slug: "it-technology", subs: ["SaaS", "Enterprise Software", "Cloud Infrastructure", "Cybersecurity", "AI & ML", "IoT"] },
    { name: "Healthcare", slug: "healthcare", subs: ["Hospitals", "Pharma", "Medical Devices", "Digital Health", "Diagnostics"] },
    { name: "Government", slug: "government", subs: ["Central Government", "State Government", "PSU", "Regulatory Bodies", "Defense"] },
    { name: "Infrastructure", slug: "infrastructure", subs: ["Roads & Highways", "Railways", "Urban Infra", "Smart Cities", "Ports"] },
    { name: "Logistics", slug: "logistics", subs: ["Warehousing", "Freight", "Last Mile Delivery", "Cold Chain", "Supply Chain"] },
    { name: "Mining", slug: "mining", subs: ["Coal Mining", "Metal Mining", "Mineral Exploration", "Mine Safety"] },
    { name: "NGO & Non-Profit", slug: "ngo-non-profit", subs: ["Climate Action", "Rural Development", "Education NGO", "Policy Advocacy"] },
    { name: "Retail", slug: "retail", subs: ["Retail Stores", "E-Commerce", "FMCG", "D2C Brands"] },
    { name: "Telecom", slug: "telecom", subs: ["Mobile Operators", "Tower Infrastructure", "Broadband", "5G Networks"] },
    { name: "Water Utility", slug: "water-utility", subs: ["Water Treatment", "Wastewater", "Desalination", "Water Distribution"] },
    { name: "Battery & Energy Storage", slug: "battery-energy-storage", subs: ["Manufacturer", "BESS Developer", "Battery Recycling", "Cell Chemistry R&D"] },
    { name: "Electricity Markets", slug: "electricity-markets", subs: ["Power Trader", "Exchange Operator", "Market Analyst", "Regulatory"] },
    { name: "Manufacturing", slug: "manufacturing", subs: ["Heavy Engineering", "Precision Components", "Assembly", "Industrial Automation"] },
];

const COMMUNITIES = [
    {
        name: "Oil & Gas",
        slug: "oil-gas",
        desc: "Upstream, midstream, and downstream oil & gas operations",
        children: [
            { name: "Oil & Gas – Upstream", slug: "oil-gas-upstream" },
            { name: "Oil & Gas – Pipelines", slug: "oil-gas-pipelines" },
            { name: "Oil & Gas – Downstream", slug: "oil-gas-downstream" },
            { name: "Oil & Gas – LNG", slug: "oil-gas-lng" },
            { name: "Oil & Gas – Oilfield Services", slug: "oil-gas-oilfield-services" },
        ],
    },
    {
        name: "Power Generation",
        slug: "power-generation",
        desc: "Thermal, hydro, gas, and nuclear power generation",
        children: [
            { name: "Power Generation – Thermal", slug: "power-generation-thermal" },
            { name: "Power Generation – Hydro", slug: "power-generation-hydro" },
            { name: "Power Generation – Gas Turbines", slug: "power-generation-gas-turbines" },
            { name: "Power Generation – Nuclear", slug: "power-generation-nuclear" },
        ],
    },
    {
        name: "Renewables",
        slug: "renewables",
        desc: "Solar, wind, and other renewable energy sources",
        children: [
            { name: "Renewables – Solar", slug: "renewables-solar" },
            { name: "Renewables – Wind", slug: "renewables-wind" },
            { name: "Renewables – Offshore Wind", slug: "renewables-offshore-wind" },
            { name: "Renewables – Hybrid Systems", slug: "renewables-hybrid-systems" },
            { name: "Renewables – Small Hydro", slug: "renewables-small-hydro" },
        ],
    },
    {
        name: "Transmission",
        slug: "transmission",
        desc: "High-voltage transmission infrastructure and smart grid",
        children: [
            { name: "Transmission – Smart Grid", slug: "transmission-smart-grid" },
            { name: "Transmission – HVDC", slug: "transmission-hvdc" },
            { name: "Transmission – Substations", slug: "transmission-substations" },
        ],
    },
    {
        name: "Distribution",
        slug: "distribution",
        desc: "Power distribution networks and EV charging infrastructure",
        children: [
            { name: "Distribution – EV Charging", slug: "distribution-ev-charging" },
            { name: "Distribution – Smart Meters", slug: "distribution-smart-meters" },
            { name: "Distribution – DISCOMs", slug: "distribution-discoms" },
        ],
    },
    {
        name: "Electricity Markets",
        slug: "electricity-markets",
        desc: "Power markets, trading, and regulatory frameworks",
        children: [
            { name: "Electricity Markets – Power Markets", slug: "electricity-markets-power-markets" },
            { name: "Electricity Markets – REC Trading", slug: "electricity-markets-rec-trading" },
            { name: "Electricity Markets – Carbon Credits", slug: "electricity-markets-carbon-credits" },
        ],
    },
    {
        name: "New Energies",
        slug: "new-energies",
        desc: "Green hydrogen, biofuels, and emerging energy technologies",
        children: [
            { name: "New Energies – Green Hydrogen", slug: "new-energies-green-hydrogen" },
            { name: "New Energies – Biofuels", slug: "new-energies-biofuels" },
            { name: "New Energies – Fuel Cells", slug: "new-energies-fuel-cells" },
            { name: "New Energies – Ammonia", slug: "new-energies-ammonia" },
        ],
    },
    {
        name: "Energy Storage",
        slug: "energy-storage",
        desc: "Battery storage, pumped hydro, and grid-scale storage",
        children: [
            { name: "Energy Storage – BESS", slug: "energy-storage-bess" },
            { name: "Energy Storage – Pumped Hydro", slug: "energy-storage-pumped-hydro" },
            { name: "Energy Storage – Flywheel", slug: "energy-storage-flywheel" },
            { name: "Energy Storage – Thermal Storage", slug: "energy-storage-thermal-storage" },
        ],
    },
    {
        name: "Sustainability & Safety",
        slug: "sustainability-safety",
        desc: "Energy efficiency, ESG, and industrial safety",
        children: [
            { name: "Sustainability – Energy Efficiency", slug: "sustainability-energy-efficiency" },
            { name: "Sustainability – ESG Compliance", slug: "sustainability-esg-compliance" },
            { name: "Sustainability – Carbon Neutrality", slug: "sustainability-carbon-neutrality" },
            { name: "Safety – Industrial Safety", slug: "safety-industrial-safety" },
            { name: "Safety – Process Safety", slug: "safety-process-safety" },
        ],
    },
];

// ─── SEEDING ────────────────────────────────────────────────────────

function slugify(name, prefix) {
    return (
        (prefix ? prefix + "-" : "") +
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
    );
}

async function run() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // ── Seed Industries + Sub-Industries ─────────────────────────
        console.log("⏳ Seeding industries...");
        for (const ind of INDUSTRIES) {
            const res = await client.query(
                `INSERT INTO industries (name, slug) VALUES ($1, $2)
                 ON CONFLICT (slug) DO NOTHING
                 RETURNING id`,
                [ind.name, ind.slug]
            );

            // Get ID (either from INSERT or existing)
            let industryId;
            if (res.rows.length > 0) {
                industryId = res.rows[0].id;
            } else {
                const existing = await client.query(
                    `SELECT id FROM industries WHERE slug = $1`,
                    [ind.slug]
                );
                industryId = existing.rows[0].id;
            }

            for (const subName of ind.subs) {
                const subSlug = slugify(subName, ind.slug);
                await client.query(
                    `INSERT INTO sub_industries (name, slug, industry_id)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (slug) DO NOTHING`,
                    [subName, subSlug, industryId]
                );
            }
        }
        console.log(`✅ ${INDUSTRIES.length} industries seeded.`);

        // ── Seed Communities + Sub-Communities ────────────────────────
        console.log("⏳ Seeding communities...");
        for (const community of COMMUNITIES) {
            const res = await client.query(
                `INSERT INTO communities (name, slug, description, parent_id)
                 VALUES ($1, $2, $3, NULL)
                 ON CONFLICT (slug) DO NOTHING
                 RETURNING id`,
                [community.name, community.slug, community.desc]
            );

            let parentId;
            if (res.rows.length > 0) {
                parentId = res.rows[0].id;
            } else {
                const existing = await client.query(
                    `SELECT id FROM communities WHERE slug = $1`,
                    [community.slug]
                );
                parentId = existing.rows[0].id;
            }

            for (const child of community.children) {
                await client.query(
                    `INSERT INTO communities (name, slug, parent_id)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (slug) DO NOTHING`,
                    [child.name, child.slug, parentId]
                );
            }
        }
        console.log(`✅ ${COMMUNITIES.length} communities seeded.`);

        await client.query("COMMIT");

        // ── Summary ──────────────────────────────────────────────────
        const indCount = await client.query("SELECT COUNT(*) FROM industries");
        const subCount = await client.query("SELECT COUNT(*) FROM sub_industries");
        const comCount = await client.query("SELECT COUNT(*) FROM communities");

        console.log("\n📊 Taxonomy Summary:");
        console.log(`   Industries:     ${indCount.rows[0].count}`);
        console.log(`   Sub-Industries: ${subCount.rows[0].count}`);
        console.log(`   Communities:    ${comCount.rows[0].count}`);

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
