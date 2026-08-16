import { generateCustomerWorkbook } from "../artifacts/customerWorkbook";
import type { Scenario } from "./types";

export const SCENARIOS: Scenario[] = [
  {
    id: "refund-optimization",
    kind: "choice",
    title: "Refund Authorization Process",
    priority: "HIGH",
    availableFromPeriod: 1,
    executiveMessage:
      "I dunno, that sounds expensive. I think that's one too many steps.\n" +
      "See what you can do about sequence 020.",
    processTable: [
      { seq: "010", fn: "Validate account", costPerTxn: "$0.018", required: true },
      { seq: "020", fn: "Determine customer circumstances", costPerTxn: "$0.114", required: false },
      { seq: "030", fn: "Verify authorization", costPerTxn: "$0.061", required: true },
      { seq: "040", fn: "Record disposition", costPerTxn: "$0.027", required: false },
    ],
    choices: [
      {
        id: "remove-context",
        label: "4=Delete sequence 020 (Determine customer circumstances)",
        immediate: { efficiency: 12, executiveConfidence: 8, profit: 3 },
        delayed: [
          {
            periodsLater: 3,
            label: "Refund fraud and complaints traced to removal of Sequence 020",
            effects: { complaints: 15, refundFraud: 12, customerHealth: -8, institutionalDebt: 10 },
          },
        ],
        resultText:
          "PROCESS OPTIMIZED SUCCESSFULLY\n\n" +
          "Annualized savings:          +$1,423,102\n" +
          "Process complexity:          -25.0%\n" +
          "Executive confidence:        +9\n\n" +
          "CPF9898 PROCESS OPTIMIZED SUCCESSFULLY.",
      },
      {
        id: "leave-process",
        label: "12=Leave process unchanged",
        immediate: { executiveConfidence: -4 },
        resultText:
          "No changes made to process RFND-004.\n\n" +
          "Executive Confidence -4.\n" +
          '"I dunno, are you sure this is the best use of your time?"',
      },
    ],
  },

  {
    id: "customer-report-review",
    kind: "document-review",
    title: "Support Cost Variance Review",
    priority: "MEDIUM",
    availableFromPeriod: 2,
    executiveMessage:
      "Finance flagged a cost variance in Customer Operations.\n" +
      "Determine which operating region generated the largest\n" +
      "increase in support cost this quarter, and report back.",
    documents: ["CUSTOMER_OPERATIONS_Q3.xlsx"],
    onArtifactRequested: (state) => generateCustomerWorkbook(state),
    questions: [
      {
        id: "region",
        prompt: "Region with largest AUG complaint/cost increase:",
        answer: "REGION 4",
        aliases: ["REGION4", "R4", "4"],
      },
    ],
    onCorrect: {
      immediate: { executiveConfidence: 6, profit: 2 },
      resultText: "RESPONSE ACCEPTED.\n\nExecutive Confidence +6.",
    },
    unsolicited: {
      optionLabel: "8=Attach unsolicited observation (Region 4 churn/complaint spike)",
      warningText:
        "WARNING\n\n" +
        "Response exceeds requested scope.\n\n" +
        "Unrequested analysis may delay Executive Review processing.\n\n" +
        "Continue? Y/N",
      effects: { executiveConfidence: -3, regulatoryRisk: -4, institutionalDebt: -6 },
      resultText:
        "OBSERVATION LOGGED.\n\n" +
        "Executive Confidence -3. Review cycle extended.\n" +
        "Institutional Debt -6. Regulatory Risk -4.\n\n" +
        "(Someone, eventually, will have to read this.)",
    },
  },
];

export function getScenario(id: string): Scenario {
  const s = SCENARIOS.find((s) => s.id === id);
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}

export function availableScenarios(period: number, completed: string[]): Scenario[] {
  return SCENARIOS.filter(
    (s) => s.availableFromPeriod <= period && !completed.includes(s.id)
  );
}
