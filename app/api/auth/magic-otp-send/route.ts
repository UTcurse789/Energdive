import { NextResponse } from "next/server";
import { generateOtp, setOtp } from "@/lib/otp-store";

/**
 * POST /api/auth/magic-otp-send
 *
 * Sends an OTP to the user's phone during the magic link login flow.
 * Called after the magic token is verified but before session creation.
 *
 * Body: { phone: string }
 */
export async function POST(req: Request) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json(
                { error: "Phone number is required" },
                { status: 400 }
            );
        }

        const authKey = process.env.MSG91_AUTH_KEY;
        const templateId = process.env.MSG91_TEMPLATE_ID;

        // Ensure numeric only (strips + and spaces)
        const mobile = phone.replace(/[^0-9]/g, "");

        if (!authKey || !templateId) {
            console.error(
                "MSG91 credentials missing. AUTH_KEY:",
                !!authKey,
                "TEMPLATE_ID:",
                !!templateId
            );
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Generate OTP
        const otp = generateOtp();
        setOtp(mobile, otp);

        console.log(
            `[Magic OTP Send] Sending OTP to mobile: ${mobile}, otp: ${otp}`
        );

        // MSG91 SMS Flow API
        const url = "https://control.msg91.com/api/v5/flow/";

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authkey: authKey,
            },
            body: JSON.stringify({
                template_id: templateId,
                short_url: "0",
                recipients: [
                    {
                        mobiles: mobile,
                        var: otp,
                    },
                ],
            }),
        });

        const data = await res.json();
        console.log(`[Magic OTP Send] MSG91 response:`, JSON.stringify(data));

        if (data.type === "success") {
            return NextResponse.json({ success: true });
        } else {
            console.error("MSG91 Send Error:", data);
            return NextResponse.json(
                { error: data.message || "Failed to send OTP" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Magic OTP Send Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
