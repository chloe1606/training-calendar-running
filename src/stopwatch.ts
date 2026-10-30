export interface StopwatchState {
  elapsedMs: number;
  accumulatedMs: number;
  startedAt: number | null;
}
export type StopwatchAction =
  | { type: 'start' | 'pause' | 'tick'; now: number }
  | { type: 'reset' };

export const initialStopwatch: StopwatchState = { elapsedMs: 0, accumulatedMs: 0, startedAt: null };

export function stopwatchReducer(state: StopwatchState, action: StopwatchAction): StopwatchState {
  if (action.type === 'reset') return initialStopwatch;
  if (action.type === 'start') {
    return state.startedAt === null ? { ...state, startedAt: action.now } : state;
  }
  if (state.startedAt === null) return state;
  const elapsedMs = state.accumulatedMs + Math.max(0, action.now - state.startedAt);
  return action.type === 'pause'
    ? { elapsedMs, accumulatedMs: elapsedMs, startedAt: null }
    : { ...state, elapsedMs };
}

export function stopwatchLabel(elapsedMs: number): string {
  const seconds = Math.floor(elapsedMs / 1000);
  return `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor(seconds / 60 % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
