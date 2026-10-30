import { beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { createDefaultPlan } from '../seed';

let CardContent: typeof import('./WorkoutCard')['CardContent'];
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
  CardContent = (await import('./WorkoutCard')).CardContent;
});

describe('long-run pace split', () => {
  it('shows easy and MP distances and paces in full and compact cards', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(w => w.date === '2027-02-14' && w.type === 'long')!;
    for (const compact of [false, true]) {
      const html = renderToStaticMarkup(createElement(CardContent, { workout: run, settings: plan.settings, compact }));
      expect(html).toContain('First 12 mi easy:');
      expect(html).toContain('9:00–9:45/mi');
      expect(html).toContain('Last 6 mi at MP:');
      expect(html).toContain('7:50–8:10/mi');
      expect(html).not.toContain('8:00–8:00');
    }
    const metric = renderToStaticMarkup(createElement(CardContent, { workout: run, settings: { ...plan.settings, units: 'km' } }));
    expect(metric).toContain('First 19.3 km easy:');
    expect(metric).toContain('Last 9.7 km at MP:');
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
