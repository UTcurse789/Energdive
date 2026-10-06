"use client";

import React from "react";
import { X, Keyboard, ArrowLeft, ArrowRight, Maximize2, Layers, BookOpen, ZoomIn, ZoomOut } from "lucide-react";

interface EpdfShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SHORTCUTS = [
    { key: "← / →", label: "Previous / Next Page", icon: ArrowRight },
    { key: "Space / PgDn", label: "Next Page", icon: ArrowRight },
    { key: "PgUp", label: "Previous Page", icon: ArrowLeft },
    { key: "Home / End", label: "First / Last Page", icon: Layers },
    { key: "+ / -", label: "Zoom In / Zoom Out", icon: ZoomIn },
    { key: "0", label: "Reset / Fit Zoom", icon: ZoomOut },
    { key: "F", label: "Toggle Fullscreen", icon: Maximize2 },
    { key: "T", label: "Toggle Page Thumbnails", icon: Layers },
    { key: "S", label: "Toggle 1-Page / 2-Page Spread", icon: BookOpen },
    { key: "?", label: "Show Keyboard Shortcuts", icon: Keyboard },
    { key: "Esc", label: "Close Drawer / Fullscreen", icon: X },
];

export function EpdfShortcutsModal({ isOpen, onClose }: EpdfShortcutsModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl text-gray-900 font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#059669]/10 text-[#059669] flex items-center justify-center">
                            <Keyboard className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Keyboard Shortcuts</h3>
                            <p className="text-xs text-gray-500">Navigate the ePDF edition seamlessly</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer"
                        aria-label="Close shortcuts modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {SHORTCUTS.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={idx}
                                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2.5 text-xs font-medium text-gray-700">
                                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{item.label}</span>
                                </div>
                                <kbd className="px-2 py-0.5 text-[11px] font-mono font-semibold text-gray-800 bg-gray-100 border border-gray-300/80 rounded-md shadow-xs">
                                    {item.key}
                                </kbd>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-5 pt-3 border-t border-gray-100 text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                        Got It
                    </button>
                </div>
            </div>
        </div>
    );
}
