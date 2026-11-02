import { describe, expect, it } from 'vitest';
import { addCompletedStrength, completedStrengthWorkout, generateStrengthWorkout, strengthPoolGroups } from './random-strength';
import { equipmentTags, guidesForNotes, moveDifficulty, MOVE_GUIDES, strengthDurationLabel, workoutFlowSteps, strengthSummary } from './strength-guide';
import { createDefaultPlan } from './seed';
import { weekStats } from './model';

describe('custom random strength workouts', () => {
  it('defaults to three Light, four Medium and five Heavy moves and keeps Medium doses without Hard moves', () => {
    for (const [intensity, count] of [['light', 3], ['medium', 4], ['heavy', 5]] as const) {
      expect(generateStrengthWorkout(intensity, () => 0).movementIds).toHaveLength(count);
    }
    const heavy = strengthPoolGroups('heavy').flatMap(group => group.candidates);
    const medium = strengthPoolGroups('medium').flatMap(group => group.candidates);
    expect(medium.length).toBeGreaterThan(6);
    for (const candidate of medium) {
      expect(moveDifficulty(MOVE_GUIDES.find(move => move.id === candidate.id)!)).not.toBe('Hard');
      expect(candidate).toEqual(heavy.find(item => item.id === candidate.id));
    }
    const workout = generateStrengthWorkout('medium', () => 0);
    expect(workout.title).toContain('Generated medium:');
    expect(workoutFlowSteps(`${workout.title}\n\n${workout.notes}`).some(step => step.text.startsWith('Generated medium:'))).toBe(false);
    expect(strengthSummary(workout.notes)).toHaveLength(4);
    expect(workout.notes).not.toContain('Bodyweight only');
  });
  it('honours exercise counts, caps at the unique pool size and validates count input', () => {
    for (const intensity of ['light', 'heavy'] as const) {
      for (const count of [3, 4, 5, 6]) {
        const workout = generateStrengthWorkout(intensity, () => 0, undefined, count);
        expect(workout.movementIds).toHaveLength(count);
        expect(new Set(workout.movementIds).size).toBe(count);
      }
      const pool = strengthPoolGroups(intensity)[0].candidates.slice(0, 2).map(item => item.id);
      expect(generateStrengthWorkout(intensity, () => 0, pool, 6).movementIds).toHaveLength(2);
      for (const count of [0, 2, 7, 1.5, NaN]) expect(() => generateStrengthWorkout(intensity, () => 0, pool, count)).toThrow('3–6');
    }
  });
  it('offers optional warm-up alternatives without adding main exercises or duplicate suggestions', () => {
    for (const intensity of ['light', 'heavy'] as const) {
      const workout = generateStrengthWorkout(intensity, () => 0);
      const warmup = workoutFlowSteps(workout.notes)[0];
      expect(warmup.text).toContain('bodyweight squats');
      expect(warmup.text).toContain('Choose one option within the same');
      expect(warmup.text.match(/Alternatives:/g)).toHaveLength(1);
      expect(warmup.moves.some(move => move.id === 'squat')).toBe(true);
      expect(strengthSummary(workout.notes).some(line => line.startsWith('Warm-up:'))).toBe(false);
      if (intensity === 'heavy') {
        expect(warmup.text).toContain('mini-band lateral walk');
        expect(warmup.text).toContain('mini-band diagonal walk');
        expect(warmup.moves.some(move => move.id === 'band-lateral')).toBe(true);
      } else {
        expect(warmup.text).not.toContain('mini-band');
        expect(warmup.text).toContain('bodyweight-only');
      }
    }
  });
  it('creates varied, unique combinations with valid flowchart and diagram links', () => {
    for (const intensity of ['light', 'heavy'] as const) {
      const combinations = new Set<string>();
      for (let i = 0; i < 80; i++) {
        let seed = i + 1;
        const workout = generateStrengthWorkout(intensity, () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 4294967296;
        });
        combinations.add(workout.movementIds.join(','));
        expect(workout.movementIds).toHaveLength(intensity === 'heavy' ? 5 : 3);
        expect(new Set(workout.movementIds).size).toBe(workout.movementIds.length);
        const steps = workoutFlowSteps(workout.notes);
        expect(steps[0].text).toMatch(/^Warm-up:/);
        for (const id of workout.movementIds) {
          const movementSteps = steps.filter(step => !/^(?:Warm-up|Cool-down):/.test(step.text) && step.moves.some(move => move.id === id));
          const dose = workout.notes.split('\n').find(line => line.startsWith(`${MOVE_GUIDES.find(move => move.id === id)!.name}:`))!;
          expect(movementSteps).toHaveLength(Number(dose.match(/(\d+) sets? x/)![1]));
          for (const step of movementSteps) expect(step.text).toMatch(/set/i);
        }
        expect(steps.some(step => /^Rest \d/.test(step.text))).toBe(true);
        expect(steps.filter(step => step.text.startsWith('Cool-down:'))).toHaveLength(1);
        expect(strengthDurationLabel(workout.notes)).toBe(intensity === 'heavy' ? 'Approx. 25–45 min' : 'Duration not specified');
        const moves = workout.movementIds.map(id => MOVE_GUIDES.find(move => move.id === id)!);
        if (intensity === 'light') {
          expect(moves.flatMap(equipmentTags).some(tag => ['dumbbell', 'band', 'kettlebell'].includes(tag.kind))).toBe(false);
          expect(workout.notes).toContain('Bodyweight only, no heavy leg work');
        }
        expect(guidesForNotes(workout.notes).length).toBeGreaterThanOrEqual(moves.length);
      }
      expect(combinations.size).toBeGreaterThan(10);
    }
  });
  it('selects both ends of each pool and rejects invalid random samples', () => {
    const candidates = strengthPoolGroups('heavy').flatMap(group => group.candidates.map(item => item.id));
    expect(generateStrengthWorkout('heavy', () => 0).movementIds).toEqual(candidates.slice(0, 5));
    expect(generateStrengthWorkout('heavy', () => 0.99999).movementIds).toEqual(candidates.slice(-5).reverse());
    for (const sample of [-1, 1, NaN, Infinity]) expect(() => generateStrengthWorkout('light', () => sample)).toThrow('Random sample');
  });
  it('uses only the selected pool without requiring every muscle group', () => {
    for (const intensity of ['light', 'heavy'] as const) {
      const groups = strengthPoolGroups(intensity);
      const selected = groups.map(group => group.candidates[0].id);
      expect(generateStrengthWorkout(intensity, () => 0, selected, selected.length).movementIds).toEqual(selected);
      expect(generateStrengthWorkout(intensity, () => 0, selected.slice(1)).movementIds).toEqual(selected.slice(1));
      const focused = groups[0].candidates.slice(0, 3).map(item => item.id);
      expect(generateStrengthWorkout(intensity, () => 0, focused).movementIds).toEqual(focused);
      expect(generateStrengthWorkout(intensity, () => 0, [selected[0], selected[0]]).movementIds).toEqual([selected[0]]);
      expect(() => generateStrengthWorkout(intensity, () => 0, [])).toThrow('Choose at least one exercise');
      expect(() => generateStrengthWorkout(intensity, () => 0, [...selected, 'unknown'])).toThrow('not suitable');
      expect(new Set(groups.flatMap(group => group.candidates.map(item => item.id))).size)
        .toBe(groups.flatMap(group => group.candidates).length);
    }
    expect(() => generateStrengthWorkout('light', () => 0, ['single-slider'])).toThrow('not suitable');
  });
  it('can select every eligible library option with explicit doses and correct diagram links', () => {
    const heavy = strengthPoolGroups('heavy');
    expect(heavy.flatMap(group => group.candidates).length).toBeGreaterThan(70);
    for (const intensity of ['light', 'heavy'] as const) {
      const groups = strengthPoolGroups(intensity);
      for (let index = 0; index < groups.length; index++) {
        for (const candidate of groups[index].candidates) {
          const ids = [candidate.id];
          const workout = generateStrengthWorkout(intensity, () => 0, ids);
          expect(workout.movementIds).toContain(candidate.id);
          expect(workout.notes).toContain(candidate.dose);
          const steps = workoutFlowSteps(workout.notes);
          expect(steps.some(step => step.moves.some(move => move.id === candidate.id))).toBe(true);
          const move = MOVE_GUIDES.find(move => move.id === candidate.id)!;
          expect(strengthSummary(workout.notes).some(line => line.startsWith(`${move.name}:`)), move.name).toBe(true);
        }
      }
    }
  });
  it('allows an all-Hard pool with multiple Hard movements in one workout', () => {
    const ids = strengthPoolGroups('heavy').flatMap(group => group.candidates)
      .filter(item => moveDifficulty(MOVE_GUIDES.find(move => move.id === item.id)!) === 'Hard')
      .map(item => item.id);
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(generateStrengthWorkout('heavy', () => 0, ids).movementIds).toEqual(ids.slice(0, 5));
  });
  it('builds a dated completed strength entry without altering running mileage or existing sessions', () => {
    const plan = createDefaultPlan();
    const generated = generateStrengthWorkout('light', () => 0);
    const workout = completedStrengthWorkout(generated, '2026-10-29', '2026-10-30', 'strength-log-test');
    expect(workout).toMatchObject({ date: '2026-10-29', completed: true, type: 'crossTraining', activity: 'strength', distanceMiles: 0 });
    expect(workout.notes).toBe(`${generated.title}\n\n${generated.notes}`);
    expect(workoutFlowSteps(workout.notes)).toEqual(workoutFlowSteps(generated.notes));
    const next = addCompletedStrength(plan, workout);
    expect(next.workouts.slice(0, -1)).toEqual(plan.workouts);
    expect(weekStats(next.workouts)).toEqual(weekStats(plan.workouts));
    expect(() => addCompletedStrength(next, workout)).toThrow('already been saved');
    expect(() => addCompletedStrength({ ...plan, workouts: Array.from({ length: 10000 }, (_, index) => ({ ...workout, id: `existing-${index}` })) }, workout)).toThrow('10,000-workout limit');
    for (const date of ['', '2026-02-30', '2026-10-31', '2019-12-31', '30/10/2026']) {
      expect(() => completedStrengthWorkout(generated, date, '2026-10-30', 'test')).toThrow('valid completion date');
    }
  });
  it('fills only an empty incomplete strength slot on the completion date', () => {
    const plan = createDefaultPlan();
    const workout = completedStrengthWorkout(generateStrengthWorkout('light', () => 0), '2026-10-30', '2026-10-30', 'strength-log-slot');
    const slot = plan.workouts.find(item => item.activity === 'strength' && item.date === workout.date)!;
    const next = addCompletedStrength(plan, workout);
    expect(next.workouts).toHaveLength(plan.workouts.length);
    expect(next.workouts.find(item => item.id === slot.id)).toBeUndefined();
    expect(next.workouts.find(item => item.id === workout.id)).toEqual(workout);
    for (const custom of [{ ...slot, completed: true }, { ...slot, notes: 'Custom plan notes' }]) {
      const protectedPlan = { ...plan, workouts: plan.workouts.map(item => item.id === slot.id ? custom : item) };
      const added = addCompletedStrength(protectedPlan, workout);
      expect(added.workouts).toHaveLength(plan.workouts.length + 1);
      expect(added.workouts.find(item => item.id === custom.id)).toEqual(custom);
    }
  });
});
