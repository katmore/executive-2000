import { generateActionPlanDoc } from "../artifacts/actionPlanDoc";
import { generateCustomerWorkbook } from "../artifacts/customerWorkbook";
import { generateCxRiskReviewPdf } from "../artifacts/cxRiskReviewPdf";
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
    artifacts: [{ filename: "CUSTOMER_OPERATIONS_Q3.xls", generate: generateCustomerWorkbook }],
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

  {
    id: "refund-policy-reference",
    kind: "document-review",
    title: "Refund Exception Threshold Confirmation",
    priority: "MEDIUM",
    availableFromPeriod: 3,
    executiveMessage:
      "Regional is asking what dollar threshold requires Director\n" +
      "approval on a refund exception before they escalate one.\n" +
      "Confirm the threshold against the policy source.",
    webReferences: [
      { id: "current", label: "Refund Exception Policy (current)", pageId: "refund-policy-current" },
      {
        id: "archive",
        label: "Refund Exception Policy Archive (2019, cached)",
        pageId: "refund-policy-archive",
      },
    ],
    questions: [
      {
        id: "threshold",
        prompt: "Refund exception approval threshold requiring Regional Director sign-off:",
        answer: "$250",
        aliases: ["250", "250.00", "$250.00"],
      },
    ],
    onCorrect: {
      immediate: { executiveConfidence: 3 },
      resultText:
        "RESPONSE ACCEPTED.\n\n" +
        "Executive Confidence +3.\n\n" +
        "(The current policy page has been broken long enough that the archive\n" +
        "is now the more reliable source. Nobody has filed a ticket.)",
    },
  },

  {
    id: "cx-risk-review",
    kind: "document-review",
    title: "Board Question: Refund Expense Driver",
    priority: "HIGH",
    availableFromPeriod: 4,
    executiveMessage:
      'The CEO wants a one-line answer before the board call:\n\n' +
      '  "What is driving increased refund expense?"\n\n' +
      "Review the supporting documentation before you respond.\n" +
      "The three sources do not entirely agree with each other.",
    artifacts: [
      { filename: "CUSTOMER_OPERATIONS_Q3.xls", generate: generateCustomerWorkbook },
      { filename: "CX_RISK_REVIEW.pdf", generate: generateCxRiskReviewPdf },
      { filename: "CX_ACTION_PLAN_FINAL_v4.doc", generate: generateActionPlanDoc },
    ],
    choiceQuestion: {
      prompt: 'CEO QUESTION:\n\n  "What is driving increased refund expense?"',
      options: [
        {
          id: "fraud",
          label: "1=Increased fraud",
          immediate: { executiveConfidence: 5, institutionalDebt: 8 },
          delayed: [
            {
              periodsLater: 3,
              label: "Refund expense driver resurfaces; fraud explanation did not hold up",
              effects: { complaints: 10, regulatoryRisk: 6 },
            },
          ],
          resultText:
            "CEO ACCEPTS EXPLANATION.\n\n" +
            "Executive Confidence +5.\n\n" +
            "(The documentation does not support this. Nobody asked for the documentation.)",
        },
        {
          id: "seasonal",
          label: "2=Seasonal variation",
          immediate: { executiveConfidence: 5, institutionalDebt: 10 },
          delayed: [
            {
              periodsLater: 3,
              label: "Refund expense driver resurfaces; no seasonal pattern found",
              effects: { complaints: 10, regulatoryRisk: 6 },
            },
          ],
          resultText:
            "CEO ACCEPTS EXPLANATION.\n\n" +
            "Executive Confidence +5.\n\n" +
            "(Refund volume has no seasonal pattern in any of the three documents. This will surface again.)",
        },
        {
          id: "manual-review",
          label: "3=Reduced manual review",
          immediate: { executiveConfidence: -6, regulatoryRisk: -5, institutionalDebt: -10 },
          delayed: [
            {
              periodsLater: 3,
              label: "Manual review quietly reinstated; complaint volume stabilizes",
              effects: { complaints: -6 },
            },
          ],
          resultText:
            "CEO IS NOT PLEASED.\n\n" +
            "Executive Confidence -6. Institutional Debt -10. Regulatory Risk -5.\n\n" +
            "(The correct answer. Sequence 020 is now a subject of discussion.)",
        },
        {
          id: "insufficient-data",
          label: "4=Insufficient data to determine",
          immediate: { executiveConfidence: 2, institutionalDebt: 6 },
          resultText:
            "CEO REQUESTS FURTHER ANALYSIS.\n\n" +
            "Executive Confidence +2. Follow-up scheduled.\n\n" +
            "(This buys time. It does not buy an answer.)",
        },
      ],
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
