import { beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { createDefaultPlan } from '../seed';

let CardContent: typeof import('./WorkoutCard')['CardContent'];
let WorkoutCard: typeof import('./WorkoutCard')['WorkoutCard'];
let WorkoutIcon: typeof import('./WorkoutCard')['WorkoutIcon'];
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
  const module = await import('./WorkoutCard');
  CardContent = module.CardContent;
  WorkoutCard = module.WorkoutCard;
  WorkoutIcon = module.WorkoutIcon;
});

describe('long-run pace split', () => {
  it('uses a reformer icon for Pilates workouts', () => {
    const plan = createDefaultPlan();
    const workout = { ...plan.workouts.find(item => item.activity === 'strength')!, activity: 'pilates' as const };
    const html = renderToStaticMarkup(createElement(WorkoutIcon, { workout }));
    expect(html).toContain('<svg');
    expect(html).toContain('M2 18h20');
    expect(html).toContain('aria-hidden="true"');
  });
  it('offers the fuelling editor on long runs only, retaining logs after a type change', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(workout => workout.type === 'long')!;
    const render = (workout: typeof run) => renderToStaticMarkup(createElement(WorkoutCard, {
      workout, settings: plan.settings, editingId: workout.id, setEditingId: () => undefined,
    }));
    expect(render(run)).toContain('Long-run fuelling log');
    expect(render({ ...run, type: 'easy' })).not.toContain('Long-run fuelling log');
    expect(render({ ...run, type: 'easy', fuellingLog: { entries: [], notes: 'Felt good.' } })).toContain('Long-run fuelling log');
    expect(render(run)).toContain('Save fuelling log');
  });
  it('keeps Track sessions simple and offers move/copy actions', () => {
    const plan = createDefaultPlan();
    const workout = { ...plan.workouts[0], type: 'track' as const, notes: '1 mi warm-up, 6 x 400 m, easy cool-down.' };
    const html = renderToStaticMarkup(createElement(WorkoutCard, {
      workout, settings: plan.settings, editingId: workout.id, setEditingId: () => undefined,
    }));
    expect(html).toContain('Session notes');
    expect(html).toContain(workout.notes);
    expect(html).not.toContain('Structured session');
    expect(html).toContain('Move to date');
    expect(html).toContain('Copy to date');
  });
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
