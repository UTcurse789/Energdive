import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { identifier } = await req.json();

        if (!identifier) {
            return NextResponse.json({ exists: false, error: "Identifier is required" }, { status: 400 });
        }

        const value = identifier.trim();
        const isEmail = value.includes("@");

        console.log(`[Check User API] Checking identifier: "${value}", isEmail: ${isEmail}`);

        let dbResult;

        if (isEmail) {
            dbResult = await query(
                `SELECT first_name, onboarding_completed FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
                [value]
            );
            console.log(`[Check User API] Email query result rows: ${dbResult.rows.length}`, dbResult.rows[0] || "no match");
        } else {
            // Clean phone number (digits only)
            const cleanPhone = value.replace(/\D/g, "");
            // Support matching with or without country code (+91)
            const phoneWithPlus = cleanPhone.startsWith("91") ? `+${cleanPhone}` : `+91${cleanPhone}`;
            const phoneNoPlus = phoneWithPlus.replace("+", "");

            dbResult = await query(
                `SELECT first_name, onboarding_completed FROM users 
                 WHERE phone = $1 
                    OR phone = $2 
                    OR REPLACE(phone, '+', '') = $3 
                    OR REPLACE(phone, '+', '') = $4 
                 LIMIT 1`,
                [phoneWithPlus, value, cleanPhone, phoneNoPlus]
            );
        }

        if (dbResult.rows.length > 0) {
            const user = dbResult.rows[0];
            return NextResponse.json({
                exists: true,
                firstName: user.first_name || null,
                onboardingCompleted: user.onboarding_completed === true,
            });
        }

        return NextResponse.json({ exists: false, onboardingCompleted: false });

    } catch (error: any) {
        console.error("[Check User API] Error:", error);
        return NextResponse.json({ exists: false, error: "Internal server error" }, { status: 500 });
    }
}
