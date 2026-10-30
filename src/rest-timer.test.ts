import { describe, expect, it } from 'vitest';
import { initialRestTimer, restTimerLabel, restTimerReducer, restStepDurations, validRestSeconds } from './rest-timer';

describe('rest countdown', () => {
  it('starts a new step rest immediately, replacing a running or finished countdown', () => {
    for (const state of [initialRestTimer, { ...initialRestTimer, endsAt: 50000 }, { ...initialRestTimer, remainingMs: 0, finished: true }]) {
      expect(restTimerReducer(state, { type: 'restart', seconds: 75, now: 1000 })).toEqual({
        durationSeconds: 75, remainingMs: 75000, endsAt: 76000, finished: false,
      });
    }
    expect(() => restTimerReducer(initialRestTimer, { type: 'restart', seconds: 0, now: 1000 })).toThrow();
    expect(restStepDurations('Rest 60s between sets.')).toEqual([60]);
    expect(restStepDurations('Rest 60-90s before the next exercise.')).toEqual([60, 90]);
    expect(restStepDurations('Set 1 of 2 - Rest 30 s between sides.')).toEqual([]);
    expect(restStepDurations('Rest 0s.')).toEqual([]);
  });
  it('uses elapsed time rather than interval counts, including delayed background ticks', () => {
    const started = restTimerReducer(initialRestTimer, { type: 'start', now: 1000 });
    expect(started.endsAt).toBe(61000);
    const ticked = restTimerReducer(started, { type: 'tick', now: 12500 });
    expect(restTimerLabel(ticked.remainingMs)).toBe('0:49');
    const finished = restTimerReducer(ticked, { type: 'tick', now: 90000 });
    expect(finished).toEqual({ durationSeconds: 60, remainingMs: 0, endsAt: null, finished: true });
    expect(restTimerReducer(finished, { type: 'tick', now: 95000 })).toBe(finished);
  });
  it('pauses, resumes, resets and restarts a completed timer', () => {
    const started = restTimerReducer(initialRestTimer, { type: 'start', now: 1000 });
    expect(restTimerReducer(started, { type: 'start', now: 2000 })).toBe(started);
    const paused = restTimerReducer(started, { type: 'pause', now: 21000 });
    expect(paused.remainingMs).toBe(40000);
    expect(paused.endsAt).toBeNull();
    const resumed = restTimerReducer(paused, { type: 'start', now: 100000 });
    expect(resumed.endsAt).toBe(140000);
    expect(restTimerReducer(resumed, { type: 'reset' })).toEqual(initialRestTimer);
    const finished = restTimerReducer(resumed, { type: 'tick', now: 140000 });
    expect(restTimerReducer(finished, { type: 'start', now: 150000 }).endsAt).toBe(210000);
  });
  it('sets presets/custom durations and rejects invalid values explicitly', () => {
    for (const seconds of [1, 30, 45, 60, 75, 90, 137, 3600]) {
      expect(validRestSeconds(seconds)).toBe(true);
      expect(restTimerReducer(initialRestTimer, { type: 'duration', seconds })).toEqual({ durationSeconds: seconds, remainingMs: seconds * 1000, endsAt: null, finished: false });
    }
    for (const seconds of [0, -1, 1.5, 3601, NaN, Infinity]) {
      expect(validRestSeconds(seconds)).toBe(false);
      expect(() => restTimerReducer(initialRestTimer, { type: 'duration', seconds })).toThrow('whole number');
    }
    expect(restTimerLabel(0)).toBe('0:00');
    expect(restTimerLabel(3600000)).toBe('60:00');
  });
});
