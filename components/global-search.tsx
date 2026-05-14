"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FileText, FileSignature, Newspaper, Terminal, Play, Calendar, BookOpen, Mic, Pen, BarChart3, Star } from "lucide-react";
import { useSearch, SearchResult } from "@/hooks/use-search";
import { buildContentUrl } from "@/lib/content-routes";
import posthog from "posthog-js";

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const RESULT_ITEM_HEIGHT = 82;
const MAX_VISIBLE = 5;

// ─── Highlight matching keywords ──────────────────────────────────────────
function HighlightedText({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;

    const words = query
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    if (words.length === 0) return <>{text}</>;

    const regex = new RegExp(`(${words.join("|")})`, "gi");
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                part.match(new RegExp(`^(${words.join("|")})$`, "i")) ? (
                    <mark
                        key={i}
                        style={{
                            background: "linear-gradient(120deg, #fef08a 0%, #fde047 100%)",
                            color: "#713f12",
                            borderRadius: "3px",
                            padding: "0 2px",
                            fontWeight: 700,
                            fontStyle: "normal",
                        }}
                    >
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const { query, setQuery, results, isLoading, error } = useSearch();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = `${scrollBarWidth}px`;

            // ── Force ALL stacking contexts below the modal ──────────────
            // This fixes hero images / carousels / sliders bleeding over modal
            document.documentElement.style.setProperty("--modal-open", "1");

            window.addEventListener("keydown", handleKeyDown);
            const timer = setTimeout(() => inputRef.current?.focus(), 100);

            return () => {
                clearTimeout(timer);
                document.body.style.overflow = "unset";
                document.body.style.paddingRight = "0px";
                document.documentElement.style.removeProperty("--modal-open");
                window.removeEventListener("keydown", handleKeyDown);
            };
        }
    }, [isOpen, onClose]);

    const handleResultClick = (result: SearchResult) => {
        let finalPath = "";

        switch (result.type.toLowerCase()) {
            case "video":
                finalPath = `/videos/${result.slug}`;
                break;
            case "event":
                finalPath = `/events/${result.slug}`;
                break;
            case "report":
                finalPath = `/reports/${result.slug}`;
                break;
            default:
                finalPath = buildContentUrl({ slug: result.slug, type_of_content: { name: result.type } });
        }

        posthog.capture("search_result_clicked", {
            result_title: result.title,
            result_type: result.type,
            result_slug: result.slug,
            search_query: query,
            destination_path: finalPath,
        });

        onClose();
        setTimeout(() => setQuery(""), 200);
        router.push(finalPath);
    };

    const getIconForType = (type: string) => {
        switch (type.toLowerCase()) {
            case "article":
            case "articles": return <FileText size={14} className="text-blue-500" />;
            case "opinion": return <FileSignature size={14} className="text-emerald-500" />;
            case "news": return <Newspaper size={14} className="text-amber-500" />;
            case "cover story": return <Star size={14} className="text-purple-500" />;
            case "case study": return <BookOpen size={14} className="text-indigo-500" />;
            case "interview": return <Mic size={14} className="text-pink-500" />;
            case "editorial": return <Pen size={14} className="text-orange-500" />;
            case "feature": return <FileText size={14} className="text-teal-500" />;
            case "analysis": return <BarChart3 size={14} className="text-cyan-500" />;
            case "video": return <Play size={14} className="text-red-500" />;
            case "event": return <Calendar size={14} className="text-violet-500" />;
            case "report": return <BookOpen size={14} className="text-emerald-600" />;
            default: return <Terminal size={14} className="text-gray-500" />;
        }
    };

    if (!mounted) return null;

    // Show exactly MAX_VISIBLE items then scroll
    const visibleCount = Math.min(results.length, MAX_VISIBLE);
    const resultsMaxHeight = results.length > 0
        ? `${visibleCount * RESULT_ITEM_HEIGHT + 16}px`
        : "200px";

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/*
                     * ── CRITICAL: isolation:isolate + z-index: 2147483647 (max int) ──
                     * Creates a brand-new stacking context at the very top of the DOM.
                     * This ensures even transform/will-change elements on the page
                     * (like hero sliders) can NEVER bleed over this overlay.
                     */}
                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 2147483647,
                            isolation: "isolate",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "16px",
                        }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            onClick={onClose}
                            style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(0,0,0,0.55)",
                                backdropFilter: "blur(6px)",
                                WebkitBackdropFilter: "blur(6px)",
                                cursor: "pointer",
                                zIndex: 0,
                            }}
                            aria-hidden="true"
                        />

                        {/* Modal card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -8 }}
                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
                            className="search-modal-card"
                            style={{
                                position: "relative",
                                width: "100%",
                                maxWidth: "672px",
                                background: "#ffffff",
                                borderRadius: "18px",
                                boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)",
                                border: "1px solid #e5e7eb",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                zIndex: 1,
                            }}
                            role="dialog"
                            aria-modal="true"
                        >
                            {/* ── Search Input ── */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "0 16px",
                                borderBottom: "1px solid #f3f4f6",
                                minHeight: "64px",
                                flexShrink: 0,
                                position: "relative",
                                background: "#fff",
                            }}>
                                <Search
                                    style={{ position: "absolute", left: "24px", color: "#9ca3af", width: 20, height: 20 }}
                                />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search articles, opinions, news..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    style={{
                                        width: "100%",
                                        fontSize: "17px",
                                        paddingLeft: "44px",
                                        paddingRight: "48px",
                                        paddingTop: "16px",
                                        paddingBottom: "16px",
                                        background: "transparent",
                                        outline: "none",
                                        border: "none",
                                        color: "#18181b",
                                        fontWeight: 500,
                                    }}
                                    aria-label="Global search input"
                                />
                                {isLoading && (
                                    <div style={{
                                        position: "absolute",
                                        right: "52px",
                                        width: 18,
                                        height: 18,
                                        border: "2px solid #00A651",
                                        borderTopColor: "transparent",
                                        borderRadius: "50%",
                                        animation: "spin 0.7s linear infinite",
                                    }} />
                                )}
                                <button
                                    onClick={onClose}
                                    style={{
                                        position: "absolute",
                                        right: "12px",
                                        padding: "6px",
                                        borderRadius: "8px",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#9ca3af",
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                    <X style={{ width: 20, height: 20 }} />
                                </button>
                            </div>

                            {/* ── Results Area ── */}
                            <div style={{
                                overflowY: "auto",
                                overscrollBehavior: "contain",
                                maxHeight: resultsMaxHeight,
                                transition: "max-height 0.2s ease",
                                paddingBottom: "8px",
                            }}>
                                {error && (
                                    <div style={{ padding: "32px", textAlign: "center", color: "#ef4444", fontSize: "14px" }}>
                                        {error}
                                    </div>
                                )}

                                {query.length > 0 && results.length === 0 && !isLoading && !error && (
                                    <div style={{ padding: "48px 32px", textAlign: "center" }}>
                                        <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "4px" }}>
                                            No results for{" "}
                                            <strong style={{ color: "#3f3f46" }}>&quot;{query}&quot;</strong>
                                        </p>
                                        <p style={{ color: "#d1d5db", fontSize: "12px" }}>
                                            Try different keywords or shorter terms
                                        </p>
                                    </div>
                                )}

                                {query.length === 0 && (
                                    <div style={{
                                        padding: "48px 32px",
                                        textAlign: "center",
                                        color: "#9ca3af",
                                        fontSize: "14px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "12px",
                                    }}>
                                        <Search style={{ width: 32, height: 32, color: "#e5e7eb" }} />
                                        <p>Start typing to search EnergDive contents.</p>
                                    </div>
                                )}

                                {results.length > 0 && (
                                    <ul style={{ listStyle: "none", padding: "8px", margin: 0 }}>
                                        {results.map((result, index) => (
                                            <motion.li
                                                key={result.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.045, duration: 0.15 }}
                                            >
                                                <ResultButton
                                                    result={result}
                                                    query={query}
                                                    onClick={() => handleResultClick(result)}
                                                    getIconForType={getIconForType}
                                                />
                                            </motion.li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* ── Footer ── */}
                            <div className="search-modal-footer" style={{
                                padding: "10px 16px",
                                borderTop: "1px solid #f3f4f6",
                                background: "#f9fafb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "6px",
                                fontSize: "11px",
                                color: "#9ca3af",
                                fontWeight: 500,
                                flexShrink: 0,
                            }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <kbd style={{
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        background: "rgba(209,213,219,0.5)",
                                        border: "1px solid #d1d5db",
                                        fontSize: "10px",
                                        color: "#6b7280",
                                        fontFamily: "sans-serif",
                                    }}>ESC</kbd>
                                    to close
                                </span>

                                <span className="hidden sm:flex" style={{ display: undefined, alignItems: "center", gap: "6px" }}>
                                    <kbd style={{
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        background: "rgba(209,213,219,0.5)",
                                        border: "1px solid #d1d5db",
                                        fontSize: "10px",
                                        color: "#6b7280",
                                        fontFamily: "sans-serif",
                                    }}>CMD + K</kbd>
                                    to open
                                </span>
                                <span>
                                    Powered by{" "}
                                    <strong style={{ color: "#00A651" }}>ENERGDIVE</strong>
                                    <span className="hidden sm:inline"> Intelligence</span>
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Spin keyframe + mobile overrides injected once */}
                    <style>{`
                        @keyframes spin { to { transform: rotate(360deg); } }
                        @media (max-width: 480px) {
                            .search-modal-card { border-radius: 12px !important; }
                            .search-modal-footer { font-size: 10px !important; padding: 8px 12px !important; }
                        }
                    `}</style>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}

// ── Extracted to avoid inline hover state issues ──────────────────────────
function ResultButton({
    result,
    query,
    onClick,
    getIconForType,
}: {
    result: SearchResult;
    query: string;
    onClick: () => void;
    getIconForType: (t: string) => React.ReactNode;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                borderRadius: "12px",
                background: hovered ? "#f9fafb" : "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                transition: "background 0.15s ease",
            }}
        >
            {/* Type badge + date */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "2px 7px",
                    borderRadius: "6px",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#4b5563",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}>
                    {getIconForType(result.type)}
                    {result.type}
                </span>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, marginLeft: "auto" }}>
                    {result.date}
                </span>
            </div>

            {/* Title */}
            <span style={{
                fontSize: "15px",
                fontWeight: 600,
                color: hovered ? "#00A651" : "#18181b",
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                transition: "color 0.15s ease",
            }}>
                <HighlightedText text={result.title} query={query} />
            </span>

            {/* Excerpt */}
            {result.excerpt && (
                <span style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    marginTop: "2px",
                }}>
                    <HighlightedText text={result.excerpt} query={query} />
                </span>
            )}
        </button>
    );
}