import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";

export async function POST(req: Request) {
    try {
        const { phone, otp } = await req.json();

        if (!phone || !otp) {
            return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
        }

        // Ensure numeric only
        const mobile = phone.replace(/[^0-9]/g, "");

        console.log(`[OTP Verify] Verifying OTP for mobile: ${mobile}`);

        // Verify against our in-memory store (since we generate the OTP ourselves)
        const isValid = verifyOtp(mobile, otp);

        if (isValid) {
            console.log(`[OTP Verify] Success for mobile: ${mobile}`);
            return NextResponse.json({ success: true });
        } else {
            console.log(`[OTP Verify] Failed for mobile: ${mobile}`);
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }

    } catch (error) {
        console.error("OTP Verify Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
