"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Issue } from "@/types";
import { BookOpen } from "lucide-react";

const EpdfReader = dynamic(() => import("@/components/epdf-reader/epdf-reader"), {
    ssr: false,
    loading: () => (
        <main className="h-screen w-screen bg-[#F8F9FA] text-gray-900 flex flex-col items-center justify-center p-6 select-none font-sans">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-gray-200 border-t-[#059669] animate-spin" />
                    <BookOpen className="w-6 h-6 text-[#059669] absolute inset-0 m-auto" />
                </div>
                <div>
                    <h2 className="text-lg font-serif font-bold text-gray-900 tracking-tight">
                        Opening Digital Magazine Reader...
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-sans">
                        Preparing high-resolution ePDF edition
                    </p>
                </div>
            </div>
        </main>
    ),
});

export function EpdfReaderClient({ issue }: { issue: Issue }) {
    return <EpdfReader issue={issue} />;
}

export default EpdfReaderClient;
