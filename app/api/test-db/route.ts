import { query } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/test-db
 * Health-check endpoint: tests DB connectivity and lists tables.
 */
export async function GET() {
    try {
        const result = await query("SELECT NOW() AS server_time");
        const tables = await query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        return NextResponse.json({
            status: "ok",
            serverTime: result.rows[0].server_time,
            tables: tables.rows.map((r) => r.table_name),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[TEST_DB]", message);
        return NextResponse.json(
            { status: "error", message },
            { status: 500 }
        );
    }
}
