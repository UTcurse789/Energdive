import { query } from "./db";
import type { QueryResultRow } from "pg";

export type PurchaseStatus = "pending" | "paid" | "failed" | "refunded";

export interface Purchase {
  id: string;
  userId: string;
  resourceId: string;
  amount: number;
  currency: string;
  status: PurchaseStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  purchasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type PurchaseRow = QueryResultRow & {
  id: string;
  user_id: string;
  resource_id: string | number;
  amount: string | number;
  currency: string;
  status: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  purchased_at?: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

/**
 * Maps DB row to Purchase object
 */
function mapPurchaseRow(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    userId: row.user_id,
    resourceId: String(row.resource_id),
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status as PurchaseStatus,
    razorpayOrderId: row.razorpay_order_id || undefined,
    razorpayPaymentId: row.razorpay_payment_id || undefined,
    purchasedAt: row.purchased_at ? new Date(row.purchased_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Checks if a user has successfully purchased a specific resource.
 */
export async function hasPurchased(userId: string, resourceId: string | number): Promise<boolean> {
  if (!userId || !resourceId) return false;

  const result = await query(
    `SELECT 1 FROM purchases WHERE user_id = $1 AND resource_id = $2 AND status = 'paid' LIMIT 1`,
    [userId, String(resourceId)]
  );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Retrieves a paid purchase for a specific user/resource pair.
 */
export async function getPaidPurchaseForResource(
  userId: string,
  resourceId: string | number
): Promise<Purchase | null> {
  if (!userId || !resourceId) return null;

  const result = await query<PurchaseRow>(
    `
    SELECT *
    FROM purchases
    WHERE user_id = $1 AND resource_id = $2 AND status = 'paid'
    ORDER BY purchased_at DESC NULLS LAST, updated_at DESC
    LIMIT 1
    `,
    [userId, String(resourceId)]
  );

  if (result.rowCount === 0) return null;
  return mapPurchaseRow(result.rows[0]);
}

/**
 * Creates a new pending purchase record in the database.
 * If a pending purchase already exists, returns the existing one to prevent duplicates.
 */
export async function createPendingPurchase(data: {
  userId: string;
  resourceId: string;
  amount: number;
  currency: string;
}): Promise<Purchase> {
  const { userId, resourceId, amount, currency } = data;

  // Ensure amount is handled correctly as a string for DECIMAL(10,2) or let pg do the conversion
  const result = await query<PurchaseRow>(
    `
    INSERT INTO purchases (user_id, resource_id, amount, currency, status)
    VALUES ($1, $2, $3, $4, 'pending')
    ON CONFLICT (user_id, resource_id) 
    DO UPDATE SET 
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      status = 'pending',
      updated_at = NOW()
    WHERE purchases.status != 'paid'
    RETURNING *;
    `,
    [userId, resourceId, amount, currency.toUpperCase()]
  );

  if (!result.rows[0]) {
    throw new Error("Unable to create pending purchase. It may have already been paid.");
  }

  return mapPurchaseRow(result.rows[0]);
}

/**
 * Marks a purchase as fully paid after a successful transaction.
 */
export async function markPurchasePaid(
  id: string,
  razorpayOrderId: string,
  razorpayPaymentId: string
): Promise<void> {
  const result = await query(
    `
    UPDATE purchases
    SET 
      status = 'paid',
      razorpay_order_id = $1,
      razorpay_payment_id = $2,
      purchased_at = NOW(),
      updated_at = NOW()
    WHERE id = $3 AND status != 'paid'
    `,
    [razorpayOrderId, razorpayPaymentId, id]
  );

  if (result.rowCount === 0) {
    throw new Error("No pending purchase found to update or purchase already paid.");
  }
}

/**
 * Retrieves a purchase by its ID.
 */
export async function getPurchase(id: string): Promise<Purchase | null> {
  const result = await query<PurchaseRow>(`SELECT * FROM purchases WHERE id = $1 LIMIT 1`, [id]);
  
  if (result.rowCount === 0) return null;
  return mapPurchaseRow(result.rows[0]);
}

/**
 * Retrieves a purchase by its Razorpay Order ID.
 */
export async function getPurchaseByOrderId(razorpayOrderId: string): Promise<Purchase | null> {
  if (!razorpayOrderId) return null;

  const result = await query<PurchaseRow>(
    `SELECT * FROM purchases WHERE razorpay_order_id = $1 LIMIT 1`,
    [razorpayOrderId]
  );

  if (result.rowCount === 0) return null;
  return mapPurchaseRow(result.rows[0]);
}

/**
 * Retrieves all resource IDs that a user has successfully purchased.
 */
export async function getPurchasedResources(userId: string): Promise<number[]> {
  if (!userId) return [];

  const result = await query(
    `SELECT resource_id FROM purchases WHERE user_id = $1 AND status = 'paid'`,
    [userId]
  );

  return result.rows.map((row) => parseInt(row.resource_id, 10));
}

/**
 * Stores a Razorpay Order ID on an existing pending purchase.
 * Called after Razorpay order creation so we can reconcile later.
 */
export async function updatePurchaseOrderId(
  purchaseId: string,
  razorpayOrderId: string
): Promise<void> {
  if (!purchaseId || !razorpayOrderId) {
    throw new Error("purchaseId and razorpayOrderId are required.");
  }

  const result = await query(
    `
    UPDATE purchases
    SET razorpay_order_id = $1, updated_at = NOW()
    WHERE id = $2 AND status = 'pending'
    `,
    [razorpayOrderId, purchaseId]
  );

  if (result.rowCount === 0) {
    throw new Error(
      `No pending purchase found with id=${purchaseId} to attach order.`
    );
  }
}
