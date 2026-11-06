import { describe, expect, it } from 'vitest';
import { addCompletedStrength, completedStrengthWorkout, generateStrengthWorkout, strengthPoolGroups, swapGeneratedExercise } from './random-strength';
import { bodyAreas, guidesForNotes, moveCategory, MOVE_GUIDES, strengthDurationLabel, workoutFlowSteps, strengthSummary } from './strength-guide';
import { createDefaultPlan } from './seed';
import { weekStats } from './model';

const categories = ['mobility', 'pilates', 'strength'] as const;

describe('custom guide workouts', () => {
  it('swaps just one generated exercise using the selected pool without duplicates', () => {
    for (const category of categories) {
      const workout = generateStrengthWorkout(category, () => 0);
      const pool = strengthPoolGroups(category).flatMap(group => group.candidates.map(item => item.id));
      const replacementId = pool.find(id => !workout.movementIds.includes(id))!;
      const swapped = swapGeneratedExercise(workout, workout.movementIds[0], [replacementId], () => 0);
      expect(swapped.movementIds).toEqual([replacementId, ...workout.movementIds.slice(1)]);
      expect(swapped.category).toBe(category);
      expect(swapped.title).toBe(workout.title);
      expect(swapped.notes.split('\n\n').slice(2)).toEqual(workout.notes.split('\n\n').slice(2));
      expect(new Set(swapped.movementIds).size).toBe(workout.movementIds.length);
      expect(() => swapGeneratedExercise(workout, workout.movementIds[0], workout.movementIds)).toThrow('No alternative');
      expect(() => swapGeneratedExercise(workout, 'missing', pool)).toThrow('not part');
    }
  });
  it('offers the requested movement categories and keeps every pool category-specific', () => {
    for (const category of categories) {
      const groups = strengthPoolGroups(category);
      const candidates = groups.flatMap(group => group.candidates);
      const generated = generateStrengthWorkout(category, () => 0);
      expect(generated.category).toBe(category);
      expect(generated.movementIds).toHaveLength(4);
      if (category !== 'strength') expect(candidates).toHaveLength(20);
      expect(candidates.length).toBeGreaterThan(3);
      expect(new Set(candidates.map(item => item.id)).size).toBe(candidates.length);
      for (const candidate of candidates) {
        const move = MOVE_GUIDES.find(item => item.id === candidate.id)!;
        if (category === 'mobility') expect(['Mobility', 'Balance & control']).toContain(moveCategory(move));
        else expect(moveCategory(move).toLowerCase()).toBe(category);
      }
    }
    expect(strengthPoolGroups('mobility').map(group => group.label)).toEqual(['Mobility', 'Balance & control']);
    expect(strengthPoolGroups('pilates').map(group => group.label)).toEqual(['Pilates']);
    for (const candidate of strengthPoolGroups('pilates').flatMap(group => group.candidates)) {
      expect(MOVE_GUIDES.find(move => move.id === candidate.id)!.name).not.toMatch(/^Pilates /);
    }
  });

  it('honours exercise counts, caps at the unique pool size and validates count input', () => {
    for (const category of categories) {
      for (const count of [3, 4, 5, 6]) {
        const workout = generateStrengthWorkout(category, () => 0, undefined, count);
        expect(workout.movementIds).toHaveLength(count);
        expect(new Set(workout.movementIds).size).toBe(count);
      }
      const pool = strengthPoolGroups(category)[0].candidates.slice(0, 2).map(item => item.id);
      expect(generateStrengthWorkout(category, () => 0, pool, 6).movementIds).toHaveLength(2);
      for (const count of [0, 2, 7, 1.5, NaN]) expect(() => generateStrengthWorkout(category, () => 0, pool, count)).toThrow('3–6');
    }
  });

  it('creates varied, unique workouts with valid flowchart and diagram links', () => {
    for (const category of categories) {
      const combinations = new Set<string>();
      for (let i = 0; i < 80; i++) {
        let seed = i + 1;
        const workout = generateStrengthWorkout(category, () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 4294967296;
        });
        combinations.add(workout.movementIds.join(','));
        expect(workout.movementIds).toHaveLength(4);
        expect(new Set(workout.movementIds).size).toBe(workout.movementIds.length);
        const steps = workoutFlowSteps(workout.notes);
        expect(steps[0].text).toMatch(/^Warm-up:/);
        expect(steps.some(step => step.text.startsWith('Cool-down:'))).toBe(true);
        const moves = workout.movementIds.map(id => MOVE_GUIDES.find(move => move.id === id)!);
        for (const move of moves) {
          const movementSteps = steps.filter(step => !/^(?:Warm-up|Cool-down):/.test(step.text) && step.moves.some(candidate => candidate.id === move.id));
          expect(movementSteps.length, move.name).toBeGreaterThan(0);
          expect(strengthSummary(workout.notes).some(line => line.startsWith(`${move.name}:`)), move.name).toBe(true);
          if (category === 'mobility') expect(['Mobility', 'Balance & control']).toContain(moveCategory(move));
          else expect(moveCategory(move).toLowerCase()).toBe(category);
        }
        expect(strengthDurationLabel(workout.notes)).toBe(category === 'strength' ? 'Approx. 25–45 min' : 'Approx. 12–20 min');
        expect(guidesForNotes(workout.notes).length).toBeGreaterThanOrEqual(moves.length);
      }
      expect(combinations.size).toBeGreaterThan(10);
    }
  });

  it('prefers exercise selections that broaden body-area coverage', () => {
    for (const category of categories) {
      const workout = generateStrengthWorkout(category, () => 0);
      const primaryAreas = workout.movementIds.map(id => bodyAreas(MOVE_GUIDES.find(move => move.id === id)!)[0]);
      expect(new Set(primaryAreas).size).toBeGreaterThanOrEqual(3);
    }
  });

  it('selects both ends of each pool and rejects invalid random samples', () => {
    const candidates = strengthPoolGroups('strength').flatMap(group => group.candidates.map(item => item.id));
    const first = generateStrengthWorkout('strength', () => 0).movementIds;
    const last = generateStrengthWorkout('strength', () => 0.99999).movementIds;
    expect(first).toHaveLength(4);
    expect(last).toHaveLength(4);
    expect(first.every(id => candidates.includes(id))).toBe(true);
    expect(last.every(id => candidates.includes(id))).toBe(true);
    expect(last).not.toEqual(first);
    for (const sample of [-1, 1, NaN, Infinity]) expect(() => generateStrengthWorkout('mobility', () => sample)).toThrow('Random sample');
  });

  it('uses only the selected pool and rejects exercises from another category', () => {
    for (const category of categories) {
      const groups = strengthPoolGroups(category);
      const selected = groups.flatMap(group => group.candidates.map(item => item.id)).slice(0, 2);
      expect(generateStrengthWorkout(category, () => 0, selected, Math.max(3, selected.length)).movementIds.sort()).toEqual([...selected].sort());
      expect(generateStrengthWorkout(category, () => 0, selected.slice(1)).movementIds).toEqual(selected.slice(1));
      const focused = groups[0].candidates.slice(0, 3).map(item => item.id);
      expect(generateStrengthWorkout(category, () => 0, focused).movementIds.sort()).toEqual([...focused].sort());
      expect(generateStrengthWorkout(category, () => 0, [selected[0], selected[0]]).movementIds).toEqual([selected[0]]);
      expect(() => generateStrengthWorkout(category, () => 0, [])).toThrow('Choose at least one exercise');
      expect(() => generateStrengthWorkout(category, () => 0, [...selected, 'unknown'])).toThrow('not suitable');
      expect(new Set(groups.flatMap(group => group.candidates.map(item => item.id))).size)
        .toBe(groups.flatMap(group => group.candidates).length);
    }
    expect(() => generateStrengthWorkout('mobility', () => 0, ['single-slider'])).toThrow('not suitable');
    expect(() => generateStrengthWorkout('pilates', () => 0, ['single-slider'])).toThrow('not suitable');
  });

  it('supplies a dose and correct diagram link for every selectable movement', () => {
    for (const category of categories) {
      for (const group of strengthPoolGroups(category)) {
        for (const candidate of group.candidates) {
          const workout = generateStrengthWorkout(category, () => 0, [candidate.id]);
          expect(workout.movementIds).toContain(candidate.id);
          expect(workout.notes).toContain(candidate.dose);
          expect(workoutFlowSteps(workout.notes).some(step => step.moves.some(move => move.id === candidate.id))).toBe(true);
          const move = MOVE_GUIDES.find(item => item.id === candidate.id)!;
          expect(strengthSummary(workout.notes).some(line => line.startsWith(`${move.name}:`)), move.name).toBe(true);
        }
      }
    }
  });

  it('uses a distinct supine running-control drill instead of a second swimming exercise', () => {
    const pilates = strengthPoolGroups('pilates').flatMap(group => group.candidates);
    expect(pilates).toHaveLength(20);
    expect(pilates.some(item => item.id === 'supine-knee-fold')).toBe(true);
    expect(pilates.some(item => item.id === 'pilates-swimming-prep')).toBe(false);
    expect(pilates.some(item => item.id === 'prone-swimming')).toBe(true);
    const move = MOVE_GUIDES.find(item => item.id === 'supine-knee-fold')!;
    expect(move.name).toBe('Supine single-leg knee fold');
    expect(move.cue).toContain('pelvis level');
    const generated = generateStrengthWorkout('pilates', () => 0, [move.id]);
    expect(generated.notes).toContain(`${move.name}:`);
    expect(workoutFlowSteps(generated.notes).some(step => step.moves.some(candidate => candidate.id === move.id))).toBe(true);
  });

  it('builds completed entries for each activity without altering running mileage or existing sessions', () => {
    const plan = createDefaultPlan();
    for (const category of categories) {
      const generated = generateStrengthWorkout(category, () => 0);
      const workout = completedStrengthWorkout(generated, '2026-10-29', '2026-10-30', `guide-log-${category}`);
      expect(workout).toMatchObject({ date: '2026-10-29', completed: true, type: 'crossTraining', activity: category, distanceMiles: 0 });
      expect(workout.notes).toBe(`${generated.title}\n\n${generated.notes}`);
      expect(workoutFlowSteps(workout.notes)).toEqual(workoutFlowSteps(generated.notes));
      const next = addCompletedStrength(plan, workout);
      expect(weekStats(next.workouts)).toEqual(weekStats(plan.workouts));
      expect(() => addCompletedStrength(next, workout)).toThrow('already been saved');
      expect(() => addCompletedStrength({ ...plan, workouts: Array.from({ length: 10000 }, (_, index) => ({ ...workout, id: `existing-${index}`, notes: `Existing workout ${index}` })) }, workout)).toThrow('10,000-workout limit');
    }
    const generated = generateStrengthWorkout('strength', () => 0);
    for (const date of ['', '2026-02-30', '2026-10-31', '2019-12-31', '30/10/2026']) {
      expect(() => completedStrengthWorkout(generated, date, '2026-10-30', 'test')).toThrow('valid completion date');
    }
  });

  it('adds completed workouts as new entries and avoids identical duplicate sessions', () => {
    const plan = createDefaultPlan();
    const workout = completedStrengthWorkout(generateStrengthWorkout('strength', () => 0), '2026-10-30', '2026-10-30', 'strength-log-slot');
    const slot = plan.workouts.find(item => item.activity === 'strength' && item.date === workout.date)!;
    const next = addCompletedStrength(plan, workout);
    expect(next.workouts).toHaveLength(plan.workouts.length + 1);
    expect(next.workouts.find(item => item.id === slot.id)).toEqual(slot);
    expect(next.workouts.find(item => item.id === workout.id)).toEqual(workout);
    expect(addCompletedStrength(next, { ...workout, id: 'duplicate-workout' })).toBe(next);
  });
});
