import { NextRequest, NextResponse } from "next/server";
import { sendPreferenceDigestPreview } from "@/lib/preference-digests";
import { isDigestFormat, isDigestFrequency } from "@/lib/digest-preferences";

const INTERNAL_SECRET = process.env.CRON_SECRET || "";

/**
 * POST /api/admin/test-preference-digest
 *
 * Sends a one-off preview digest to any email address using the latest
 * matching content from Strapi.
 *
 * Body:
 * {
 *   secret: string,
 *   email: string,
 *   firstName?: string,
 *   frequency?: "daily" | "weekly" | "monthly",
 *   formats?: string[]
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!INTERNAL_SECRET || body.secret !== INTERNAL_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = (body.email || "").toString().trim().toLowerCase();
        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const normalizedFrequency = (body.frequency || "").toString().trim().toLowerCase();
        const frequency = isDigestFrequency(normalizedFrequency)
            ? normalizedFrequency
            : "daily";

        const formats = Array.isArray(body.formats)
            ? body.formats
                .map((format: unknown) => String(format).trim())
                .filter(isDigestFormat)
            : undefined;

        const result = await sendPreferenceDigestPreview({
            email,
            firstName: body.firstName ? String(body.firstName) : undefined,
            frequency,
            formats,
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        const details = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Internal server error", details },
            { status: 500 }
        );
    }
}
