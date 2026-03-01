"use client";

import { useEffect } from "react";

export default function PrintTrigger() {
    useEffect(() => {
        const t = setTimeout(() => window.print(), 600);
        return () => clearTimeout(t);
    }, []);

    return (
        <button
            onClick={() => window.print()}
            id="print-btn"
            style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#cc0000",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                padding: "10px 20px",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "Arial, sans-serif",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                letterSpacing: "0.03em",
            }}
            aria-label="Print"
        >
            🖨 Print Article
        </button>
    );
}
