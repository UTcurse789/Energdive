import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteUserAccount } from "@/lib/queries/users";

/**
 * POST /api/user/delete-account
 * Permanently deletes the user from DB and Clerk.
 * Accepts an optional deletion reason for feedback logging.
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Require confirmation text
        if (body.confirmation !== "DELETE") {
            return NextResponse.json(
                { error: "Please type DELETE to confirm account deletion." },
                { status: 400 }
            );
        }

        // Log deletion reason for feedback (before deleting user data)
        const reason = typeof body.reason === "string" ? body.reason.trim() : "Not provided";
        const otherReason = typeof body.otherReason === "string" ? body.otherReason.trim() : "";
        const reasonDisplay = reason === "Other (please specify)" && otherReason
            ? `Other: ${otherReason}`
            : reason;
        console.log(`[DELETE_ACCOUNT] User ${userId} requested deletion. Reason: ${reasonDisplay}`);

        // 1. Delete from our database
        const dbDeleted = await deleteUserAccount(userId);
        console.log(`[DELETE_ACCOUNT] DB deletion result for ${userId}: ${dbDeleted}`);

        // 2. Delete from Clerk
        try {
            await (await clerkClient()).users.deleteUser(userId);
            console.log(`[DELETE_ACCOUNT] Clerk user ${userId} deleted`);
        } catch (clerkErr) {
            console.error(`[DELETE_ACCOUNT] Clerk deletion failed:`, clerkErr);
            // DB is already deleted, return partial success
            return NextResponse.json({
                success: true,
                warning: "Account data deleted but Clerk cleanup failed. Contact support if issues persist.",
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DELETE_ACCOUNT]", error);
        return NextResponse.json(
            { error: "Failed to delete account. Please try again." },
            { status: 500 }
        );
    }
}
