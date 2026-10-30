import { describe, expect, it } from 'vitest';
import { addCompletedStrength, completedStrengthWorkout, generateStrengthWorkout, strengthPoolCoverage, strengthPoolGroups } from './random-strength';
import { bodyAreas, equipmentTags, guidesForNotes, moveDifficulty, MOVE_GUIDES, strengthDurationLabel, workoutFlowSteps, strengthSummary } from './strength-guide';
import { createDefaultPlan } from './seed';
import { weekStats } from './model';

describe('balanced random strength workouts', () => {
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
        expect(workout.movementIds).toHaveLength(intensity === 'heavy' ? 5 : 4);
        expect(new Set(workout.movementIds).size).toBe(workout.movementIds.length);
        const steps = workoutFlowSteps(workout.notes);
        expect(steps[0].text).toMatch(/^Warm-up:/);
        for (const id of workout.movementIds) {
          const movementSteps = steps.filter(step => !step.text.startsWith('Cool-down:') && step.moves.some(move => move.id === id));
          const dose = workout.notes.split('\n').find(line => line.startsWith(`${MOVE_GUIDES.find(move => move.id === id)!.name}:`))!;
          expect(movementSteps).toHaveLength(Number(dose.match(/(\d+) sets? x/)![1]));
          for (const step of movementSteps) expect(step.text).toMatch(/set/i);
        }
        expect(steps.some(step => /^Rest \d/.test(step.text))).toBe(true);
        expect(steps.filter(step => step.text.startsWith('Cool-down:'))).toHaveLength(1);
        expect(strengthDurationLabel(workout.notes)).toBe(intensity === 'heavy' ? 'Approx. 25–45 min' : 'Approx. 12–15 min');
        const moves = workout.movementIds.map(id => MOVE_GUIDES.find(move => move.id === id)!);
        if (intensity === 'heavy') {
          const areas = new Set(moves.flatMap(bodyAreas));
          for (const area of ['Legs', 'Calves', 'Core'] as const) expect(areas.has(area)).toBe(true);
          expect(bodyAreas(moves[3]).some(area => ['Chest', 'Back', 'Arms', 'Shoulders'].includes(area))).toBe(true);
          expect(moves.filter(move => moveDifficulty(move) === 'Hard').length).toBeLessThanOrEqual(1);
        } else {
          expect(moves.flatMap(equipmentTags).some(tag => ['dumbbell', 'band', 'kettlebell'].includes(tag.kind))).toBe(false);
          expect(workout.notes).toContain('Bodyweight only, no heavy leg work');
        }
        expect(guidesForNotes(workout.notes).length).toBeGreaterThanOrEqual(moves.length);
      }
      expect(combinations.size).toBeGreaterThan(10);
    }
  });
  it('selects both ends of each pool and rejects invalid random samples', () => {
    expect(generateStrengthWorkout('heavy', () => 0).movementIds).toEqual(['split', 'rdl', 'calf', 'db-row', 'deadbug']);
    expect(generateStrengthWorkout('heavy', () => 0.99999).movementIds).toEqual(['offset-squat', 'hinge-drive', 'wall-soleus', 'band-rotation', 'wall-march-hold']);
    for (const sample of [-1, 1, NaN, Infinity]) expect(() => generateStrengthWorkout('light', () => sample)).toThrow('Random sample');
  });
  it('uses only the selected pool and requires every balance group', () => {
    for (const intensity of ['light', 'heavy'] as const) {
      const groups = strengthPoolGroups(intensity);
      const selected = groups.map(group => group.candidates[0].id);
      expect(strengthPoolCoverage(intensity, selected)).toEqual([]);
      expect(generateStrengthWorkout(intensity, () => 0.5, selected).movementIds).toEqual(selected);
      expect(strengthPoolCoverage(intensity, selected.slice(1))).toEqual([groups[0].label]);
      expect(() => generateStrengthWorkout(intensity, () => 0, selected.slice(1))).toThrow('Choose at least one exercise');
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
          const ids = groups.map((group, i) => i === index ? candidate.id : group.candidates[0].id);
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
  it('avoids multiple hard movements and gives a clear error for an impossible selected pool', () => {
    const ids = ['rear-elevated-split', 'single-slider', 'calf', 'db-row', 'deadbug'];
    expect(() => generateStrengthWorkout('heavy', () => 0, ids)).toThrow('at most one Hard');
    const possible = ['rear-elevated-split', 'rdl', 'calf', 'db-row', 'deadbug', 'hip-airplane'];
    const generated = generateStrengthWorkout('heavy', () => 0.999, possible);
    expect(generated.movementIds).toContain('rear-elevated-split');
    expect(generated.movementIds).not.toContain('hip-airplane');
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
