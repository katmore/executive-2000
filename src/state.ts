export interface MetricDelta {
  profit?: number;
  efficiency?: number;
  executiveConfidence?: number;
  customerHealth?: number;
  employeeHealth?: number;
  regulatoryRisk?: number;
  institutionalDebt?: number;
  complaints?: number;
  churn?: number;
  refundFraud?: number;
  supportBacklog?: number;
}

export interface ScheduledEffect {
  id: string;
  triggerPeriod: number;
  source: string;
  label: string;
  effects: MetricDelta;
  applied: boolean;
}

export interface DecisionRecord {
  period: number;
  scenarioId: string;
  choiceId: string;
}

export interface GameEvent {
  period: number;
  type: string;
  text: string;
}

export const RANKS = [
  "Manager",
  "Senior Manager",
  "Director",
  "Senior Director",
  "Vice President",
  "Senior Vice President",
  "Chief Transformation Officer",
] as const;

export interface GameState {
  period: number;

  profit: number;
  efficiency: number;
  executiveConfidence: number;

  customerHealth: number;
  employeeHealth: number;
  regulatoryRisk: number;
  institutionalDebt: number;

  complaints: number;
  churn: number;
  refundFraud: number;
  supportBacklog: number;

  rank: number;

  completedScenarios: string[];
  decisions: DecisionRecord[];
  scheduledEffects: ScheduledEffect[];
  events: GameEvent[];
  unlockedSystems: string[];
  retiredMetrics: string[];
  documentFlags: Record<string, string | boolean>;
  hackerFlags: Record<string, string | boolean>;
  legacySystemFlags: Record<string, string | boolean>;
}

export function createInitialState(): GameState {
  return {
    period: 1,

    profit: 100,
    efficiency: 100,
    executiveConfidence: 50,

    customerHealth: 100,
    employeeHealth: 100,
    regulatoryRisk: 0,
    institutionalDebt: 0,

    complaints: 0,
    churn: 0,
    refundFraud: 0,
    supportBacklog: 0,

    rank: 0,

    completedScenarios: [],
    decisions: [],
    scheduledEffects: [],
    events: [],
    unlockedSystems: [],
    retiredMetrics: [],
    documentFlags: {},
    hackerFlags: {},
    legacySystemFlags: {},
  };
}

export function rankTitle(state: GameState): string {
  return RANKS[Math.min(state.rank, RANKS.length - 1)];
}

const METRIC_KEYS: (keyof MetricDelta)[] = [
  "profit",
  "efficiency",
  "executiveConfidence",
  "customerHealth",
  "employeeHealth",
  "regulatoryRisk",
  "institutionalDebt",
  "complaints",
  "churn",
  "refundFraud",
  "supportBacklog",
];

export function applyDelta(state: GameState, delta: MetricDelta): void {
  for (const key of METRIC_KEYS) {
    const amount = delta[key];
    if (amount) {
      (state[key] as number) += amount;
    }
  }
}
