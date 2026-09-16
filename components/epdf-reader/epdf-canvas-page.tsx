"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface EpdfCanvasPageProps {
    pdfDoc: any;
    pageNumber: number;
    scale: number;
    containerHeight?: number;
    containerWidth?: number;
    isSpread?: boolean;
    isRightPage?: boolean;
    className?: string;
    onPageClick?: () => void;
}

export function EpdfCanvasPage({
    pdfDoc,
    pageNumber,
    scale,
    containerHeight,
    containerWidth,
    isSpread = false,
    isRightPage = false,
    className = "",
    onPageClick,
}: EpdfCanvasPageProps) {
    const renderTaskRef = useRef<any>(null);
    const [rendering, setRendering] = useState<boolean>(true);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    useEffect(() => {
        let isCancelled = false;

        async function renderPage() {
            if (!pdfDoc || pageNumber < 1 || pageNumber > pdfDoc.numPages) return;

            try {
                // Cancel previous render task if still in progress
                if (renderTaskRef.current) {
                    try {
                        renderTaskRef.current.cancel();
                    } catch (e) {
                        // ignore cancellation error
                    }
                    renderTaskRef.current = null;
                }

                setRendering(true);
                const page = await pdfDoc.getPage(pageNumber);
                if (isCancelled) return;

                const unscaledViewport = page.getViewport({ scale: 1.0 });
                const pageRatio = unscaledViewport.height / unscaledViewport.width;

                const effectiveContainerHeight = Math.max(containerHeight || 800, 400);
                const effectiveContainerWidth = Math.max(containerWidth || 1000, 320);

                // Calculate base display dimensions to fit container with clearance for floating bottom bar
                let baseHeight = effectiveContainerHeight - 84;
                let baseWidth = baseHeight / pageRatio;

                // In spread mode, constrain to half the width
                if (isSpread) {
                    const maxHalfWidth = (effectiveContainerWidth - 56) / 2;
                    if (baseWidth > maxHalfWidth) {
                        baseWidth = maxHalfWidth;
                        baseHeight = baseWidth * pageRatio;
                    }
                } else {
                    const maxWidth = effectiveContainerWidth - 36;
                    if (baseWidth > maxWidth) {
                        baseWidth = maxWidth;
                        baseHeight = baseWidth * pageRatio;
                    }
                }

                // Apply user zoom scale
                const displayWidth = Math.max(Math.round(baseWidth * scale), 100);
                const displayHeight = Math.max(Math.round(baseHeight * scale), 140);
                setPageSize({ width: displayWidth, height: displayHeight });

                // Render at high resolution for crisp text & images
                const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2.0) : 1;
                
                // Create dedicated offscreen canvas
                const offscreenCanvas = document.createElement("canvas");
                offscreenCanvas.width = Math.round(displayWidth * dpr);
                offscreenCanvas.height = Math.round(displayHeight * dpr);

                const context = offscreenCanvas.getContext("2d");
                if (!context || isCancelled) return;

                const viewport = page.getViewport({
                    scale: (displayWidth * dpr) / unscaledViewport.width,
                });

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                const renderTask = page.render(renderContext);
                renderTaskRef.current = renderTask;

                await renderTask.promise;

                if (!isCancelled) {
                    const dataUrl = offscreenCanvas.toDataURL("image/jpeg", 0.94);
                    setImgSrc(dataUrl);
                    setRendering(false);

                    // Clean up offscreen canvas memory
                    offscreenCanvas.width = 0;
                    offscreenCanvas.height = 0;
                }
            } catch (err: any) {
                if (err?.name !== "RenderingCancelledException" && !isCancelled) {
                    console.error(`[EpdfCanvasPage] Failed to render page ${pageNumber}:`, err);
                    setRendering(false);
                }
            }
        }

        renderPage();

        return () => {
            isCancelled = true;
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch (e) {
                    // ignore cancellation
                }
            }
        };
    }, [pdfDoc, pageNumber, scale, containerHeight, containerWidth, isSpread]);

    // Spine and page boundary inner shadow styling for realistic print publication depth
    const spineOverlayStyle = isSpread
        ? isRightPage
            ? "after:absolute after:inset-y-0 after:left-0 after:w-5 after:bg-gradient-to-r after:from-black/12 after:to-transparent after:pointer-events-none"
            : "after:absolute after:inset-y-0 after:right-0 after:w-5 after:bg-gradient-to-l after:from-black/12 after:to-transparent after:pointer-events-none"
        : "";

    return (
        <div
            className={`relative flex items-center justify-center bg-white shadow-2xl shadow-neutral-400/35 border border-neutral-200/90 rounded-xs overflow-hidden select-none transition-all duration-300 ${spineOverlayStyle} ${className}`}
            style={{
                width: pageSize.width || "auto",
                height: pageSize.height || "auto",
                minWidth: pageSize.width ? `${pageSize.width}px` : "200px",
                minHeight: pageSize.height ? `${pageSize.height}px` : "300px",
            }}
            onClick={onPageClick}
        >
            {imgSrc ? (
                <img
                    src={imgSrc}
                    alt={`Page ${pageNumber}`}
                    className="block w-full h-full object-contain select-none animate-in fade-in duration-200"
                    draggable={false}
                />
            ) : null}

            {rendering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-xs z-10 transition-opacity">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[#059669] animate-spin" />
                        <Loader2 className="w-4 h-4 text-[#059669] absolute inset-0 m-auto" />
                    </div>
                    <span className="text-xs text-gray-500 font-sans tracking-wide font-medium mt-3">
                        Rendering Page {pageNumber}...
                    </span>
                </div>
            )}
        </div>
    );
}
