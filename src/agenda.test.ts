import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WeekBoard } from './components/WeekBoard';
import { createDefaultPlan } from './seed';

describe('weekly agenda', () => {
  it('reuses all seven day drop targets with full dates and existing workout controls', () => {
    const plan = createDefaultPlan();
    const html = renderToStaticMarkup(createElement(WeekBoard, {
      agenda: true, week: '2026-10-26', workouts: plan.workouts, settings: plan.settings,
      warningDates: new Map([['2026-10-27', 2]]), editingId: null,
      setEditingId: () => undefined, onAdd: () => undefined,
    }));
    expect(html).toContain('agenda-board');
    expect(html).toContain('Weekly agenda');
    expect(html).toContain('Monday');
    expect(html).toContain('Oct 2026');
    expect(html.match(/aria-label="Add workout on /g)).toHaveLength(7);
    expect(html).toContain('2 warnings');
    expect(html).toContain('aria-label="Edit ');
    expect(html).toContain('aria-label="Drag ');
    expect(html).toContain('aria-label="Complete:');
  });
  it('retains the horizontal week board when agenda is not selected', () => {
    const plan = createDefaultPlan();
    const html = renderToStaticMarkup(createElement(WeekBoard, {
      week: '2026-10-26', workouts: [], settings: plan.settings, warningDates: new Map(),
      editingId: null, setEditingId: () => undefined, onAdd: () => undefined,
    }));
    expect(html).not.toContain('agenda-board');
    expect(html).toContain('Week board');
    expect(html.match(/Recovery day/g)).toHaveLength(7);
  });
});
