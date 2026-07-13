import { query } from "../lib/db";

async function run() {
  console.log("Creating purchases table...");

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS purchases (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          resource_id TEXT NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(3) NOT NULL,
          status VARCHAR(20) NOT NULL,
          razorpay_order_id TEXT,
          razorpay_payment_id TEXT,
          purchased_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT unique_user_resource UNIQUE (user_id, resource_id)
      );
    `);
    console.log("Table 'purchases' created successfully.");

    await query(`CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);`);
    console.log("Index 'idx_purchases_user_id' created.");

    await query(`CREATE INDEX IF NOT EXISTS idx_purchases_resource_id ON purchases(resource_id);`);
    console.log("Index 'idx_purchases_resource_id' created.");

    console.log("Database provisioning complete.");
  } catch (error) {
    console.error("Error creating tables:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
