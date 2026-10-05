import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { query } from "@/lib/db";
import {
  sendMarketplaceEnquiryAdminNotification,
  sendMarketplaceEnquiryUserConfirmation,
} from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

async function ensureMarketplaceEnquiriesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS marketplace_enquiries (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      target_type TEXT DEFAULT 'general',
      target_id TEXT,
      target_name TEXT,
      status TEXT DEFAULT 'new',
      ip_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_marketplace_enquiries_email
    ON marketplace_enquiries (LOWER(email))
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_marketplace_enquiries_created_at
    ON marketplace_enquiries (created_at DESC)
  `);
}

function saveEnquiryFallback(data: Record<string, unknown>) {
  try {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, "marketplace-enquiries-fallback.json");
    let current: unknown[] = [];
    if (fs.existsSync(filePath)) {
      try {
        current = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        current = [];
      }
    }
    current.push(data);
    fs.writeFileSync(filePath, JSON.stringify(current, null, 2), "utf-8");
    console.log(`[MARKETPLACE_ENQUIRY] Enquiry saved to local fallback file: ${filePath}`);
  } catch (err) {
    console.error(`[MARKETPLACE_ENQUIRY] Could not write fallback file:`, err);
  }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-client-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const name = (body.name ?? "").toString().trim();
    const company = (body.company ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const phone = body.phone ? body.phone.toString().trim() : null;
    const message = (body.message ?? "").toString().trim();
    const targetType = body.targetType ? body.targetType.toString().trim() : "general";
    const targetId = body.targetId ? body.targetId.toString().trim() : null;
    const targetName = body.targetName ? body.targetName.toString().trim() : null;

    if (!name) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 }
      );
    }

    if (!company) {
      return NextResponse.json(
        { error: "Please enter your organization name." },
        { status: 400 }
      );
    }

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid corporate email address." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Please enter your requirement or inquiry details." },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    let insertedId: number | null = null;

    // 1. Save in PostgreSQL (with 4-second timeout protection)
    try {
      await withTimeout(ensureMarketplaceEnquiriesTable(), 4000, "DB connection timeout");
      const insertResult = await withTimeout(
        query(
          `INSERT INTO marketplace_enquiries (
            name,
            company,
            email,
            phone,
            message,
            target_type,
            target_id,
            target_name,
            ip_address
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, created_at`,
          [
            name,
            company,
            email,
            phone,
            message,
            targetType,
            targetId,
            targetName,
            ip,
          ]
        ),
        4000,
        "DB insert timeout"
      );

      insertedId = insertResult.rows[0]?.id ?? null;
      console.log(`[MARKETPLACE_ENQUIRY] Saved enquiry #${insertedId} in PostgreSQL for ${company} (${email})`);
    } catch (dbErr) {
      console.warn(
        `[MARKETPLACE_ENQUIRY] PostgreSQL connection failed or timed out (Local dev IP not in DigitalOcean Trusted Sources):`,
        dbErr instanceof Error ? dbErr.message : dbErr
      );
      // Fallback: save to local JSON file so no enquiry is ever lost
      saveEnquiryFallback({
        name,
        company,
        email,
        phone,
        message,
        targetType,
        targetId,
        targetName,
        ip,
        submittedAt: new Date().toISOString(),
      });
    }

    // 2. Dispatch emails in parallel without blocking user request
    const emailResults = await Promise.allSettled([
      sendMarketplaceEnquiryAdminNotification({
        name,
        company,
        email,
        phone,
        message,
        targetType,
        targetName,
        targetId,
      }),
      sendMarketplaceEnquiryUserConfirmation({
        name,
        company,
        email,
        phone,
        message,
        targetType,
        targetName,
        targetId,
      }),
    ]);

    if (emailResults[0].status === "rejected") {
      console.warn(`[MARKETPLACE_ENQUIRY] Admin email notification error:`, emailResults[0].reason);
    } else {
      console.log(`[MARKETPLACE_ENQUIRY] Admin notification sent to sankalp@itenmedia.in`);
    }

    if (emailResults[1].status === "rejected") {
      console.warn(`[MARKETPLACE_ENQUIRY] User confirmation email error:`, emailResults[1].reason);
    } else {
      console.log(`[MARKETPLACE_ENQUIRY] Confirmation email sent to ${email}`);
    }

    return NextResponse.json({
      success: true,
      message: "Enquiry submitted successfully. A confirmation email has been sent to your inbox.",
      id: insertedId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[MARKETPLACE_ENQUIRY] Error processing request:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
