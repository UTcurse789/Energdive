import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
        return new NextResponse("Missing token parameter", { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const accessUrl = `${appUrl}/membership-access?token=${encodeURIComponent(token)}`;

    try {
        const QRCode = await import("qrcode");
        // Generate PNG buffer — email clients universally support PNG unlike SVG
        const pngBuffer = await (QRCode as any).toBuffer(accessUrl, {
            type: "png",
            errorCorrectionLevel: "M",
            margin: 1,
            width: 360,
            color: {
                dark: "#111111",
                light: "#FFFFFF",
            },
        });

        return new NextResponse(pngBuffer, {
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error: unknown) {
        console.error("[MEMBERSHIP_QR]", error);
        return new NextResponse("Unable to generate QR code", { status: 500 });
    }
}
