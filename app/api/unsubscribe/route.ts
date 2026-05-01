import { NextResponse } from "next/server";
import axios from "axios";
import { query } from "@/lib/db";

const BREVO_SUBSCRIBERS_LIST_ID = 7;
const BREVO_UNSUBSCRIBERS_LIST_ID = 8;
const BREVO_API = "https://api.brevo.com/v3/contacts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const email = (body.email ?? "").toString().trim().toLowerCase();
        const reason = (body.reason ?? "").toString().trim();

        if (!email || !EMAIL_RE.test(email)) {
            return NextResponse.json(
                { error: "Please provide a valid email address." },
                { status: 400 }
            );
        }

        if (!reason) {
            return NextResponse.json(
                { error: "Please select an unsubscribe reason." },
                { status: 400 }
            );
        }

        const unsubDate = new Date().toISOString();

        await axios.put(
            `${BREVO_API}/${encodeURIComponent(email)}`,
            {
                attributes: {
                    UNSUB_REASON: reason,
                    UNSUB_DATE: unsubDate,
                },
                listIds: [BREVO_UNSUBSCRIBERS_LIST_ID],
                unlinkListIds: [BREVO_SUBSCRIBERS_LIST_ID],
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY!,
                    "Content-Type": "application/json",
                },
            }
        );

        await query(
            `UPDATE users
             SET content_digest_opted_out = true,
                 updated_at = NOW()
             WHERE LOWER(email) = $1`,
            [email]
        );

        console.log("Contact unsubscribed in Brevo:", email);

        return NextResponse.json({
            success: true,
            message: "You have been successfully unsubscribed.",
        });
    } catch (err: unknown) {
        const details =
            err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: unknown } }).response?.data
                : undefined;
        const message = err instanceof Error ? err.message : String(err);

        console.error("Unsubscribe API error:", details || message);

        return NextResponse.json(
            { error: "Something went wrong. Please try again later." },
            { status: 500 }
        );
    }
}
