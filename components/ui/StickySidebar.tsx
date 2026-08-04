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

            if (elementHeight > 0 && elementHeight + topOffset > vh) {
                // Sidebar is taller than viewport: stick so bottom widget stays pinned in view
                const calculatedTop = vh - elementHeight - bottomPadding;
                setStickyTop(`${calculatedTop}px`);
            } else {
                // Sidebar is shorter than viewport: stick at top offset
                setStickyTop(`${topOffset}px`);
            }
        };

        updateStickyTop();

        // 1. ResizeObserver for element dimension changes
        const resizeObserver = new ResizeObserver(updateStickyTop);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // 2. MutationObserver for DOM changes inside sidebar
        const mutationObserver = new MutationObserver(updateStickyTop);
        if (containerRef.current) {
            mutationObserver.observe(containerRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
            });
        }

        // 3. Window resize listener
        window.addEventListener("resize", updateStickyTop);

        // 4. Image load listeners
        const handleImageLoad = () => updateStickyTop();
        const images = containerRef.current?.querySelectorAll("img");
        images?.forEach((img) => {
            if (!img.complete) {
                img.addEventListener("load", handleImageLoad);
            }
        });

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            window.removeEventListener("resize", updateStickyTop);
            images?.forEach((img) => img.removeEventListener("load", handleImageLoad));
        };
    }, [topOffset, bottomPadding, children]);

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
