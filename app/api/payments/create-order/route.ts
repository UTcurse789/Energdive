import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getRazorpay, getRazorpayKeyId } from "@/lib/razorpay";
import {
  hasPurchased,
  createPendingPurchase,
  updatePurchaseOrderId,
} from "@/lib/purchases";

// ---------------------------------------------------------------------------
// Strapi config — reuse the same env var used across the project
// ---------------------------------------------------------------------------
const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

type DebugLog = Record<string, unknown>;

type CmsAccessData = {
  access_type?: string | null;
  price?: number | string | null;
  currency?: string | null;
};

type CmsPricingItem = {
  attributes?: CmsPricingItem;
  full_title?: string | null;
  short_title?: string | null;
  gated_content?: CmsAccessData | CmsAccessData[] | null;
  content_access?: CmsAccessData | CmsAccessData[] | null;
  [key: string]: unknown;
};

/**
 * Fetches resource pricing info from Strapi by numeric resource ID.
 * Checks both `gated_content` (Tenders) and `content_access` (Resource Center)
 * component field names since different collections use different names.
 *
 * Returns null if the resource doesn't exist or isn't fetchable.
 */
async function fetchResourcePricing(resourceId: string | number): Promise<{
  accessType: string;
  price: number;
  currency: string;
  title: string;
} | { error: string; debug: DebugLog[] }> {
  const collections = [
    { endpoint: "tenders", accessField: "gated_content" },
    { endpoint: "resoucre-centers", accessField: "content_access" },
  ];

  const debugLogs: DebugLog[] = [];

  for (const { endpoint, accessField } of collections) {
    try {
      const url = `${STRAPI_BASE_URL}/api/${endpoint}/${resourceId}?populate[${accessField}]=true`;
      debugLogs.push({ url });

      const res = await fetch(url, {
        cache: "no-store",
        headers: process.env.STRAPI_API_TOKEN ? {
          Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`
        } : undefined
      });
      const status = res.status;
      debugLogs.push({ status });

      if (!res.ok) {
        const text = await res.text();
        debugLogs.push({ errorText: text });
        continue;
      }

      const json = (await res.json()) as { data?: CmsPricingItem | null };
      const item = json?.data;
      if (!item) {
        debugLogs.push({ error: "no item in data" });
        continue;
      }

      const attrs = item.attributes || item;
      const rawAccess = attrs[accessField];
      const accessData = (Array.isArray(rawAccess) ? rawAccess[0] : rawAccess) as
        | CmsAccessData
        | null
        | undefined;

      if (!accessData) {
        debugLogs.push({ error: `no accessData in ${accessField}` });
        continue;
      }

      return {
        accessType: (accessData.access_type || "").toLowerCase(),
        price: Number(accessData.price) || 0,
        currency: (accessData.currency || "INR").toUpperCase(),
        title: cleanString(attrs.full_title) || cleanString(attrs.short_title) || "ENERGDIVE Premium Resource",
      };
    } catch (error) {
      debugLogs.push({
        catch: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
  }

  return { error: "Not found", debug: debugLogs };
}

/**
 * Validates that resourceId is a string or number.
 */
function isValidResourceId(value: unknown): value is string | number {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return value > 0;
  return false;
}

// ---------------------------------------------------------------------------
// POST /api/payments/create-order
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const customerEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      "";
    const customerName = [clerkUser?.firstName, clerkUser?.lastName]
      .map((part) => cleanString(part))
      .filter(Boolean)
      .join(" ");
    const customerContact =
      clerkUser?.primaryPhoneNumber?.phoneNumber ||
      clerkUser?.phoneNumbers?.[0]?.phoneNumber ||
      "";

    // 2. Parse & validate resourceId
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { resourceId } = body;

    if (!isValidResourceId(resourceId)) {
      return NextResponse.json(
        {
          error:
            "Invalid resourceId. Must be a positive integer.",
        },
        { status: 400 }
      );
    }

    // 3. Fetch price from CMS
    const pricing = await fetchResourcePricing(resourceId);
    if (!pricing || "error" in pricing) {
      return NextResponse.json(
        {
          message: "Resource not found in CMS.",
          debug: pricing && "debug" in pricing ? pricing.debug : "No pricing returned",
          error: pricing && "error" in pricing ? pricing.error : null
        },
        { status: 404 }
      );
    }

    // 4. Verify access_type is premium
    if (pricing.accessType !== "premium") {
      return NextResponse.json(
        {
          error:
            "This resource is not premium and does not require payment.",
        },
        { status: 400 }
      );
    }

    // 5. Verify price is valid
    if (pricing.price <= 0) {
      return NextResponse.json(
        { error: "Resource has no valid price configured in CMS." },
        { status: 400 }
      );
    }

    // 6. Check if already purchased
    const alreadyPurchased = await hasPurchased(userId, resourceId);
    if (alreadyPurchased) {
      return NextResponse.json(
        { message: "Resource already purchased." },
        { status: 409 }
      );
    }

    // 7. Create (or reuse) pending purchase
    const purchase = await createPendingPurchase({
      userId,
      resourceId: String(resourceId),
      amount: pricing.price,
      currency: pricing.currency,
    });

    // 8. Create Razorpay order
    const razorpay = getRazorpay();
    const amountInPaise = Math.round(pricing.price * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: pricing.currency,
      receipt: purchase.id,
      notes: {
        purchaseId: purchase.id,
        userId,
        resourceId: String(resourceId),
        resourceTitle: pricing.title.slice(0, 256),
        customerEmail: customerEmail.slice(0, 256),
      },
    });

    // 9. Store Razorpay order ID on the purchase record
    await updatePurchaseOrderId(purchase.id, order.id);

    // 10. Return only what Razorpay Checkout needs (never expose key_secret)
    return NextResponse.json({
      purchaseId: purchase.id,
      orderId: order.id,
      amount: amountInPaise,
      currency: pricing.currency,
      razorpayKey: getRazorpayKeyId(),
      customer: {
        name: customerName,
        email: customerEmail,
        contact: customerContact,
      },
    });
  } catch (error) {
    console.error("[CREATE_ORDER]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
