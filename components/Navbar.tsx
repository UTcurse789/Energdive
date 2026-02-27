"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { GlobalSearch } from "./global-search";

export function Navbar() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <nav className="relative w-full border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between z-50">
            <div className="font-bold text-xl">EnergDive</div>

            {/* Search Trigger Button */}
            <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
                <Search className="w-4 h-4" />
                <span>Search...</span>
                <kbd className="hidden sm:inline-block ml-4 px-1.5 py-0.5 text-[10px] font-semibold bg-white rounded border border-gray-300">⌘K</kbd>
            </button>

            {/* Render the Modal component */}
            <GlobalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </nav>
    );
}