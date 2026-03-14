import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logEvent } from "@/lib/system-logger";

const INTERNAL_SECRET = process.env.ZOHO_WEBHOOK_SECRET || "";

/**
 * POST /api/membership/generate-id
 *
 * Generates a new membership ID for a verified user.
 *
 * Membership ID format: ENCL-STN-{sequence_number}
 * Example: ENCL-STN-153
 *
 * Uses PostgreSQL sequence (membership_id_seq) which is also
 * used by the trigger on the users table.
 *
 * Body: {
 *   email?: string,
 *   userId?: number,
 *   secret: string
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (body.secret !== INTERNAL_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email, userId } = body;

        if (!email && !userId) {
            return NextResponse.json(
                { error: "email or userId is required" },
                { status: 400 }
            );
        }

        // Check if user already has a membership ID
        const lookupField = email ? "email" : "id";
        const lookupValue = email ? email.trim().toLowerCase() : userId;

        const existing = await query(
            `SELECT id, membership_id, verification_status FROM users WHERE ${lookupField} = $1 LIMIT 1`,
            [lookupValue]
        );

        if (existing.rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = existing.rows[0];

        // Already has membership ID
        if (user.membership_id) {
            return NextResponse.json({
                success: true,
                membershipId: user.membership_id,
                alreadyExists: true,
            });
        }

        // Must be verified to get a membership ID
        if (user.verification_status !== "verified") {
            return NextResponse.json(
                { error: "User must be verified before membership ID can be generated" },
                { status: 400 }
            );
        }

        // Generate membership ID using PostgreSQL sequence
        const seqResult = await query(
            `SELECT nextval('membership_id_seq') AS seq_val`
        );
        const seqVal = seqResult.rows[0].seq_val;
        const membershipId = `ENCL-STN-${seqVal}`;

        // Store on user record
        await query(
            `UPDATE users SET
               membership_id = $1,
               membership_seq = $2,
               updated_at = NOW()
             WHERE id = $3`,
            [membershipId, seqVal, user.id]
        );

        await logEvent("MEMBERSHIP_GENERATED", email || "", `Membership ID generated: ${membershipId}`);

        return NextResponse.json({
            success: true,
            membershipId,
            userId: user.id,
        });
    } catch (error: any) {
        console.error("[MEMBERSHIP_GENERATE] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate membership ID", details: error.message },
            { status: 500 }
        );
    }
}
