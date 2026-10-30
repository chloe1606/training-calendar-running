import { beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { createDefaultPlan } from '../seed';

let CardContent: typeof import('./WorkoutCard')['CardContent'];
let WorkoutCard: typeof import('./WorkoutCard')['WorkoutCard'];
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
  const module = await import('./WorkoutCard');
  CardContent = module.CardContent;
  WorkoutCard = module.WorkoutCard;
});

describe('long-run pace split', () => {
  it('offers completed strength summaries in a tooltip without expanding cards or editors', () => {
    const plan = createDefaultPlan();
    const workout = { ...plan.workouts.find(w => w.activity === 'strength')!, completed: true, notes: 'Dead bug: 2 sets x 6 reps.' };
    for (const editing of [false, true]) {
      const html = renderToStaticMarkup(createElement(WorkoutCard, {
        workout, settings: plan.settings, editingId: editing ? workout.id : null, setEditingId: () => undefined,
      }));
      expect(html).not.toContain('Dead bug');
      expect(html).toContain('Session details: Strength');
      expect(html).toContain('Mark incomplete: Strength');
      expect(html).toContain('aria-pressed="true"');
      expect(html).not.toContain('<textarea');
      if (editing) expect(html).toContain('Strength studio');
    }
    expect(workout.notes).toBe('Dead bug: 2 sets x 6 reps.');
    for (const other of [{ ...workout, completed: false }, { ...workout, notes: '' }]) {
      const html = renderToStaticMarkup(createElement(WorkoutCard, {
        workout: other, settings: plan.settings, editingId: null, setEditingId: () => undefined,
      }));
      expect(html).not.toContain('Session details: Strength');
    }
  });
  it('shows easy and MP distances and paces in full and compact cards', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(w => w.date === '2027-02-14' && w.type === 'long')!;
    for (const compact of [false, true]) {
      const html = renderToStaticMarkup(createElement(CardContent, { workout: run, settings: plan.settings, compact }));
      expect(html).toContain('First 12.0 mi easy:');
      expect(html).toContain('9:00–9:45/mi');
      expect(html).toContain('Last 6.00 mi at MP:');
      expect(html).toContain('7:50–8:10/mi');
      expect(html).not.toContain('8:00–8:00');
    }
    const metric = renderToStaticMarkup(createElement(CardContent, { workout: run, settings: { ...plan.settings, units: 'km' } }));
    expect(metric).toContain('First 19.3 km easy:');
    expect(metric).toContain('Last 9.66 km at MP:');
    expect(metric).toContain('4:52–5:04/km');
  });
  it('does not imply a fast finish for an all-easy long run', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(w => w.date === '2027-03-21' && w.type === 'long')!;
    const html = renderToStaticMarkup(createElement(CardContent, { workout: run, settings: plan.settings }));
    expect(html).not.toContain('at MP:');
    expect(html).toContain('9:00–9:45');
  });
});
