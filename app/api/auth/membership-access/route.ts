import { NextRequest, NextResponse } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { query } from "@/lib/db";
import { getUserByMagicToken } from "@/lib/queries";
import { NO_CACHE_HEADERS } from "@/lib/api/no-cache";

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
});

async function ensureClerkUser(member: {
    id: number;
    clerk_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
}): Promise<string> {
    if (member.clerk_id) {
        return member.clerk_id;
    }

    const existingUsers = await clerk.users.getUserList({
        emailAddress: [member.email],
    });

    const clerkUser = existingUsers.data[0] || await clerk.users.createUser({
        emailAddress: [member.email],
        firstName: member.first_name || undefined,
        lastName: member.last_name || undefined,
        skipPasswordRequirement: true,
    });

    await query(
        `UPDATE users
         SET clerk_id = COALESCE(clerk_id, $1),
             email_verified = true,
             updated_at = NOW()
         WHERE id = $2`,
        [clerkUser.id, member.id]
    );

    return clerkUser.id;
}

export async function GET(req: NextRequest) {
    return prepareMembershipAccess(req.nextUrl.searchParams.get("token"));
}

// Ticket exchanges use POST so a CDN cannot reuse an expired or consumed ticket.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        return prepareMembershipAccess(body?.token);
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400, headers: NO_CACHE_HEADERS }
        );
    }
}

async function prepareMembershipAccess(rawToken: unknown) {
    const token = typeof rawToken === "string" ? rawToken.trim().replace(/\\+$/, "") : "";

    if (!token) {
        return NextResponse.json(
            { error: "Missing token parameter" },
            { status: 400, headers: NO_CACHE_HEADERS }
        );
    }

    try {
        const member = await getUserByMagicToken(token);

        if (!member) {
            return NextResponse.json(
                { error: "Invalid or expired membership access link" },
                { status: 401, headers: NO_CACHE_HEADERS }
            );
        }

        const clerkUserId = await ensureClerkUser(member);
        const signInToken = await clerk.signInTokens.createSignInToken({
            userId: clerkUserId,
            expiresInSeconds: 300,
        });

        return NextResponse.json({
            success: true,
            userId: clerkUserId,
            ticket: signInToken.token,
        }, { headers: NO_CACHE_HEADERS });
    } catch (error: unknown) {
        console.error("[MEMBERSHIP_ACCESS]", error);
        return NextResponse.json(
            {
                error: "Unable to prepare membership access",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500, headers: NO_CACHE_HEADERS }
        );
    }
}
