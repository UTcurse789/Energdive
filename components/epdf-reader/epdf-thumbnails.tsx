"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Layers, Loader2, Search } from "lucide-react";

interface EpdfThumbnailsProps {
    isOpen: boolean;
    onClose: () => void;
    pdfDoc: any;
    totalPages: number;
    currentPage: number;
    onSelectPage: (pageNumber: number) => void;
}

function MiniThumbnail({
    pdfDoc,
    pageNumber,
    isActive,
    onSelect,
}: {
    pdfDoc: any;
    pageNumber: number;
    isActive: boolean;
    onSelect: () => void;
}) {
    const [imgSrc, setImgSrc] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        async function renderThumbnail() {
            if (!pdfDoc) return;

            try {
                const page = await pdfDoc.getPage(pageNumber);
                if (isCancelled) return;

                const viewport = page.getViewport({ scale: 0.28 });
                const offscreenCanvas = document.createElement("canvas");
                offscreenCanvas.width = viewport.width;
                offscreenCanvas.height = viewport.height;

                const context = offscreenCanvas.getContext("2d");
                if (!context || isCancelled) return;

                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                }).promise;

                if (!isCancelled) {
                    const dataUrl = offscreenCanvas.toDataURL("image/jpeg", 0.75);
                    setImgSrc(dataUrl);
                    offscreenCanvas.width = 0;
                    offscreenCanvas.height = 0;
                }
            } catch (e) {
                // Ignore render thumbnail errors
            }
        }

        renderThumbnail();
        return () => {
            isCancelled = true;
        };
    }, [pdfDoc, pageNumber]);

    return (
        <button
            onClick={onSelect}
            className={`group relative flex flex-col items-center p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer bg-white hover:bg-gray-50/80 shadow-2xs ${
                isActive
                    ? "border-[#059669] shadow-md shadow-[#059669]/15 ring-2 ring-[#059669]/30 scale-[1.02]"
                    : "border-gray-200 hover:border-gray-300 hover:scale-[1.01]"
            }`}
            aria-label={`Jump to page ${pageNumber}`}
        >
            <div className="relative w-full aspect-[1/1.414] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner">
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={`Page ${pageNumber}`}
                        className="w-full h-full object-contain select-none animate-in fade-in duration-200"
                        draggable={false}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500 gap-1">
                        <Loader2 className="w-4 h-4 animate-spin text-[#059669]" />
                        <span className="text-[10px] font-mono">{pageNumber}</span>
                    </div>
                )}
            </div>
            <div className="mt-2 flex items-center justify-between w-full px-1">
                <span
                    className={`text-xs font-sans font-medium transition-colors ${
                        isActive ? "text-[#059669] font-bold" : "text-gray-600 group-hover:text-gray-900"
                    }`}
                >
                    {pageNumber === 1 ? "Cover" : `Page ${pageNumber}`}
                </span>
                {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                )}
            </div>
        </button>
    );
}

export function EpdfThumbnails({
    isOpen,
    onClose,
    pdfDoc,
    totalPages,
    currentPage,
    onSelectPage,
}: EpdfThumbnailsProps) {
    const [searchFilter, setSearchFilter] = useState<string>("");
    const drawerRef = useRef<HTMLDivElement | null>(null);

    // Scroll active thumbnail into view when drawer opens
    useEffect(() => {
        if (isOpen && drawerRef.current) {
            const activeElem = drawerRef.current.querySelector("[data-active='true']");
            if (activeElem) {
                activeElem.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
        }
    }, [isOpen, currentPage]);

    if (!isOpen) return null;

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter((num) => {
        if (!searchFilter.trim()) return true;
        return String(num).includes(searchFilter.trim()) || (num === 1 && "cover".includes(searchFilter.toLowerCase()));
    });

    return (
        <aside
            ref={drawerRef}
            className="fixed inset-y-0 left-0 w-80 sm:w-96 bg-white/98 backdrop-blur-2xl border-r border-gray-200 z-50 flex flex-col text-gray-900 shadow-2xl shadow-gray-400/30 animate-in slide-in-from-left duration-300 font-sans"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#059669]/10 text-[#059669] flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">All Pages</h2>
                        <p className="text-[11px] text-gray-500">{totalPages} Pages in this Edition</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    aria-label="Close page drawer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Quick Search */}
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search page number..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669]"
                    />
                </div>
            </div>

            {/* Grid of Pages */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 bg-gray-50/40">
                {pageNumbers.map((num) => (
                    <div key={num} data-active={num === currentPage}>
                        <MiniThumbnail
                            pdfDoc={pdfDoc}
                            pageNumber={num}
                            isActive={num === currentPage}
                            onSelect={() => {
                                onSelectPage(num);
                                onClose();
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Footer Summary */}
            <div className="p-3 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-500">
                <span>Current: Page {currentPage}</span>
                <button
                    onClick={() => {
                        onSelectPage(1);
                        onClose();
                    }}
                    className="text-[#059669] hover:underline font-medium cursor-pointer"
                >
                    Jump to Cover
                </button>
            </div>
        </aside>
    );
}
