import * as XLSX from "xlsx";
import type { GameState } from "../state";

/**
 * Generates BOARD_METRICS_Q3.xls — the same churn trend data the player has
 * already seen, but with the next month's value vandalized and replaced by
 * a riddle solvable purely from the visible trend (per the hacker/provenance
 * design note: the puzzle should be fair, not require outside knowledge).
 */
export function generateHermesIncidentWorkbook(_state: GameState): void {
  const wb = XLSX.utils.book_new();

  const summary = XLSX.utils.aoa_to_sheet([
    ["Metric", "JUN", "JUL", "AUG", "SEP"],
    ["Complaints", 8192, 9440, 13821, "?"],
    ["Churn", "3.1%", "3.8%", "6.7%", "?"],
  ]);
  XLSX.utils.book_append_sheet(wb, summary, "Summary");

  const hermes = XLSX.utils.aoa_to_sheet([
    ["THE NUMBER YOU SEEK IS NOT WRITTEN HERE."],
    [""],
    ["LOOK AT HOW FAR CHURN HAS ALREADY FALLEN"],
    ["BETWEEN THE LAST TWO MONTHS SHOWN."],
    [""],
    ["FALL THAT FAR AGAIN."],
    [""],
    ["-- H"],
  ]);
  XLSX.utils.book_append_sheet(wb, hermes, "HERMES");

  XLSX.writeFile(wb, "BOARD_METRICS_Q3.xls", { bookType: "biff8" });
}
