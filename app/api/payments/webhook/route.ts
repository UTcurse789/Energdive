import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    // FUTURE:
    // 1. Validate signature using Razorpay SDK `validateWebhookSignature`
    // 2. Parse event payload
    // 3. Handle `payment.captured` event
    // 4. Extract order_id and payment_id from payload
    // 5. Query purchases table to find the pending purchase
    // 6. markPurchasePaid(...) if not already updated

    return NextResponse.json(
      { error: "Not Implemented - Webhook handler pending integration." },
      { status: 501 }
    );
  } catch (error) {
    console.error("[PAYMENT_WEBHOOK]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
