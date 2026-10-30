export interface RestTimerState {
  durationSeconds: number;
  remainingMs: number;
  endsAt: number | null;
  finished: boolean;
}
export type RestTimerAction =
  | { type: 'duration'; seconds: number }
  | { type: 'restart'; seconds: number; now: number }
  | { type: 'start' | 'pause' | 'tick'; now: number }
  | { type: 'reset' };

export const initialRestTimer: RestTimerState = { durationSeconds: 60, remainingMs: 60000, endsAt: null, finished: false };
export function validRestSeconds(seconds: number): boolean {
  return Number.isInteger(seconds) && seconds >= 1 && seconds <= 3600;
}
export function restTimerReducer(state: RestTimerState, action: RestTimerAction): RestTimerState {
  if (action.type === 'duration' || action.type === 'restart') {
    if (!validRestSeconds(action.seconds)) throw new Error('Rest duration must be a whole number from 1 to 3600 seconds.');
    return { durationSeconds: action.seconds, remainingMs: action.seconds * 1000, endsAt: action.type === 'restart' ? action.now + action.seconds * 1000 : null, finished: false };
  }
  if (action.type === 'reset') return { ...state, remainingMs: state.durationSeconds * 1000, endsAt: null, finished: false };
  if (action.type === 'start') {
    if (state.endsAt !== null) return state;
    const remainingMs = state.remainingMs > 0 ? state.remainingMs : state.durationSeconds * 1000;
    return { ...state, remainingMs, endsAt: action.now + remainingMs, finished: false };
  }
  if (state.endsAt === null) return state;
  const remainingMs = Math.max(0, state.endsAt - action.now);
  return { ...state, remainingMs, endsAt: remainingMs === 0 || action.type === 'pause' ? null : state.endsAt, finished: remainingMs === 0 };
}
export function restStepDurations(text: string): number[] {
  const matches = text.matchAll(/\brest\s+(\d+)(?:\s*[-–]\s*(\d+))?\s*(?:seconds?|s)\b/gi);
  return [...new Set([...matches].flatMap(match => match.slice(1).filter(Boolean).map(Number)))].filter(validRestSeconds);
}
export function restTimerLabel(remainingMs: number): string {
  const seconds = Math.ceil(remainingMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
