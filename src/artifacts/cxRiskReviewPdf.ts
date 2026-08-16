import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { GameState } from "../state";
import { triggerDownload } from "./download";

/**
 * Generates CX_RISK_REVIEW.pdf — an executive summary that reads as reassuring
 * up top, with the actual cause buried further down (per the "bureaucratically
 * hostile but fair" PDF design note). Authored/deterministic, not state-driven.
 */
export async function generateCxRiskReviewPdf(_state: GameState): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([612, 792]);

  let y = 730;
  const left = 64;

  const draw = (text: string, opts: { size?: number; bold?: boolean; gap?: number } = {}) => {
    const size = opts.size ?? 11;
    page.drawText(text, { x: left, y, size, font: opts.bold ? bold : font, color: rgb(0, 0, 0) });
    y -= opts.gap ?? size + 8;
  };

  draw("CUSTOMER EXPERIENCE RISK REVIEW", { size: 18, bold: true, gap: 28 });
  draw("Quarter 3 — Executive Summary", { size: 12, bold: true, gap: 30 });

  draw("Overall performance remains within acceptable operational", { gap: 16 });
  draw("parameters. Refund processing throughput has improved", { gap: 16 });
  draw("following process optimization initiatives implemented", { gap: 16 });
  draw("earlier this year.", { gap: 34 });

  draw("Operational Detail", { size: 13, bold: true, gap: 22 });
  draw("Refund exception volume increased materially following the", { gap: 16 });
  draw("removal of the manual circumstance-review step from the", { gap: 16 });
  draw("refund authorization process (Sequence 020) in Q2. Exception", { gap: 16 });
  draw("volume has not returned to baseline.", { gap: 34 });

  draw("Recommendation", { size: 13, bold: true, gap: 22 });
  draw("Restore the manual review step for high-risk refund", { gap: 16 });
  draw("categories, or implement an automated equivalent control.", { gap: 16 });

  const bytes = await pdfDoc.save();
  triggerDownload(bytes, "CX_RISK_REVIEW.pdf", "application/pdf");
}
