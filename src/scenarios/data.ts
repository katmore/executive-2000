import { generateActionPlanDoc } from "../artifacts/actionPlanDoc";
import { generateCustomerWorkbook } from "../artifacts/customerWorkbook";
import { generateCxRiskReviewPdf } from "../artifacts/cxRiskReviewPdf";
import { generateHermesIncidentWorkbook } from "../artifacts/hermesIncidentWorkbook";
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

  {
    id: "support-staffing-variance",
    kind: "choice",
    title: "Support Staffing Variance",
    priority: "MEDIUM",
    availableFromPeriod: 2,
    executiveMessage:
      "Support backlog is climbing and average wait time is up.\n" +
      "Pick one and let's move on before the QBR.",
    choices: [
      {
        id: "add-staff",
        label: "1=Add staff (2 FTE)",
        immediate: { profit: -6, supportBacklog: -20, customerHealth: 5 },
        resultText:
          "HEADCOUNT REQUEST APPROVED.\n\n" +
          "Profit -6. Support Backlog -20. Customer Health +5.\n\n" +
          "Finance noted the request. No further comment.",
      },
      {
        id: "outsource",
        label: "2=Outsource support queue",
        immediate: { efficiency: 8, profit: 2, supportBacklog: -15 },
        delayed: [
          {
            periodsLater: 3,
            label: "Outsourced support quality complaints reach Customer Ops",
            effects: { complaints: 12, customerHealth: -10 },
          },
        ],
        resultText:
          "OUTSOURCING VENDOR ENGAGED.\n\n" +
          "Efficiency +8. Profit +2. Support Backlog -15.\n\n" +
          "CPF9898 PROCESS OPTIMIZED SUCCESSFULLY.",
      },
      {
        id: "automate",
        label: "3=Automate intake (chatbot triage)",
        immediate: { efficiency: 14, profit: 4, supportBacklog: -10, executiveConfidence: 6 },
        delayed: [
          {
            periodsLater: 3,
            label: "Automated intake misroutes complex cases; churn increases",
            effects: { churn: 6, complaints: 8 },
          },
        ],
        resultText:
          "STRATEGIC INITIATIVE LAUNCHED: INTAKE AUTOMATION.\n\n" +
          "Efficiency +14. Profit +4. Support Backlog -10.\n\n" +
          "Executive Confidence +6 (unscheduled bonus for innovation).",
      },
      {
        id: "change-sla",
        label: "4=Change SLA target (48h -> 72h)",
        immediate: { supportBacklog: -25, executiveConfidence: 5 },
        resultText:
          "SLA TARGET UPDATED.\n\n" +
          "Support Backlog KPI: GREEN.\n" +
          "Customer wait times unchanged.\n\n" +
          "(Nothing about the actual wait time changed. The number reported did.)",
      },
    ],
  },

  {
    id: "hermes-004",
    kind: "document-review",
    title: "Security Incident: Board Metrics",
    priority: "URGENT",
    availableFromPeriod: 5,
    executiveMessage:
      "SECURITY INCIDENT ACTIVE\n\n" +
      "Document integrity cannot be guaranteed.\n\n" +
      "Management requires the SEP churn projection before\n" +
      "the review may continue.",
    artifacts: [{ filename: "BOARD_METRICS_Q3.xls", generate: generateHermesIncidentWorkbook }],
    questions: [
      {
        id: "projection",
        prompt: "Projected SEP churn (using the visible trend):",
        answer: "9.6%",
        aliases: ["9.6", "09.6%", "9.6 %"],
      },
    ],
    onCorrect: {
      immediate: { institutionalDebt: -4 },
      resultText:
        "RESPONSE ACCEPTED.\n\n" +
        "Institutional Debt -4.\n\n" +
        "HERMES INTERRUPTION 004 LOGGED.\n\n" +
        "(Management does not postpone the meeting.)",
    },
  },

  {
    id: "cobol-custadj-01",
    kind: "choice",
    title: "Batch Job Abend: CUSTADJ",
    priority: "URGENT",
    availableFromPeriod: 6,
    executiveMessage:
      "JOB CXBILL01 ABENDED\n\n" +
      "Program: CUSTADJ\n" +
      "Abend: S0C7\n\n" +
      "Last successful record:\n" +
      "ACCT=004182 REGION=04 TYPE=R\n\n" +
      "SOURCE (CUSTADJ.cbl):\n" +
      "  01  CUSTOMER-REC.\n" +
      "      05  ACCOUNT-NO       PIC 9(6).\n" +
      "      05  REGION-CODE      PIC 99.\n" +
      "      05  ADJUSTMENT       PIC 9(5)V99.\n" +
      "  ...\n" +
      "  COMPUTE TOTAL-ADJ =\n" +
      "      TOTAL-ADJ + ADJUSTMENT\n\n" +
      'DUMP:\n' +
      '  ADJUSTMENT = "12A4.50"',
    choices: [
      {
        id: "skip-invalid-record",
        label: "1=Skip invalid record and resubmit job",
        immediate: { efficiency: 6, executiveConfidence: 10 },
        delayed: [
          {
            periodsLater: 3,
            label: "Skipped adjustment record surfaces as unexplained billing variance",
            effects: { institutionalDebt: 8, complaints: 6 },
          },
        ],
        resultText:
          "JOB RESUBMITTED. BATCH COMPLETED.\n\n" +
          "Efficiency +6. Executive Confidence +10.\n\n" +
          "CPF9898 PROCESS OPTIMIZED SUCCESSFULLY.\n\n" +
          "(Account 004182's adjustment was never applied. Nobody asked.)",
      },
      {
        id: "change-field-alphanumeric",
        label: "2=Change ADJUSTMENT to alphanumeric (PIC X)",
        immediate: { efficiency: 2 },
        delayed: [
          {
            periodsLater: 3,
            label: "Downstream COMPUTE statements on ADJUSTMENT begin failing across the batch suite",
            effects: { institutionalDebt: 14, regulatoryRisk: 6 },
          },
        ],
        resultText:
          "CHANGE APPLIED.\n\n" +
          "Job completes without abending.\n\n" +
          "(ADJUSTMENT is now text. Every other program that does arithmetic\n" +
          "on it does not know that yet.)",
      },
      {
        id: "validate-before-compute",
        label: "3=Add input validation before COMPUTE",
        immediate: { efficiency: -2, executiveConfidence: -3 },
        resultText:
          "CHANGE REQUEST SUBMITTED.\n\n" +
          "Program: CUSTADJ\n\n" +
          "CPF9020 CHANGE REQUEST REJECTED\n\n" +
          "Reason:\n" +
          "Program CUSTADJ is designated BUSINESS CRITICAL / CHANGE FROZEN.\n\n" +
          "Next approved maintenance window: NOV 14.\n\n" +
          "Efficiency -2. Executive Confidence -3.\n\n" +
          "(The correct fix. It will have to wait.)",
      },
      {
        id: "increase-memory",
        label: "4=Increase batch memory allocation",
        immediate: { profit: -3 },
        resultText:
          "MEMORY ALLOCATION INCREASED.\n\n" +
          "Job CXBILL01 abends again at the same record next cycle.\n\n" +
          "S0C7 is not a memory error.",
      },
    ],
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
