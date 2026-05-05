"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { Settings, LayoutDashboard, LogOut } from "lucide-react";

export function CustomUserMenu() {
    const { user } = useUser();
    const { signOut, openUserProfile } = useClerk();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        function handleEsc(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        if (open) {
            document.addEventListener("keydown", handleEsc);
        }
        return () => document.removeEventListener("keydown", handleEsc);
    }, [open]);

    if (!user) return null;

    const avatarUrl = user.imageUrl;
    const fullName = user.fullName || user.firstName || "User";
    const email = user.primaryEmailAddress?.emailAddress || "";

    return (
        <div ref={menuRef} className="relative">
            {/* Avatar trigger */}
            <button
                onClick={() => setOpen(!open)}
                className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[#00A651]/40 transition-all duration-200 focus:outline-none focus:ring-[#00A651]/60"
                aria-label="User menu"
            >
                <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User info header */}
                    <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-[#00A651]/20">
                                <img
                                    src={avatarUrl}
                                    alt={fullName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{fullName}</p>
                                <p className="text-[11px] text-gray-400 truncate">{email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                        <Link
                            href="/account"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A651] transition-colors"
                        >
                            <Settings className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Manage Account</span>
                        </Link>

                        <Link
                            href="/dashboard"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A651] transition-colors"
                        >
                            <LayoutDashboard className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Dashboard</span>
                        </Link>

                        <div className="border-t border-gray-100 my-1" />

                        <button
                            onClick={() => {
                                setOpen(false);
                                signOut({ redirectUrl: "/" });
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
