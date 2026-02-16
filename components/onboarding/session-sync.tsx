"use client";

import { useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SessionSync() {
    const { session } = useSession();
    const router = useRouter();

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 10;

        const syncSession = async () => {
            if (!session) return;

            try {
                // Force refresh token to get latest metadata
                await session.reload();

                // Check if metadata is aligned
                if (session.user.publicMetadata.onboarding_completed) {
                    router.push("/dashboard");
                    router.refresh();
                } else {
                    // Still stale? Wait and retry
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(syncSession, 1000);
                    } else {
                        // Fallback: If still failing after 10s, try one last force push or show error
                        console.error("Session sync timed out. Metadata not updating.");
                        // Optional: Force push anyway and let middleware handle it (maybe it works now?)
                        router.push("/dashboard");
                        router.refresh();
                    }
                }
            } catch (err) {
                console.error("Session sync failed", err);
            }
        };

        syncSession();
    }, [session, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAFAFA]">
            <div className="w-8 h-8 border-4 border-[#0AB996]/30 border-t-[#0AB996] rounded-full animate-spin mb-4" />
            <p className="text-sm text-zinc-500 font-medium animate-pulse">
                Finalizing setup...
            </p>
        </div>
    );
}
