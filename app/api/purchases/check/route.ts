import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { hasPurchased } from "@/lib/purchases";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ purchased: false }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId is required" },
        { status: 400 }
      );
    }

    const isPurchased = await hasPurchased(userId, resourceId);

    return NextResponse.json({ purchased: isPurchased });
  } catch (error) {
    console.error("[PURCHASES_CHECK]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
