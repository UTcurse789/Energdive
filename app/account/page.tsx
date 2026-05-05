"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import { useState } from "react";
import { User, Mail, Shield, Link2, LogOut, ChevronRight, Check, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Initialize form when user loads
    if (isLoaded && user && !firstName && !lastName) {
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
    }

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="pt-32 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00A651]" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="pt-32 text-center">
                    <p className="text-gray-500">Please sign in to manage your account.</p>
                </div>
            </div>
        );
    }

    const email = user.primaryEmailAddress?.emailAddress || "";
    const avatarUrl = user.imageUrl;
    const fullName = user.fullName || `${firstName} ${lastName}`.trim() || "User";

    const connectedAccounts = user.externalAccounts || [];

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await user.update({
                firstName,
                lastName,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Failed to update profile:", err);
        }
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-28 pb-16 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                            <Link href="/" className="hover:text-[#00A651] transition-colors">Home</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-gray-600 font-medium">Account</span>
                        </nav>
                        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                        <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Sidebar */}
                        <div className="lg:w-56 shrink-0">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* User card */}
                                <div className="p-5 border-b border-gray-100 text-center">
                                    <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-[#00A651]/20">
                                        <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">{fullName}</p>
                                    <p className="text-[11px] text-gray-400 truncate">{email}</p>
                                </div>

                                {/* Tabs */}
                                <div className="p-2">
                                    <button
                                        onClick={() => setActiveTab("profile")}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            activeTab === "profile"
                                                ? "bg-[#00A651]/10 text-[#00A651]"
                                                : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("security")}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            activeTab === "security"
                                                ? "bg-[#00A651]/10 text-[#00A651]"
                                                : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        <Shield className="w-4 h-4" />
                                        Security
                                    </button>
                                </div>

                                {/* Sign out */}
                                <div className="p-2 border-t border-gray-100">
                                    <button
                                        onClick={() => signOut({ redirectUrl: "/" })}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                            {activeTab === "profile" && (
                                <div className="space-y-6">
                                    {/* Profile Details */}
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                                        <div className="px-6 py-5 border-b border-gray-100">
                                            <h2 className="text-lg font-bold text-gray-900">Profile Details</h2>
                                            <p className="text-sm text-gray-400 mt-0.5">Update your personal information</p>
                                        </div>
                                        <div className="p-6 space-y-5">
                                            {/* Avatar */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-100">
                                                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                                                    <p className="text-xs text-gray-400">Profile photo synced from your connected account</p>
                                                </div>
                                            </div>

                                            {/* Name fields */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                                        First Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                                        Last Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Save button */}
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={saving}
                                                    className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009145] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
                                                >
                                                    {saving ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : saved ? (
                                                        <>
                                                            <Check className="w-4 h-4" />
                                                            Saved!
                                                        </>
                                                    ) : (
                                                        "Save Changes"
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Email Addresses */}
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                                        <div className="px-6 py-5 border-b border-gray-100">
                                            <h2 className="text-lg font-bold text-gray-900">Email Addresses</h2>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900 font-medium">{email}</span>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#00A651]/10 text-[#00A651] px-2.5 py-1 rounded-full">
                                                    Primary
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connected Accounts */}
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                                        <div className="px-6 py-5 border-b border-gray-100">
                                            <h2 className="text-lg font-bold text-gray-900">Connected Accounts</h2>
                                        </div>
                                        <div className="p-6">
                                            {connectedAccounts.length > 0 ? (
                                                <div className="space-y-3">
                                                    {connectedAccounts.map((account: any) => (
                                                        <div key={account.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <Link2 className="w-4 h-4 text-gray-400" />
                                                                <div>
                                                                    <span className="text-sm font-medium text-gray-900 capitalize">{account.provider || "Account"}</span>
                                                                    {account.emailAddress && (
                                                                        <span className="text-xs text-gray-400 ml-2">• {account.emailAddress}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                                                Connected
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400">No connected accounts.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "security" && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                                        <div className="px-6 py-5 border-b border-gray-100">
                                            <h2 className="text-lg font-bold text-gray-900">Security</h2>
                                            <p className="text-sm text-gray-400 mt-0.5">Manage your account security settings</p>
                                        </div>
                                        <div className="p-6 space-y-5">
                                            {/* Password */}
                                            <div className="flex items-center justify-between py-4 px-5 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">Password</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {user.passwordEnabled
                                                            ? "You have a password set"
                                                            : "No password set — you sign in via connected accounts"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Two-Factor */}
                                            <div className="flex items-center justify-between py-4 px-5 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {user.twoFactorEnabled
                                                            ? "2FA is enabled on your account"
                                                            : "Add an extra layer of security to your account"}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                                    user.twoFactorEnabled
                                                        ? "bg-[#00A651]/10 text-[#00A651]"
                                                        : "bg-amber-50 text-amber-600"
                                                }`}>
                                                    {user.twoFactorEnabled ? "Enabled" : "Not Set"}
                                                </span>
                                            </div>

                                            {/* Active Sessions */}
                                            <div className="flex items-center justify-between py-4 px-5 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">Active Sessions</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Manage devices where you&apos;re signed in</p>
                                                </div>
                                            </div>

                                            {/* Danger Zone */}
                                            <div className="pt-4 border-t border-gray-100">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3">Danger Zone</h3>
                                                <div className="flex items-center justify-between py-4 px-5 bg-red-50 rounded-lg border border-red-100">
                                                    <div>
                                                        <p className="text-sm font-semibold text-red-700">Delete Account</p>
                                                        <p className="text-xs text-red-400 mt-0.5">Permanently delete your account and all data</p>
                                                    </div>
                                                    <button className="text-xs font-bold text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
