import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId is required" },
        { status: 400 }
      );
    }

    // FUTURE: 
    // 1. Fetch resource pricing from Strapi based on resourceId (never trust frontend price)
    // 2. Initialize Razorpay order via Razorpay SDK
    // 3. createPendingPurchase({ userId, resourceId, amount: strapiPrice, currency: strapiCurrency })
    // 4. Return order details to frontend
    
    return NextResponse.json(
      { error: "Not Implemented - Payment gateway pending integration." },
      { status: 501 }
    );
  } catch (error) {
    console.error("[CREATE_ORDER]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
