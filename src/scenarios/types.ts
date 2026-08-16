import type { GameState, MetricDelta } from "../state";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface DelayedEffectSpec {
  periodsLater: number;
  label: string;
  effects: MetricDelta;
}

export interface Choice {
  id: string;
  label: string;
  immediate?: MetricDelta;
  delayed?: DelayedEffectSpec[];
  resultText: string;
}

export interface ProcessStep {
  seq: string;
  fn: string;
  costPerTxn: string;
  required: boolean;
}

interface ScenarioBase {
  id: string;
  title: string;
  priority: Priority;
  availableFromPeriod: number;
  requires?: string[];
  executiveMessage: string;
}

export interface ChoiceScenario extends ScenarioBase {
  kind: "choice";
  processTable?: ProcessStep[];
  choices: Choice[];
}

export interface DocumentQuestion {
  id: string;
  prompt: string;
  answer: string;
  aliases?: string[];
}

export interface UnsolicitedObservation {
  optionLabel: string;
  warningText: string;
  effects: MetricDelta;
  resultText: string;
}

export interface DocumentReviewScenario extends ScenarioBase {
  kind: "document-review";
  documents: string[];
  questions: DocumentQuestion[];
  onArtifactRequested: (state: GameState) => void;
  onCorrect: {
    immediate?: MetricDelta;
    delayed?: DelayedEffectSpec[];
    resultText: string;
  };
  unsolicited?: UnsolicitedObservation;
}

export type Scenario = ChoiceScenario | DocumentReviewScenario;
