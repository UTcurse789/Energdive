"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import { useState, useEffect, useRef } from "react";
import { User, Mail, Shield, Link2, LogOut, ChevronRight, Check, Loader2, Trash2, AlertTriangle, X, Camera, Eye, ChevronDown } from "lucide-react";
import Link from "next/link";
import ImageCropModal from "@/components/account/image-crop-modal";

const DELETION_REASONS = [
    "I no longer use this service",
    "It is too expensive / not worth it",
    "I'm receiving too many emails",
    "I found a better alternative",
    "Privacy concerns",
    "Technical issues / bugs",
    "Other (please specify)",
];

export default function AccountPage() {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    /* Delete modal state */
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [deleteReason, setDeleteReason] = useState("");
    const [deleteOtherReason, setDeleteOtherReason] = useState("");
    const [reasonDropdownOpen, setReasonDropdownOpen] = useState(false);
    const reasonDropdownRef = useRef<HTMLDivElement>(null);

    /* Image upload state */
    const [uploadingImage, setUploadingImage] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [showViewImage, setShowViewImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize form when user loads
    useEffect(() => {
        if (isLoaded && user) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
        }
    }, [isLoaded, user]);

    // Close reason dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (reasonDropdownRef.current && !reasonDropdownRef.current.contains(e.target as Node)) {
                setReasonDropdownOpen(false);
            }
        }
        if (reasonDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [reasonDropdownOpen]);

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
    const clerkFullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ");
    const fullName = clerkFullName || `${firstName} ${lastName}`.trim() || email.split("@")[0] || "User";

    const connectedAccounts = user.externalAccounts || [];
    const hasCustomImage = !!user.hasImage;
    // Request high-res avatar from Clerk (default can be low-res)
    const avatarHiRes = avatarUrl ? `${avatarUrl}?width=256&height=256&quality=100` : avatarUrl;
    const avatarFullRes = avatarUrl ? `${avatarUrl}?width=1024&height=1024&quality=100` : avatarUrl;

    // When user picks a file, read it and open the crop modal
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert("Image must be under 10MB.");
            return;
        }

        // Read as data URL and open crop modal
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Called by crop modal with the final cropped blob
    const handleCroppedUpload = async (blob: Blob) => {
        setUploadingImage(true);
        try {
            const file = new File([blob], "profile.png", { type: "image/png" });
            await user.setProfileImage({ file });
            setCropImageSrc(null);
        } catch (err) {
            console.error("Failed to upload image:", err);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = async () => {
        setUploadingImage(true);
        try {
            await user.setProfileImage({ file: null });
        } catch (err) {
            console.error("Failed to remove image:", err);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            // 1. Update Clerk
            await user.update({
                firstName,
                lastName,
            });

            // 2. Also update our DB
            await fetch("/api/user/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName }),
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Failed to update profile:", err);
        }
        setSaving(false);
    };

    const isDeleteReady =
        deleteConfirmText === "DELETE" &&
        deleteReason !== "" &&
        (deleteReason !== "Other (please specify)" || deleteOtherReason.trim() !== "");

    const handleDeleteAccount = async () => {
        if (!isDeleteReady) return;
        setDeleting(true);
        setDeleteError("");

        try {
            const res = await fetch("/api/user/delete-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    confirmation: "DELETE",
                    reason: deleteReason,
                    otherReason: deleteReason === "Other (please specify)" ? deleteOtherReason.trim() : undefined,
                }),
            });
            const data = await res.json();

            if (data.success) {
                // Clerk user is deleted server-side, sign out locally
                await signOut({ redirectUrl: "/" });
            } else {
                setDeleteError(data.error || "Failed to delete account.");
            }
        } catch (err) {
            console.error("Failed to delete account:", err);
            setDeleteError("Network error. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    const openDeleteModal = () => {
        setShowDeleteModal(true);
        setDeleteConfirmText("");
        setDeleteError("");
        setDeleteReason("");
        setDeleteOtherReason("");
        setReasonDropdownOpen(false);
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
                                    <div
                                        className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-[#00A651]/20 relative group cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <img src={avatarHiRes} alt={fullName} className="w-full h-full object-cover" />
                                        {uploadingImage ? (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">{fullName}</p>
                                    <p className="text-[11px] text-gray-400 truncate">{email}</p>
                                </div>

                                {/* Tabs */}
                                <div className="p-2">
                                    <button
                                        onClick={() => setActiveTab("profile")}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            activeTab === "profile"
                                                ? "bg-[#00A651]/10 text-[#00A651] shadow-sm"
                                                : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("security")}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            activeTab === "security"
                                                ? "bg-[#00A651]/10 text-[#00A651] shadow-sm"
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
                                            {/* Avatar with upload */}
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100 relative group cursor-pointer shrink-0"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <img src={avatarHiRes} alt={fullName} className="w-full h-full object-cover" />
                                                    {!hasCustomImage && (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                                                            <Camera className="w-5 h-5 text-gray-400" />
                                                            <span className="text-[8px] text-gray-400 font-medium mt-0.5 text-center leading-tight px-1">Add profile photo</span>
                                                        </div>
                                                    )}
                                                    {uploadingImage ? (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Camera className="w-5 h-5 text-white" />
                                                            <span className="text-[9px] text-white font-medium mt-0.5">Change</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                                                    <p className="text-xs text-gray-400 mb-2">Click the photo to upload a new image</p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                            className="text-xs font-semibold text-[#00A651] hover:text-[#009145] transition-colors"
                                                        >
                                                            Upload Photo
                                                        </button>
                                                        {hasCustomImage && (
                                                            <>
                                                                <span className="text-gray-300">|</span>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setShowViewImage(true); }}
                                                                    className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    View
                                                                </button>
                                                                <span className="text-gray-300">|</span>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                                                                    className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hidden file input */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />

                                            {/* Name fields */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                                        First Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={firstName}
                                                        readOnly
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-gray-50 cursor-not-allowed"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                                        Last Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={lastName}
                                                        readOnly
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-gray-50 cursor-not-allowed"
                                                    />
                                                </div>
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
                                                    <button
                                                        onClick={openDeleteModal}
                                                        className="text-xs font-bold text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                                                    >
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

            {/* ── Delete Account Confirmation Modal ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !deleting && setShowDeleteModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                            </div>
                            {!deleting && (
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                <p className="text-sm text-red-700 font-medium">
                                    This action is <strong>permanent and irreversible</strong>. All your data, membership, communities, and preferences will be permanently deleted.
                                </p>
                            </div>

                            {/* Reason Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for deletion <span className="text-red-500">*</span>
                                </label>
                                <div className="relative" ref={reasonDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setReasonDropdownOpen(!reasonDropdownOpen)}
                                        disabled={deleting}
                                        className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm transition-all duration-200 disabled:opacity-50 ${
                                            deleteReason
                                                ? "border-gray-300 text-gray-900"
                                                : "border-gray-200 text-gray-400"
                                        } ${reasonDropdownOpen ? "ring-2 ring-red-200 border-red-300" : "hover:border-gray-300"}`}
                                    >
                                        <span className={deleteReason ? "text-gray-900" : "text-gray-400"}>
                                            {deleteReason || "Select a reason…"}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${reasonDropdownOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {/* Dropdown Options */}
                                    {reasonDropdownOpen && (
                                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                            {DELETION_REASONS.map((reason) => (
                                                <button
                                                    key={reason}
                                                    type="button"
                                                    onClick={() => {
                                                        setDeleteReason(reason);
                                                        setReasonDropdownOpen(false);
                                                        if (reason !== "Other (please specify)") {
                                                            setDeleteOtherReason("");
                                                        }
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                                                        deleteReason === reason
                                                            ? "bg-red-50 text-red-700 font-medium"
                                                            : "text-gray-700 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <span>{reason}</span>
                                                    {deleteReason === reason && (
                                                        <Check className="w-4 h-4 text-red-600" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Other Reason Text Area (conditionally shown) */}
                            {deleteReason === "Other (please specify)" && (
                                <div className="overflow-hidden transition-all duration-300">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Please describe your reason
                                    </label>
                                    <textarea
                                        value={deleteOtherReason}
                                        onChange={(e) => setDeleteOtherReason(e.target.value)}
                                        placeholder="Tell us why you're leaving…"
                                        disabled={deleting}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all disabled:opacity-50 resize-none"
                                    />
                                </div>
                            )}

                            {/* Confirmation Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE here"
                                    disabled={deleting}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all disabled:opacity-50"
                                    autoFocus
                                />
                            </div>

                            {deleteError && (
                                <p className="text-sm text-red-600 font-medium">{deleteError}</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={!isDeleteReady || deleting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete My Account
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Image Crop Modal ── */}
            {cropImageSrc && (
                <ImageCropModal
                    imageSrc={cropImageSrc}
                    onCrop={handleCroppedUpload}
                    onClose={() => setCropImageSrc(null)}
                />
            )}

            {/* ── View Image Lightbox ── */}
            {showViewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowViewImage(false)}
                    />
                    <div className="relative max-w-md w-full">
                        <button
                            onClick={() => setShowViewImage(false)}
                            className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                        <img
                            src={avatarFullRes}
                            alt={fullName}
                            className="w-full rounded-2xl shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
