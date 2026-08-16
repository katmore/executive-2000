import type { GameState } from "../state";
import { triggerDownload } from "./download";

function rtfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function rtfPara(text: string, bold = false): string {
  const escaped = rtfEscape(text);
  return bold ? `{\\b ${escaped}}\\par\n` : `${escaped}\\par\n`;
}

/**
 * Generates CX_ACTION_PLAN_FINAL_v4.doc as real RTF content (not OOXML).
 * Legacy Word content-sniffs RTF regardless of the .doc extension, and many
 * period enterprise systems exported reports this way. Authored/deterministic.
 */
export function generateActionPlanDoc(_state: GameState): void {
  let body = "{\\rtf1\\ansi\\deff0\n";
  body += "{\\fonttbl{\\f0\\froman Times New Roman;}}\n";
  body += "\\f0\\fs24\n";
  body += rtfPara("Customer Experience Action Plan", true);
  body += rtfPara("Status: FINAL     Revision: 4", true);
  body += "\\par\n";
  body += rtfPara("Background", true);
  body += rtfPara("Refund exception and complaint volume has increased since Q2.");
  body += "\\par\n";
  body += rtfPara("Analysis", true);
  body += rtfPara("Churn increase appears attributable to the removal of manual account review in Q2.");
  body += "\\par\n";
  body += rtfPara("Recommendation", true);
  body += rtfPara("Evaluate resource alignment opportunities for refund authorization staffing.");
  body += "}";

  triggerDownload(new Blob([body], { type: "application/msword" }), "CX_ACTION_PLAN_FINAL_v4.doc");
}
