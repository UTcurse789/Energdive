/**
 * Generates a premium membership card PDF using pdf-lib.
 * Returns a base64-encoded PDF string for email attachment.
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

interface MembershipCardPdfData {
    memberName: string;
    company: string;
    community: string;
    membershipId: string;
    joinDate: string;
    qrImageUrl?: string | null;
}

// Gold: #D4AF37 → rgb(212/255, 175/255, 55/255)
const GOLD = rgb(212 / 255, 175 / 255, 55 / 255);
const WHITE = rgb(1, 1, 1);
const LIGHT_GRAY = rgb(0.85, 0.85, 0.85);
const DARK_BG = rgb(0.07, 0.07, 0.07);
const CARD_BG = rgb(0.09, 0.09, 0.09);
const MUTED = rgb(0.6, 0.6, 0.6);

/**
 * Try to fetch an image from a URL. Returns null on failure.
 */
async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        return new Uint8Array(buf);
    } catch {
        return null;
    }
}

/**
 * Try to read the EnergClub logo from the local public directory.
 */
function readLocalLogo(): Uint8Array | null {
    try {
        const logoPath = path.join(process.cwd(), "public", "energclub.png");
        if (fs.existsSync(logoPath)) {
            return new Uint8Array(fs.readFileSync(logoPath));
        }
    } catch { /* non-fatal */ }
    return null;
}

export async function generateMembershipCardPdf(
    data: MembershipCardPdfData
): Promise<string> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([600, 380]);

    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const fontMono = await doc.embedFont(StandardFonts.CourierBold);

    const W = 600;
    const H = 380;

    // ── Full-page dark background ──────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: DARK_BG });

    // ── Card body (inset with subtle border feel) ──────────────────
    const cardX = 20;
    const cardY = 20;
    const cardW = W - 40;
    const cardH = H - 40;

    // Gold border (slightly larger rect behind card)
    page.drawRectangle({
        x: cardX - 1, y: cardY - 1,
        width: cardW + 2, height: cardH + 2,
        color: GOLD, opacity: 0.5,
        borderWidth: 0,
    });
    // Card background
    page.drawRectangle({
        x: cardX, y: cardY,
        width: cardW, height: cardH,
        color: CARD_BG,
    });

    // ── Logo (try local file first) ────────────────────────────────
    let logoY = cardY + cardH - 55;
    const logoBytes = readLocalLogo();
    if (logoBytes) {
        try {
            const logoImage = await doc.embedPng(logoBytes);
            const logoDims = logoImage.scaleToFit(150, 60);
            page.drawImage(logoImage, {
                x: cardX + 24,
                y: logoY,
                width: logoDims.width,
                height: logoDims.height,
            });
        } catch {
            // Fallback: text logo
            page.drawText("ENERGClub", {
                x: cardX + 24, y: logoY + 10,
                font: fontBold, size: 20, color: WHITE,
            });
        }
    } else {
        page.drawText("ENERGClub", {
            x: cardX + 24, y: logoY + 10,
            font: fontBold, size: 20, color: WHITE,
        });
    }

    // "MEMBERSHIP CARD" label
    page.drawText("MEMBERSHIP CARD", {
        x: cardX + 24, y: logoY - 14,
        font: fontBold, size: 8, color: GOLD,
    });

    // ── ACTIVE badge ───────────────────────────────────────────────
    const badgeLabel = "ACTIVE";
    const badgeLabelWidth = fontBold.widthOfTextAtSize(badgeLabel, 9);
    const badgeTotalWidth = badgeLabelWidth + 16; // 16 for circle + spacing
    const badgeX = cardX + cardW - 24 - badgeTotalWidth;
    // Draw small gold circle as bullet
    page.drawCircle({
        x: badgeX + 4,
        y: logoY + 15,
        size: 3,
        color: GOLD,
    });
    page.drawText(badgeLabel, {
        x: badgeX + 14,
        y: logoY + 12,
        font: fontBold, size: 9, color: GOLD,
    });

    // ── Divider line ───────────────────────────────────────────────
    const divY = logoY - 28;
    page.drawRectangle({
        x: cardX + 24, y: divY,
        width: cardW - 48, height: 0.5,
        color: GOLD, opacity: 0.3,
    });

    // ── Left column: member details ────────────────────────────────
    const leftX = cardX + 24;
    let cy = divY - 20;

    // NAME label
    page.drawText("NAME", {
        x: leftX, y: cy, font: fontBold, size: 8, color: GOLD,
    });
    cy -= 16;
    page.drawText(data.memberName, {
        x: leftX, y: cy, font: fontBold, size: 16, color: WHITE,
    });

    cy -= 22;
    page.drawText("COMPANY", {
        x: leftX, y: cy, font: fontBold, size: 8, color: GOLD,
    });
    cy -= 14;
    page.drawText(data.company, {
        x: leftX, y: cy, font: fontRegular, size: 12, color: LIGHT_GRAY,
    });

    cy -= 20;
    page.drawText("COMMUNITY", {
        x: leftX, y: cy, font: fontBold, size: 8, color: GOLD,
    });
    cy -= 14;
    page.drawText(data.community, {
        x: leftX, y: cy, font: fontRegular, size: 12, color: LIGHT_GRAY,
    });

    // Verified pill
    cy -= 18;
    const verifiedText = "VERIFIED";
    const pillW = fontBold.widthOfTextAtSize(verifiedText, 7) + 14;
    page.drawRectangle({
        x: leftX, y: cy - 3, width: pillW, height: 14,
        color: GOLD, opacity: 0.9,
        borderWidth: 0,
    });
    page.drawText(verifiedText, {
        x: leftX + 7, y: cy, font: fontBold, size: 7, color: DARK_BG,
    });

    // Separator
    cy -= 22;
    page.drawRectangle({
        x: leftX, y: cy, width: 260, height: 0.5,
        color: GOLD, opacity: 0.25,
    });

    // MEMBERSHIP ID
    cy -= 18;
    page.drawText("MEMBERSHIP ID", {
        x: leftX, y: cy, font: fontBold, size: 8, color: GOLD,
    });
    cy -= 20;
    page.drawText(data.membershipId, {
        x: leftX, y: cy, font: fontMono, size: 18, color: GOLD,
    });

    // ── Right column: QR + date ────────────────────────────────────
    const rightX = cardX + 340;
    const qrBoxSize = 120;
    const qrY = divY - 20;

    // Try to embed QR image from base64 data URI or URL
    let qrEmbedded = false;
    if (data.qrImageUrl) {
        try {
            let qrBytes: Uint8Array | null = null;
            if (data.qrImageUrl.startsWith("data:image/png;base64,")) {
                // Decode from data URI
                const b64 = data.qrImageUrl.split(",")[1];
                qrBytes = new Uint8Array(Buffer.from(b64, "base64"));
            } else {
                qrBytes = await fetchImageBytes(data.qrImageUrl);
            }
            if (qrBytes) {
                const qrImage = await doc.embedPng(qrBytes);
                // White background for QR
                page.drawRectangle({
                    x: rightX, y: qrY - qrBoxSize,
                    width: qrBoxSize, height: qrBoxSize,
                    color: WHITE,
                    borderWidth: 0,
                });
                page.drawImage(qrImage, {
                    x: rightX + 8,
                    y: qrY - qrBoxSize + 8,
                    width: qrBoxSize - 16,
                    height: qrBoxSize - 16,
                });
                qrEmbedded = true;
            }
        } catch { /* non-fatal */ }
    }

    if (!qrEmbedded) {
        // QR placeholder
        page.drawRectangle({
            x: rightX, y: qrY - qrBoxSize,
            width: qrBoxSize, height: qrBoxSize,
            color: WHITE, opacity: 0.1,
            borderWidth: 1, borderColor: GOLD, borderOpacity: 0.3,
        });
        page.drawText("QR CODE", {
            x: rightX + 30, y: qrY - qrBoxSize / 2 - 5,
            font: fontBold, size: 12, color: MUTED,
        });
    }

    // "Scan for access" label
    page.drawText("Scan for dashboard access", {
        x: rightX, y: qrY - qrBoxSize - 16,
        font: fontRegular, size: 8, color: GOLD,
    });

    // Joining Date
    const dateY = qrY - qrBoxSize - 40;
    page.drawRectangle({
        x: rightX, y: dateY + 6, width: qrBoxSize, height: 0.5,
        color: GOLD, opacity: 0.25,
    });
    page.drawText("JOINING DATE", {
        x: rightX, y: dateY - 8,
        font: fontBold, size: 8, color: GOLD,
    });
    page.drawText(data.joinDate, {
        x: rightX, y: dateY - 24,
        font: fontBold, size: 14, color: WHITE,
    });

    // ── Serialize ──────────────────────────────────────────────────
    const pdfBytes = await doc.save();
    return Buffer.from(pdfBytes).toString("base64");
}
