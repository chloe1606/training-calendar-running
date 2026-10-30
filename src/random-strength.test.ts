import { describe, expect, it } from 'vitest';
import { generateStrengthWorkout } from './random-strength';
import { bodyAreas, equipmentTags, guidesForNotes, MOVE_GUIDES, strengthDurationLabel, workoutFlowSteps } from './strength-guide';

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
          expect(movementSteps).toHaveLength(intensity === 'heavy' ? 2 : 1);
          for (const step of movementSteps) expect(step.text).toMatch(/set/i);
        }
        expect(steps.some(step => /^Rest \d/.test(step.text))).toBe(true);
        expect(steps.filter(step => step.text.startsWith('Cool-down:'))).toHaveLength(1);
        expect(strengthDurationLabel(workout.notes)).toBe(intensity === 'heavy' ? 'Approx. 35–45 min' : 'Approx. 12–15 min');
        const moves = workout.movementIds.map(id => MOVE_GUIDES.find(move => move.id === id)!);
        if (intensity === 'heavy') {
          const areas = new Set(moves.flatMap(bodyAreas));
          for (const area of ['Legs', 'Glutes', 'Calves', 'Core'] as const) expect(areas.has(area)).toBe(true);
          expect(moves.some(move => bodyAreas(move).some(area => ['Chest', 'Back', 'Arms'].includes(area)))).toBe(true);
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
    expect(generateStrengthWorkout('heavy', () => 0.99999).movementIds).toEqual(['reverse-lunge', 'bridge', 'seated-calf', 'wall-push', 'plank']);
    for (const sample of [-1, 1, NaN, Infinity]) expect(() => generateStrengthWorkout('light', () => sample)).toThrow('Random sample');
  });
});
