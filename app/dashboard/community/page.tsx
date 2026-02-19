"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
    MessageSquare, Send, Loader2, Trash2, ChevronDown, ChevronUp,
    Users, Clock, Plus, X,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-shell";
import { useUser } from "@clerk/nextjs";

/* ── Types ─────────────────────────────────────────────────────── */
interface Post {
    id: number;
    communityId: number;
    clerkUserId: string;
    authorName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    commentCount: number;
}

interface Comment {
    id: number;
    postId: number;
    clerkUserId: string;
    authorName: string;
    content: string;
    createdAt: string;
}

/* ── Helpers ────────────────────────────────────────────────────── */
function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function initials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

const AVATAR_COLORS = [
    "#C9A84C", "#4CAF50", "#2196F3", "#FF5722", "#9C27B0",
    "#00BCD4", "#FF9800", "#E91E63", "#607D8B", "#795548",
];
function avatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function CommunityPage() {
    const { profile, feedKey } = useDashboard();
    const { user } = useUser();
    const communities = profile.communities || [];

    // Dynamic tabs
    const tabs = communities.map((c) => ({
        id: c.community_id,
        label: c.community_name,
    }));

    const [activeTab, setActiveTab] = useState<number | null>(tabs[0]?.id ?? null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [posting, setPosting] = useState(false);

    // Auto-select first tab when communities change
    useEffect(() => {
        if (tabs.length > 0 && (activeTab === null || !tabs.find((t) => t.id === activeTab))) {
            setActiveTab(tabs[0].id);
        }
    }, [communities]);

    // Fetch posts (with polling for real-time)
    const fetchPosts = useCallback(async () => {
        if (!activeTab) return;
        try {
            const res = await fetch(`/api/community/posts?communityId=${activeTab}&pageSize=50`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setPosts(data.posts || []);
        } catch (err) {
            console.error("Posts fetch error:", err);
        }
    }, [activeTab]);

    // Initial fetch + poll every 3s
    useEffect(() => {
        if (!activeTab) return;
        setLoading(true);
        fetchPosts().finally(() => setLoading(false));

        const interval = setInterval(fetchPosts, 3000);
        return () => clearInterval(interval);
    }, [activeTab, fetchPosts, feedKey]);

    // Create post
    async function handlePost() {
        if (!newPost.trim() || !activeTab || posting) return;
        setPosting(true);
        try {
            const res = await fetch("/api/community/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ communityId: activeTab, content: newPost.trim() }),
            });
            if (res.ok) {
                setNewPost("");
                await fetchPosts();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPosting(false);
        }
    }

    // Delete post
    async function handleDelete(postId: number) {
        try {
            await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
            await fetchPosts();
        } catch (err) {
            console.error(err);
        }
    }

    const currentUserId = user?.id || "";
    const activeComm = tabs.find((t) => t.id === activeTab);
    const cardStyle = { background: "var(--dash-card)", border: "1px solid var(--dash-border)" };

    if (tabs.length === 0) {
        return (
            <div className="animate-fade-in-up">
                <div className="rounded-xl p-12 text-center" style={cardStyle}>
                    <Users size={40} className="mx-auto mb-4" style={{ color: "var(--dash-border)" }} />
                    <h2 className="text-lg font-bold mb-2" style={{ color: "var(--dash-text)" }}>No Communities Selected</h2>
                    <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                        Select communities from your dashboard to start discussions.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="mb-7">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg" style={{ background: "rgba(201,168,76,0.15)" }}>
                        <MessageSquare size={22} style={{ color: "var(--dash-accent)" }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--dash-text)" }}>
                            Community Discussions
                        </h1>
                        <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                            Connect and discuss with professionals in your sectors
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div
                className="flex items-center gap-1 p-1.5 rounded-xl mb-7 overflow-x-auto"
                style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)", scrollbarWidth: "none" }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                        style={
                            activeTab === tab.id
                                ? { background: "var(--dash-accent)", color: "#0A0A0B", boxShadow: "0 2px 8px rgba(201,168,76,0.3)" }
                                : { color: "var(--dash-text-muted)" }
                        }
                    >
                        <Users size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* New Post Box */}
            <div className="rounded-xl p-5 mb-6 shadow-sm" style={cardStyle}>
                <div className="flex items-start gap-3">
                    {/* User avatar */}
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: avatarColor(profile.first_name || "U"), color: "#fff" }}
                    >
                        {initials(profile.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "U")}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost(); }
                            }}
                            placeholder={`Share something with ${activeComm?.label || "your community"}...`}
                            rows={3}
                            className="w-full resize-none rounded-lg px-4 py-3 text-sm outline-none placeholder:text-[var(--dash-text-dim)]"
                            style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border-subtle)", color: "var(--dash-text)" }}
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={handlePost}
                                disabled={!newPost.trim() || posting}
                                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
                                style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                            >
                                {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                {posting ? "Posting..." : "Post"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts Feed */}
            {loading ? (
                <div className="flex flex-col items-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: "var(--dash-accent)" }} />
                    <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>Loading discussions...</p>
                </div>
            ) : posts.length === 0 ? (
                <div className="rounded-xl p-12 text-center" style={cardStyle}>
                    <MessageSquare size={32} className="mx-auto mb-3" style={{ color: "var(--dash-border)" }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--dash-text-muted)" }}>
                        No discussions yet
                    </p>
                    <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>
                        Be the first to start a conversation in {activeComm?.label}!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isOwner={post.clerkUserId === currentUserId}
                            onDelete={() => handleDelete(post.id)}
                        />
                    ))}
                </div>
            )}

            {/* Real-time indicator */}
            {!loading && (
                <div className="flex items-center justify-center gap-2 mt-6 py-3">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4CAF50" }} />
                    <span className="text-[11px]" style={{ color: "var(--dash-text-dim)" }}>Live — updates every 3 seconds</span>
                </div>
            )}
        </div>
    );
}

/* ── PostCard with inline comments ─────────────────────────────── */
function PostCard({
    post,
    isOwner,
    onDelete,
}: {
    post: Post;
    isOwner: boolean;
    onDelete: () => void;
}) {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [posting, setPosting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    async function fetchComments() {
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/community/posts/${post.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    }

    function toggleComments() {
        const nextState = !showComments;
        setShowComments(nextState);
        if (nextState) fetchComments();
    }

    async function handleComment() {
        if (!newComment.trim() || posting) return;
        setPosting(true);
        try {
            const res = await fetch(`/api/community/posts/${post.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment.trim() }),
            });
            if (res.ok) {
                setNewComment("");
                await fetchComments();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPosting(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        await onDelete();
        setDeleting(false);
    }

    const bg = avatarColor(post.authorName);

    return (
        <div
            className="rounded-xl p-5 shadow-sm transition-all hover:shadow-md group"
            style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)" }}
        >
            {/* Author Row */}
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: bg, color: "#fff" }}
                >
                    {initials(post.authorName)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "var(--dash-text)" }}>{post.authorName}</p>
                    <p className="text-[10px] flex items-center gap-1" style={{ color: "var(--dash-text-dim)" }}>
                        <Clock size={9} /> {timeAgo(post.createdAt)}
                    </p>
                </div>
                {isOwner && (
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
                        style={{ color: "var(--dash-text-dim)" }}
                        title="Delete post"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="mb-4 pl-12">
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--dash-text)" }}>
                    {post.content}
                </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-4 pl-12" style={{ borderTop: "1px solid var(--dash-border-subtle)", paddingTop: "12px" }}>
                <button
                    onClick={toggleComments}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    style={{ color: showComments ? "var(--dash-accent)" : "var(--dash-text-dim)" }}
                >
                    <MessageSquare size={13} />
                    {post.commentCount} {post.commentCount === 1 ? "Reply" : "Replies"}
                    {showComments ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>

                <button
                    onClick={() => { setShowComments(true); if (!showComments) fetchComments(); setTimeout(() => inputRef.current?.focus(), 100); }}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    style={{ color: "var(--dash-text-dim)" }}
                >
                    <Send size={11} /> Reply
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pl-12 space-y-3">
                    {loadingComments ? (
                        <div className="flex items-center gap-2 py-3">
                            <Loader2 size={13} className="animate-spin" style={{ color: "var(--dash-accent)" }} />
                            <span className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Loading replies...</span>
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-xs py-2" style={{ color: "var(--dash-text-dim)" }}>No replies yet. Be the first!</p>
                    ) : (
                        comments.map((c) => (
                            <div key={c.id} className="flex gap-2.5 py-2" style={{ borderTop: "1px solid var(--dash-border-subtle)" }}>
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                                    style={{ background: avatarColor(c.authorName), color: "#fff" }}
                                >
                                    {initials(c.authorName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-bold" style={{ color: "var(--dash-text)" }}>{c.authorName}</span>
                                        <span className="text-[10px]" style={{ color: "var(--dash-text-dim)" }}>{timeAgo(c.createdAt)}</span>
                                    </div>
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--dash-text-muted)" }}>
                                        {c.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Add comment */}
                    <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--dash-border-subtle)" }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
                            placeholder="Write a reply..."
                            className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                            style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border-subtle)", color: "var(--dash-text)" }}
                        />
                        <button
                            onClick={handleComment}
                            disabled={!newComment.trim() || posting}
                            className="p-2 rounded-lg transition-all disabled:opacity-40"
                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                        >
                            {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
