import { PDFDocument, rgb } from "pdf-lib";

export async function addIpWatermark(
  pdfBuffer: ArrayBuffer,
  ip: string
): Promise<Uint8Array> {
  if (!ip) return new Uint8Array(pdfBuffer);

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const watermarkText = ip;

    for (const page of pages) {
      const { height } = page.getSize();
      // Draw at the top left of each page
      page.drawText(watermarkText, {
        x: 10,
        y: height - 15,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error("[PDF_WATERMARK] Failed to add watermark to PDF:", error);
    // Return original if modification fails
    return new Uint8Array(pdfBuffer);
  }
}
