import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import crypto from "crypto";
import { getPurchaseByOrderId, markPurchasePaid } from "@/lib/purchases";
import { getRazorpay } from "@/lib/razorpay";

const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function safeRazorpayName(name: string | undefined, email: string) {
  const fallbackName = email.split("@")[0] || "ENERGDIVE Member";
  const normalized = (name || fallbackName)
    .replace(/[^a-zA-Z0-9 .()']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length >= 3) return normalized.slice(0, 50);
  return "ENERGDIVE Member";
}

type ResourceInvoiceDetails = {
  title: string;
  currency?: string;
};

async function fetchResourceInvoiceDetails(resourceId: string): Promise<ResourceInvoiceDetails | null> {
  try {
    const url = `${STRAPI_BASE_URL}/api/resoucre-centers/${encodeURIComponent(
      resourceId
    )}?populate[content_access]=true`;
    const response = await fetch(url, {
      cache: "no-store",
      headers: process.env.STRAPI_API_TOKEN
        ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }
        : undefined,
    });

    if (!response.ok) return null;

    const json = (await response.json()) as {
      data?: {
        attributes?: {
          full_title?: string | null;
          short_title?: string | null;
          content_access?: { currency?: string | null } | Array<{ currency?: string | null }> | null;
        };
        full_title?: string | null;
        short_title?: string | null;
        content_access?: { currency?: string | null } | Array<{ currency?: string | null }> | null;
      } | null;
    };
    const item = json.data;
    const attrs = item?.attributes || item;
    if (!attrs) return null;

    const access = Array.isArray(attrs.content_access)
      ? attrs.content_access[0]
      : attrs.content_access;

    return {
      title:
        cleanString(attrs.full_title) ||
        cleanString(attrs.short_title) ||
        "ENERGDIVE Premium Resource",
      currency: cleanString(access?.currency)?.toUpperCase(),
    };
  } catch (error) {
    console.error("[VERIFY] Failed to fetch resource details for Razorpay invoice:", error);
    return null;
  }
}

async function triggerRazorpayResourceInvoiceEmail({
  amount,
  currency,
  customerEmail,
  customerName,
  orderId,
  paymentId,
  purchaseId,
  resourceId,
}: {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  orderId: string;
  paymentId: string;
  purchaseId: string;
  resourceId: string;
}) {
  if (process.env.RAZORPAY_RESOURCE_INVOICE_EMAILS === "false") {
    return { status: "skipped" as const, reason: "disabled" };
  }

  if (!customerEmail || customerEmail.length > 64) {
    return { status: "skipped" as const, reason: "missing_or_invalid_email" };
  }

  const resource = await fetchResourceInvoiceDetails(resourceId);
  const invoiceCurrency = (resource?.currency || currency || "INR").toUpperCase();
  const resourceTitle = (resource?.title || "ENERGDIVE Premium Resource").slice(0, 120);
  const amountInSubunits = Math.round(amount * 100);
  const receipt = `resource-${purchaseId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24)}`;

  const razorpay = getRazorpay();
  const invoice = await razorpay.invoices.create({
    type: "invoice",
    description: `Payment invoice for ${resourceTitle}`.slice(0, 255),
    order_id: orderId,
    currency: invoiceCurrency,
    customer: {
      name: safeRazorpayName(customerName, customerEmail),
      email: customerEmail,
    },
    line_items: [
      {
        name: resourceTitle,
        description: `Premium resource access: ${resourceTitle}`.slice(0, 255),
        amount: amountInSubunits,
        currency: invoiceCurrency,
        quantity: 1,
      },
    ],
    email_notify: 1,
    sms_notify: 0,
    partial_payment: false,
    receipt,
    notes: {
      purchaseId,
      resourceId,
      paymentId,
    },
  });

  return {
    status: "sent" as const,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
    emailStatus: invoice.email_status,
  };
}

// ---------------------------------------------------------------------------
// POST /api/payments/verify
// ---------------------------------------------------------------------------
// Called by the frontend after Razorpay Checkout returns a successful payment.
// Verifies the payment signature using HMAC-SHA256, then marks the purchase
// as "paid" in the database.
//
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const body = (await request.json()) as {
      razorpay_order_id?: unknown;
      razorpay_payment_id?: unknown;
      razorpay_signature?: unknown;
    };
    const razorpay_order_id = cleanString(body.razorpay_order_id);
    const razorpay_payment_id = cleanString(body.razorpay_payment_id);
    const razorpay_signature = cleanString(body.razorpay_signature);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature" },
        { status: 400 }
      );
    }

    // 3. Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("[VERIFY] Missing RAZORPAY_KEY_SECRET");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[VERIFY] Signature mismatch", {
        expected: expectedSignature,
        received: razorpay_signature,
      });
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    // 4. Find the purchase by order ID
    const purchase = await getPurchaseByOrderId(razorpay_order_id);
    if (!purchase) {
      return NextResponse.json(
        { error: "No purchase found for this order." },
        { status: 404 }
      );
    }

    // 5. Verify the purchase belongs to this user
    if (purchase.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized. Purchase does not belong to this user." },
        { status: 403 }
      );
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

    // 6. Mark as paid
    let razorpayInvoice:
      | Awaited<ReturnType<typeof triggerRazorpayResourceInvoiceEmail>>
      | { status: "failed"; error: string } = {
      status: "skipped",
      reason: "already_paid",
    };

    if (purchase.status !== "paid") {
      await markPurchasePaid(purchase.id, razorpay_order_id, razorpay_payment_id);
      try {
        razorpayInvoice = await triggerRazorpayResourceInvoiceEmail({
          amount: purchase.amount,
          currency: purchase.currency,
          customerEmail,
          customerName,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          purchaseId: purchase.id,
          resourceId: purchase.resourceId,
        });
      } catch (invoiceError) {
        const invoiceMessage =
          invoiceError instanceof Error ? invoiceError.message : String(invoiceError);
        console.error("[VERIFY] Razorpay invoice email failed:", invoiceError);
        razorpayInvoice = { status: "failed", error: invoiceMessage };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and purchase completed.",
      purchaseId: purchase.id,
      razorpayInvoice,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[VERIFY] Error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
