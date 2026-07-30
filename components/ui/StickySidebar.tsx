"use client";

import React, { useEffect, useRef, useState } from "react";

interface StickySidebarProps {
    children: React.ReactNode;
    className?: string;
    topOffset?: number;
    bottomPadding?: number;
}

export function StickySidebar({
    children,
    className = "",
    topOffset = 96,
    bottomPadding = 24,
}: StickySidebarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [stickyTop, setStickyTop] = useState<string>(`${topOffset}px`);

    useEffect(() => {
        const updateStickyTop = () => {
            if (!containerRef.current) return;
            const elementHeight = containerRef.current.offsetHeight;
            const vh = window.innerHeight;

            if (elementHeight + topOffset > vh) {
                // Sidebar is taller than viewport: stick so bottom widget stays pinned in view
                const calculatedTop = vh - elementHeight - bottomPadding;
                setStickyTop(`${calculatedTop}px`);
            } else {
                // Sidebar is shorter than viewport: stick at top offset
                setStickyTop(`${topOffset}px`);
            }
        };

        updateStickyTop();

        const observer = new ResizeObserver(updateStickyTop);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        window.addEventListener("resize", updateStickyTop);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateStickyTop);
        };
    }, [topOffset, bottomPadding]);

    return (
        <div
            ref={containerRef}
            style={{ position: "sticky", top: stickyTop }}
            className={className}
        >
            {children}
        </div>
    );
}
