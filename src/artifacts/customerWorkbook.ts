import * as XLSX from "xlsx";
import type { GameState } from "../state";

/**
 * Generates CUSTOMER_OPERATIONS_Q3.xls (legacy BIFF8 binary format — no
 * OOXML/zip) and triggers a browser download. Content is authored/deterministic
 * for the MVP rather than derived from live game state.
 */
export function generateCustomerWorkbook(_state: GameState): void {
  const wb = XLSX.utils.book_new();

  const summary = XLSX.utils.aoa_to_sheet([
    ["Metric", "JUN", "JUL", "AUG"],
    ["Complaints", 8192, 9440, 13821],
    ["Refund Requests", 2104, 2882, 4910],
    ["Wait Minutes", 18.2, 27.4, 46.1],
    ["Customer Satisfaction", 81.4, 74.8, 62.1],
    ["Churn", "3.1%", "3.8%", "6.7%"],
  ]);
  XLSX.utils.book_append_sheet(wb, summary, "Summary");

  const regional = XLSX.utils.aoa_to_sheet([
    ["Region", "JUN Complaints", "JUL Complaints", "AUG Complaints", "AUG Churn"],
    ["Region 1", 1820, 1994, 2301, "3.9%"],
    ["Region 2", 1704, 1889, 2115, "4.1%"],
    ["Region 3", 2210, 2560, 3390, "5.8%"],
    ["Region 4", 2458, 2997, 6015, "11.7%"],
  ]);
  XLSX.utils.book_append_sheet(wb, regional, "Regional");

  const notes = XLSX.utils.aoa_to_sheet([
    ["Analyst Notes"],
    ["Region 4 support-cost variance is the largest of any region this quarter."],
    ["Region 4 also shows the sharpest complaint and churn increase; cause not yet attributed."],
    ["Manual account review step for Region 4 was suspended at the start of the quarter."],
  ]);
  XLSX.utils.book_append_sheet(wb, notes, "Notes");

  XLSX.writeFile(wb, "CUSTOMER_OPERATIONS_Q3.xls", { bookType: "biff8" });
}
