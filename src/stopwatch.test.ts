import { describe, expect, it } from 'vitest';
import { initialStopwatch, stopwatchLabel, stopwatchReducer } from './stopwatch';

describe('stopwatch', () => {
  it('uses timestamps to catch up after delayed ticks', () => {
    const running = stopwatchReducer(initialStopwatch, { type: 'start', now: 1000 });
    expect(stopwatchReducer(running, { type: 'start', now: 2000 })).toEqual(running);
    expect(stopwatchReducer(running, { type: 'tick', now: 66000 }).elapsedMs).toBe(65000);
  });
  it('pauses, resumes without counting paused time, and resets while running', () => {
    let state = stopwatchReducer(initialStopwatch, { type: 'start', now: 1000 });
    state = stopwatchReducer(state, { type: 'pause', now: 4500 });
    expect(state.elapsedMs).toBe(3500);
    expect(stopwatchReducer(state, { type: 'tick', now: 9000 })).toEqual(state);
    state = stopwatchReducer(state, { type: 'start', now: 10000 });
    state = stopwatchReducer(state, { type: 'tick', now: 12000 });
    expect(state.elapsedMs).toBe(5500);
    state = stopwatchReducer(state, { type: 'reset' });
    expect(state).toEqual(initialStopwatch);
    expect(stopwatchReducer(state, { type: 'tick', now: 20000 })).toEqual(initialStopwatch);
  });
  it('formats hours, minutes and seconds without rounding up', () => {
    expect(stopwatchLabel(0)).toBe('00:00:00');
    expect(stopwatchLabel(59999)).toBe('00:00:59');
    expect(stopwatchLabel(3661000)).toBe('01:01:01');
  });
});
