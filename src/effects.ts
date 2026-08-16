import { applyDelta, type GameState, type MetricDelta } from "./state";

let effectCounter = 0;

export function scheduleEffect(
  state: GameState,
  opts: {
    periodsLater: number;
    source: string;
    label: string;
    effects: MetricDelta;
  }
): void {
  effectCounter += 1;
  state.scheduledEffects.push({
    id: `sched-${state.period}-${effectCounter}`,
    triggerPeriod: state.period + opts.periodsLater,
    source: opts.source,
    label: opts.label,
    effects: opts.effects,
    applied: false,
  });
}

/** Applies any scheduled effects due at or before the current period. Returns the effects applied, for display. */
export function applyDueEffects(state: GameState): { label: string; source: string }[] {
  const due = state.scheduledEffects.filter(
    (e) => !e.applied && e.triggerPeriod <= state.period
  );
  for (const effect of due) {
    applyDelta(state, effect.effects);
    effect.applied = true;
  }
  return due.map((e) => ({ label: e.label, source: e.source }));
}

export function advancePeriod(state: GameState): { label: string; source: string }[] {
  state.period += 1;
  return applyDueEffects(state);
}
