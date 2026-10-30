import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import routines from './strength-routines.json';
import { bodyAreas, moveDifficulty, equipmentTags, guidesForNotes, MOVE_GUIDES, MOVE_PROGRESSIONS, workoutFlowSteps, strengthDurationLabel } from './strength-guide';
import { StrengthPage, ExerciseDiagram, EquipmentLabels, WorkoutFlow } from './components/StrengthPage';
import { strengthNotes } from './strength';

describe('illustrated strength guide', () => {
  it('shows the exercise name only in its diagram link, retaining set instructions', () => {
    const html = renderToStaticMarkup(createElement(WorkoutFlow, {
      notes: 'Warm-up: 3 min walking.\nGlute bridges: 2 sets x 12 reps. Rest 60 s between sets.',
      onMovement: () => undefined,
    }));
    expect(html).toContain('Set 1 of 2 - 12 reps.');
    expect(html).toContain('Set 2 of 2 - 12 reps.');
    expect(html).not.toContain('Glute bridges:');
    expect(html).toContain('view Glute bridge');
    expect(html).toContain('Warm-up:');
    expect(html).toContain('Cool-down:');
  });
  it('rates all 60 standard movements with explicit difficulty levels', () => {
    for (const move of MOVE_GUIDES) expect(['Easy', 'Medium', 'Hard']).toContain(moveDifficulty(move));
    expect(new Set(MOVE_GUIDES.map(moveDifficulty)).size).toBe(3);
    expect(moveDifficulty(MOVE_GUIDES.find(move => move.id === 'walk')!)).toBe('Easy');
    expect(moveDifficulty(MOVE_GUIDES.find(move => move.id === 'plank')!)).toBe('Medium');
    expect(moveDifficulty(MOVE_GUIDES.find(move => move.id === 'single-rdl')!)).toBe('Hard');
  });
  it('assigns distinct body-area labels to all 60 movements', () => {
    for (const move of MOVE_GUIDES) {
      expect(bodyAreas(move).length).toBeGreaterThan(0);
      expect(new Set(bodyAreas(move)).size).toBe(bodyAreas(move).length);
    }
    expect(bodyAreas(MOVE_GUIDES.find(move => move.id === 'deadbug')!)).toEqual(['Core']);
    expect(bodyAreas(MOVE_GUIDES.find(move => move.id === 'bridge')!)).toContain('Glutes');
    expect(bodyAreas(MOVE_GUIDES.find(move => move.id === 'floor-press')!)).toContain('Chest');
    expect(bodyAreas(MOVE_GUIDES.find(move => move.id === 'biceps')!)).toEqual(['Arms']);
  });
  it('shows the prescribed total duration for all ten routines without confusing rest or warm-up time', () => {
    const expected = ['30–40', '15–20', '30–40', '15–20', '30–40', '15', '35–40', '15', '30–40', '15'];
    routines.routines.forEach((routine, index) => {
      expect(strengthDurationLabel(routine.exercises.join('\n\n'))).toBe(`Approx. ${expected[index]} min`);
    });
    expect(strengthDurationLabel(strengthNotes(0, '2027-03-29', '2027-04-18'))).toBe('30–40 min standard; shorter with taper sets');
    expect(strengthDurationLabel(routines.mobility)).toBe('Approx. 15 min');
    expect(strengthDurationLabel('Warm-up: 5 min walking. Rest 30 s.')).toBe('Duration not specified');
  });
  it('links all ten routines in prescription order and preserves alternatives and recovery instructions', () => {
    for (const routine of routines.routines) {
      const notes = routine.exercises.join('\n\n');
      const steps = workoutFlowSteps(notes);
      expect(steps[0].text).toMatch(/^Warm-up:/);
      expect(steps.some(step => step.text.startsWith('Cool-down:'))).toBe(true);
      expect(steps.some(step => /^Rest \d+(?:-\d+)?s between sets/.test(step.text))).toBe(true);
      for (const line of routine.exercises.filter(line => /2 sets x/.test(line))) {
        const name = line.split(':')[0];
        expect(steps.filter(step => step.text.includes(name) && /^Set [12] of 2/.test(step.text))).toHaveLength(2);
      }
      const html = renderToStaticMarkup(createElement(WorkoutFlow, { notes, onMovement: () => undefined }));
      expect(html).toContain('<ol>');
      expect(html.match(/<li(?:\s[^>]*)?>/g)).toHaveLength(steps.length);
      expect(html).toContain('Step 1: view Walking / marching');
    }
    const heavy = workoutFlowSteps(routines.routines[0].exercises.join('\n\n'));
    expect(heavy.some(step => step.text.includes('compromises Thursday running'))).toBe(false);
    const split = heavy.find(step => step.text.includes('Supported split squats'))!;
    expect(split.moves.map(move => move.id)).toEqual(['split', 'step']);
    expect(split.text).toContain('do not do both');
  });
  it('renders step checkboxes, progress and explicit one-click rest choices', () => {
    const notes = 'Warm-up: 3 min walking.\nGlute bridges: 2 sets x 12 reps. Rest 60 s between sets.\nRest 60-90 s between exercises.\nDead bug: 1 set x 6 reps.';
    const steps = workoutFlowSteps(notes);
    const html = renderToStaticMarkup(createElement(WorkoutFlow, { notes, onMovement: () => undefined, onRest: () => undefined }));
    expect(html.match(/type="checkbox"/g)).toHaveLength(steps.length);
    expect(html).toContain(`0 of ${steps.length} steps complete`);
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('start 60s rest');
    expect(html).toContain('start 90s rest');
  });
  it('uses the saved taper prescription, keeps custom instructions and excludes only routine metadata', () => {
    const steps = workoutFlowSteps(strengthNotes(0, '2027-03-29', '2027-04-18'));
    expect(steps[0].text).toMatch(/^Warm-up:/);
    expect(steps.some(step => step.text.startsWith('Set 1 of 1'))).toBe(true);
    expect(steps.some(step => step.text.includes('between sets'))).toBe(false);
    expect(steps.at(-1)?.text).toContain('Taper: 1 easy set');
    expect(steps.some(step => step.text.startsWith('Five-week rotation:'))).toBe(false);
    expect(workoutFlowSteps('My custom warm-up\n\nCustom movement: 3 x 5; rest 60 s.')).toEqual([
      { text: 'My custom warm-up', moves: [] }, { text: 'Custom movement: 3 x 5; rest 60 s.', moves: [] },
    ]);
  });
  it('separates sets, rest and cool-down without repeating the prescribed work', () => {
    const steps = workoutFlowSteps('Warm-up: 3 min marching.\nGlute bridges: 2 sets x 12 reps. Rest 60 s between sets.\nRest 75 s between exercises. Cool down with 2 min walking.');
    expect(steps.slice(1, 4).map(step => step.text)).toEqual([
      'Set 1 of 2 - Glute bridges: 12 reps.',
      'Rest 60s between sets.',
      'Set 2 of 2 - Glute bridges: 12 reps.',
    ]);
    expect(steps.filter(step => step.text.startsWith('Cool-down:'))).toHaveLength(1);
    expect(steps[0].text).toContain('seated heel lifts');
    expect(steps.at(-1)?.text).toContain('seated ankle circles');
  });
  it('keeps total duration in the header rather than a numbered workout step', () => {
    for (const routine of routines.routines) {
      const notes = routine.exercises.join('\n\n');
      expect(workoutFlowSteps(notes).some(step => /(?:allow )?about \d+(?:[-–]\d+)? min/i.test(step.text))).toBe(false);
      expect(strengthDurationLabel(notes)).toMatch(/^Approx\./);
    }
    const notes = 'Warm-up: 3 min walking.\nCool-down: 2 min walking.\nAbout 12-15 min total. Bodyweight only.';
    expect(workoutFlowSteps(notes).at(-1)?.text).toMatch(/^Cool-down:/);
    expect(strengthDurationLabel(notes)).toBe('Approx. 12–15 min');
  });
  it('labels every move with equipment icons and distinguishes optional and alternative weights', () => {
    for (const move of MOVE_GUIDES) {
      const tags = equipmentTags(move);
      expect(tags.length, move.name).toBeGreaterThan(0);
      expect(new Set(tags.map(tag => tag.kind)).size).toBe(tags.length);
      const html = renderToStaticMarkup(createElement(EquipmentLabels, { move }));
      expect(html.match(/<svg/g)).toHaveLength(tags.length);
      for (const tag of tags) expect(html).toContain(tag.label);
    }
    expect(equipmentTags(MOVE_GUIDES.find(move => move.id === 'step')!)).toContainEqual({ kind: 'dumbbell', label: 'Dumbbells optional' });
    expect(equipmentTags(MOVE_GUIDES.find(move => move.id === 'rdl')!)).toContainEqual({ kind: 'kettlebell', label: 'Or kettlebell' });
    expect(equipmentTags(MOVE_GUIDES.find(move => move.id === 'band-pull')!)).toEqual([{ kind: 'band', label: 'Resistance band' }]);
  });
  it('covers every prescribed movement line across all ten routines and mobility', () => {
    expect(MOVE_GUIDES).toHaveLength(60);
    expect(new Set(MOVE_GUIDES.map(m => m.id)).size).toBe(MOVE_GUIDES.length);
    expect(routines.routines).toHaveLength(10);
    for (const routine of routines.routines) {
      for (const line of routine.exercises.filter(line => !line.startsWith('Rest ') && !line.startsWith('Bodyweight ') && !line.startsWith('Move slowly'))) {
        expect(guidesForNotes(line).length, line).toBeGreaterThan(0);
      }
    }
    const mobility = guidesForNotes(routines.mobility).map(m => m.id);
    expect(mobility).toEqual(expect.arrayContaining(['walk', 'ankle-circle', 'ankle-rock', 'seated-hip', 'cat', 'open-book', 'calf-stretch', 'hip-stretch']));
    expect(guidesForNotes('Custom exercise, ask your coach')).toEqual([]);
  });
  it('adds 31 distinct equipment-appropriate options with explicit starting doses', () => {
    const additions = MOVE_GUIDES.slice(29);
    expect(additions).toHaveLength(31);
    expect(new Set(MOVE_GUIDES.map(move => move.name)).size).toBe(60);
    for (const move of additions) {
      expect(move.equipment).toBeTruthy();
      expect(move.prescription).toMatch(/set|carr/);
      expect(move.poses[0]).not.toEqual(move.poses[1]);
      expect(guidesForNotes(move.name)).toContain(move);
      const html = renderToStaticMarkup(createElement(ExerciseDiagram, { move }));
      expect(html).toContain('Equipment:');
      expect(html).toContain('Reference starting dose:');
    }
    expect(additions.filter(move => /band/i.test(move.equipment ?? '')).length).toBeGreaterThanOrEqual(6);
    expect(additions.filter(move => /dumbbell/i.test(move.equipment ?? '')).length).toBeGreaterThanOrEqual(10);
  });
  it('renders two labelled original diagrams and a technique cue for every move', () => {
    for (const move of MOVE_GUIDES) {
      const html = renderToStaticMarkup(createElement(ExerciseDiagram, { move }));
      expect(html.match(/role="img"/g)).toHaveLength(MOVE_PROGRESSIONS[move.id]?.pose ? 3 : 2);
      expect(html).toContain(move.cue);
      expect(html).toContain('<figcaption>');
    }
  });
  it('offers optional progressions without expanding the 60-move library or prescribing extra workload', () => {
    expect(Object.keys(MOVE_PROGRESSIONS)).toHaveLength(12);
    for (const [id, progression] of Object.entries(MOVE_PROGRESSIONS)) {
      const move = MOVE_GUIDES.find(item => item.id === id);
      expect(move).toBeDefined();
      const html = renderToStaticMarkup(createElement(ExerciseDiagram, { move: move! }));
      expect(html).toContain(progression.title);
      expect(html).toContain('Replace the original variation');
      expect(html).toContain('Keep light/recovery and taper sessions easy');
    }
    expect(MOVE_PROGRESSIONS.plank.title).toBe('Side plank from feet');
    expect(MOVE_PROGRESSIONS.plank.pose).toBeDefined();
    expect(MOVE_GUIDES).toHaveLength(60);
  });
  it('renders a dedicated page without requiring scheduled sessions', () => {
    const html = renderToStaticMarkup(createElement(StrengthPage, { workouts: [], weeks: ['2026-10-26'], selectedWeek: '2026-10-26', onWeekChange: () => undefined }));
    expect(html).toContain('<h1>');
    expect(html).toContain('Strength studio');
    expect(html).toContain('Strength workout week');
    expect(html).toContain('No strength workout scheduled this week');
    expect(html).toContain('Rest timer');
    expect(html).toContain(`All moves (${MOVE_GUIDES.length})`);
  });
});
