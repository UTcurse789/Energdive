"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Check, RotateCcw, Loader2 } from "lucide-react";

interface ImageCropModalProps {
    imageSrc: string;
    onCrop: (croppedBlob: Blob) => Promise<void>;
    onClose: () => void;
}

/**
 * Circular image cropper with drag-to-pan and zoom slider.
 * Outputs a 512×512 cropped PNG blob.
 */
export default function ImageCropModal({ imageSrc, onCrop, onClose }: ImageCropModalProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [saving, setSaving] = useState(false);
    const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
    const [baseScale, setBaseScale] = useState(1);

    const CONTAINER_SIZE = 300; // crop area size in pixels
    const OUTPUT_SIZE = 512;    // final output resolution

    // When image loads, compute the base scale to cover the crop circle
    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        // Scale so the smaller dimension fills the crop area
        const scale = Math.max(CONTAINER_SIZE / img.naturalWidth, CONTAINER_SIZE / img.naturalHeight);
        setBaseScale(scale);
        setPosition({ x: 0, y: 0 });
        setZoom(1);
    }, []);

    // Computed display dimensions
    const displayW = naturalSize.w * baseScale * zoom;
    const displayH = naturalSize.h * baseScale * zoom;

    // The image's top-left in container coordinates:
    // Center of container is (CONTAINER_SIZE/2, CONTAINER_SIZE/2)
    // Image center = container center + position offset
    const imgLeft = (CONTAINER_SIZE - displayW) / 2 + position.x;
    const imgTop = (CONTAINER_SIZE - displayH) / 2 + position.y;

    // ── Mouse drag ──
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }, [dragging, dragStart]);

    const handleMouseUp = useCallback(() => setDragging(false), []);

    // ── Touch drag ──
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const t = e.touches[0];
            setDragging(true);
            setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
        }
    }, [position]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!dragging || e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        setPosition({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
    }, [dragging, dragStart]);

    const handleTouchEnd = useCallback(() => setDragging(false), []);

    // ── Crop logic ──
    const handleCrop = useCallback(async () => {
        if (naturalSize.w === 0) return;
        setSaving(true);

        try {
            // Load original image for canvas drawing
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = imageSrc;
            });

            const canvas = document.createElement("canvas");
            canvas.width = OUTPUT_SIZE;
            canvas.height = OUTPUT_SIZE;
            const ctx = canvas.getContext("2d")!;

            // The crop circle covers the full CONTAINER_SIZE area.
            // We need to figure out what part of the original image maps to this area.
            //
            // In the display:
            //   Image is at (imgLeft, imgTop) with size (displayW × displayH)
            //   Crop circle is at (0, 0) with size (CONTAINER_SIZE × CONTAINER_SIZE)
            //
            // So the crop rectangle in display coords starts at (0,0) and is CONTAINER_SIZE wide.
            // In image-local display coords: the crop top-left is at (-imgLeft, -imgTop)
            //
            // To get original image pixel coords, divide by (displayW / naturalWidth):
            const scaleX = img.naturalWidth / displayW;
            const scaleY = img.naturalHeight / displayH;

            const srcX = -imgLeft * scaleX;
            const srcY = -imgTop * scaleY;
            const srcW = CONTAINER_SIZE * scaleX;
            const srcH = CONTAINER_SIZE * scaleY;

            // Clip to circle
            ctx.beginPath();
            ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            // Draw the source region into the full output canvas
            ctx.drawImage(
                img,
                srcX, srcY, srcW, srcH,
                0, 0, OUTPUT_SIZE, OUTPUT_SIZE
            );

            canvas.toBlob(async (blob) => {
                if (blob) {
                    await onCrop(blob);
                }
                setSaving(false);
            }, "image/png", 1);
        } catch (err) {
            console.error("Crop failed:", err);
            setSaving(false);
        }
    }, [naturalSize, displayW, displayH, imgLeft, imgTop, imageSrc, onCrop]);

    const handleReset = () => {
        setPosition({ x: 0, y: 0 });
        setZoom(1);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!saving ? onClose : undefined} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Crop Profile Photo</h3>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Crop Area */}
                <div className="flex items-center justify-center bg-neutral-900 py-6 px-4">
                    <div
                        ref={containerRef}
                        className="relative overflow-hidden"
                        style={{
                            width: CONTAINER_SIZE,
                            height: CONTAINER_SIZE,
                            borderRadius: "50%",
                            cursor: dragging ? "grabbing" : "grab",
                            touchAction: "none",
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* The image — positioned absolutely, user drags it */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageSrc}
                            alt="Crop preview"
                            draggable={false}
                            onLoad={handleImageLoad}
                            className="absolute pointer-events-none select-none"
                            style={{
                                left: imgLeft,
                                top: imgTop,
                                width: displayW || "auto",
                                height: displayH || "auto",
                                maxWidth: "none",
                            }}
                        />

                        {/* Dashed circle border overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                borderRadius: "50%",
                                boxShadow: "0 0 0 2px rgba(255,255,255,0.6)",
                            }}
                        />
                    </div>
                </div>

                {/* Outer shadow hint — shows that it's circular */}
                <div className="flex items-center justify-center bg-neutral-900 pb-2">
                    <p className="text-[11px] text-neutral-500">Drag to reposition • Scroll or use slider to zoom</p>
                </div>

                {/* Controls */}
                <div className="px-6 py-4 space-y-4 border-t border-gray-100">
                    {/* Zoom slider */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Zoom out"
                        >
                            <ZoomOut className="w-4 h-4 text-gray-500" />
                        </button>
                        <input
                            type="range"
                            min={0.5}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#00A651]"
                        />
                        <button
                            onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Zoom in"
                        >
                            <ZoomIn className="w-4 h-4 text-gray-500" />
                        </button>
                        <span className="text-xs text-gray-400 font-mono w-10 text-right">
                            {Math.round(zoom * 100)}%
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleReset}
                            disabled={saving}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCrop}
                                disabled={saving || naturalSize.w === 0}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#00A651] hover:bg-[#009145] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Save Photo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
