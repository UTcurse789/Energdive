"use client";

import { useState } from "react";
import { SubscribeModal } from "@/components/subscribe-modal";

/**
 * Drop-in client-side "Subscribe Free" button + modal.
 * Works inside server components (reports page, footer, etc.).
 */
export function SubscribeFreeButton({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={className}
            >
                {children ?? "Subscribe Free"}
            </button>
            <SubscribeModal isOpen={open} onClose={() => setOpen(false)} />
        </>
    );
}
