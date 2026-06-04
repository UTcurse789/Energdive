import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
    listSavedArticles,
    removeSavedArticleForUser,
    saveArticleForUser,
} from "@/lib/queries/saved-articles";

export const dynamic = "force-dynamic";

async function getIdentity() {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await currentUser();
    return {
        clerkId: userId,
        email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
    };
}

export async function GET() {
    try {
        const identity = await getIdentity();
        if (!identity) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const articles = await listSavedArticles(identity);
        return NextResponse.json({ articles });
    } catch (error) {
        console.error("[SAVED_ARTICLES_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const identity = await getIdentity();
        if (!identity) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const url = typeof body.url === "string" ? body.url.trim() : "";

        if (!title || !url) {
            return NextResponse.json(
                { error: "title and url are required" },
                { status: 400 }
            );
        }

        const article = await saveArticleForUser(identity, { title, url });
        return NextResponse.json({ article });
    } catch (error) {
        console.error("[SAVED_ARTICLES_POST]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const identity = await getIdentity();
        if (!identity) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const url = typeof body.url === "string" ? body.url.trim() : "";

        if (!url) {
            return NextResponse.json({ error: "url is required" }, { status: 400 });
        }

        const removed = await removeSavedArticleForUser(identity, url);
        return NextResponse.json({ removed });
    } catch (error) {
        console.error("[SAVED_ARTICLES_DELETE]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
