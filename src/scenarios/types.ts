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

export interface ArtifactRef {
  filename: string;
  generate: (state: GameState) => void | Promise<void>;
}

export interface WebReference {
  id: string;
  label: string;
  pageId: string;
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

/** A discrete answer option to a ChoiceQuestion — each carries its own effects, not a pass/fail check. */
export interface ChoiceQuestionOption {
  id: string;
  label: string;
  immediate?: MetricDelta;
  delayed?: DelayedEffectSpec[];
  resultText: string;
}

/** A CEO-style question with several plausible answers of differing political cost, per the cross-document mechanic. */
export interface ChoiceQuestion {
  prompt: string;
  options: ChoiceQuestionOption[];
}

export interface DocumentReviewScenario extends ScenarioBase {
  kind: "document-review";
  artifacts?: ArtifactRef[];
  webReferences?: WebReference[];
  /** Free-text fill-in questions validated against a known answer (mutually exclusive with choiceQuestion). */
  questions?: DocumentQuestion[];
  onCorrect?: {
    immediate?: MetricDelta;
    delayed?: DelayedEffectSpec[];
    resultText: string;
  };
  unsolicited?: UnsolicitedObservation;
  /** A multiple-choice dilemma with differentiated effects (mutually exclusive with questions). */
  choiceQuestion?: ChoiceQuestion;
}

export type Scenario = ChoiceScenario | DocumentReviewScenario;
