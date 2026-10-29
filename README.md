# Marathon Planner

A local-first React 18 + TypeScript training calendar for the 18 April 2027 marathon. No backend, account, API key, or external service is required.

## Run

Use Node.js 22.12+, 24+, or 26+.

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

Run unit tests with `npm test`.

## Revised plan (v2)

The app's default is the Python-validated [v2 plan](./marathon-plan-v2.json). The full [change log](./marathon-plan-v2-changes.txt) records before/after counts, every workout/setting change, weekly totals, main-set quality miles and the approved exception. Existing browser plans are **not overwritten**: import the v2 JSON to replace your saved calendar (undoable), or use the confirmed reset action to load the new default.

The half-marathon rehearsal is now **14 March**; the **16-mile easy long run is 7 March**. Only these Sunday sessions were swapped; other distances remain unchanged. The weeks of 1/8 March now total 38.9/37.1 miles. At the user's request, the resulting 7 March long-share and 15 March mileage-increase warnings stay visible rather than rebalancing easy runs. Python validation reports those two accepted warnings separately and still fails for unapproved breaches.

Regenerate from the original export with Python 3 (standard library only):

```sh
python3 scripts/revise_plan.py /path/to/marathon-plan.json marathon-plan-v2.json --app-default src/default-plan.json
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts -v
```

The script loads JSON, revises a copy, prints before/after counts, validates constraints and JSON round-trip, then writes the output and change log. Validation errors raise an exception and prevent writing. Keep the original export as the input for a meaningful before/after log.

Approved resolutions of conflicting requirements:

- Every Saturday before a Sunday long run is easy, not a steady/hard parkrun. Saturdays retain 3.1 miles except the 2-mile race-week shakeout.
- The weeks of 2 November and 23 November use 27.5 and 32.5 miles respectively, within the requested one-mile tolerance, so long-run share stays at or below 40%.
- The 21 March **20-mile easy run in a 46-mile week (43.48%)** is the sole approved long-run-share exception. It is documented, not silently treated as a normal 40% result.
- Mileage increases are compared with the last non-cut-back training week. The designated cut-backs (9 November, 18 January, 22 February), 8 March recovery, half/marathon race weeks and three taper weeks do not lower that reference; race mileage still counts in totals and increase validation.
- The four original hills/progression dates, styles, hill repetition counts and total distances stay. Notes now specify 1.5-mile warm-ups and 1-mile cool-downs; progression main sets move gradually from easy through MP to threshold. Time-based quality miles use the threshold midpoint; recovery jog miles use 9.375 min/mi. These are distance estimates, especially uphill, not measured elevation-adjusted miles.

## Use

- Click a card to edit it inline; click the circle to complete it.
- Hover over a card's info icon for session instructions, notes and pace/HR breakdowns without expanding the card. Keyboard focus or tapping the icon also opens the tooltip; Escape, tapping outside or moving away dismisses it. Notes remain editable on the card and are included in exports.
- Long runs with fast finishes show both portions directly on week/month cards (for example, first 12 mi easy at 9:00–9:45/mi, last 6 mi at MP at 8:00/mi). The info tooltip repeats the numeric split with the separate HR targets; it is not necessary to infer the finish pace from notes.
- Drag a card by its grip. Drop on a day in Week or Month view, or on a previous/next navigation arrow to move it to the same weekday in another week.
- Keyboard: focus the grip, press Space/Enter, use left/right for days and up/down for weeks, then Space/Enter to drop or Escape to cancel. Touch: hold the grip briefly before dragging.
- Change weeks with the arrows or calendar selector. The chart selector includes exact weekly totals and week-on-week percentage changes.
- Settings controls race details and the HR/pace training-zone boundaries. Workout-specific target paces are edited on calendar cards, not in Settings; saving Settings preserves existing run paces. Moving the race date moves the marathon card, not the whole skeleton.
- Settings > Additional races lets you add, edit or remove race dates and distances in your selected mi/km units, including the seeded half-marathon rehearsal. Save settings applies all race changes together; Cancel discards them. Added races become ordinary draggable race workouts, count toward mileage and warnings, and are included in backups and ICS exports. Existing sessions are not replaced. New races initially use the marathon-pace zone; edit their calendar cards for individual pace and notes.
- Settings > Default activity days sets suggested weekdays for running types and swim, ride, pilates, strength and badminton. Choose “Any day” to leave dates flexible (the default for easy runs, strides, rides and rest). The main Add workout button suggests the chosen type/activity's weekday within the selected week; its date remains editable. Adding from a calendar day deliberately keeps that date.
- Strength has a dedicated two-day setting, initially Tuesday/Friday. Tuesday is the main session: single-leg calf raises, split squats or step-ups, bridges and Romanian deadlifts. Friday is light core, hips and mobility only, with no heavy leg work. Alternate Friday Pilates from the exported plan is retained until the strength cutoff. No strength is scheduled after 6 April; those slots become 15-minute mobility, with rest/mobility only on race-week Friday.
- Ten distinct sessions rotate independently over five calendar weeks from 26 October: **Heavy 1–5** on Tuesdays and **Light 1–5** on Fridays, then repeat. Main sessions vary calf raises, split squats/step-ups, bridges, hinges and controlled squats; light sessions vary core control, hip activation, ankle work, balance and mobility. "Heavy" means the main resistance slot with available light dumbbells/kettlebells, not maximal lifting. Every card's info tooltip includes specific sets, reps, tempo and rest. Start with one set for the first two weeks if unfamiliar; taper prescriptions use one set. Rotation is tied to the calendar week so deleting a session does not shift later weeks. Rescheduling preserves existing notes. The shared routine data feeds Settings, new scheduled sessions and the Python-generated plan.
- Start strength with one easy set, progressing to two as tolerated, leaving 2–3 reps in reserve. Use controlled light loads, not maximum effort. Applying strength weekdays moves incomplete sessions and fills missing slots only until 12 days before the configured marathon. Completed/custom workouts and extra sessions are kept; the general weekday-apply option does not move strength.
- Settings includes five HR zones and six running pace zones with editable shared boundaries. Defaults are HR: under 118, 118–146, 147–160, 161–175, 176+ bpm; pace boundaries (20:00 5K reference): `[8.9833, 7.7333, 6.9333, 6.5, 6.1]` min/mi. Threshold is 7.1667–7.4167 min/mi (7:10–7:25). Pace tables show both mi/km; boundaries are edited in min/mi regardless of display units. Unchanged displayed boundaries retain their original decimal precision on Settings save.
- Every run shows its pace zone (or zone span), numeric target pace, HR zone and numeric HR range in both week and month views and in ICS exports. Pace zones are matched from the existing pace range, not forced onto workouts. Shared pace boundaries belong to the faster zone; open end zones cover all other paces. Grade-adjusted zones are a reference: elevation adjustment is not calculated, and raw pace on hills can be slower.
- Default HR targets are easy/long Z2, threshold Z4, marathon pace/parkrun/race Z3 and strides Z5; change these by run type in Settings or override an individual run's HR zone on its card. Zone edits immediately update existing run targets without changing pace, distance or date. Easy default HR caps follow the top of Z2; explicit custom caps remain visible and unchanged. Mixed quality sessions use the zone for the work portion, not the warm-up. These are personal planning references, not medical guidance.
- Weekday preferences do not move existing sessions unless “Apply to existing workouts” is checked. Applying moves incomplete matching sessions within their current Monday–Sunday week; completed workouts and dated races never move. Collisions are allowed and warnings update normally. Saving is one undoable change; Cancel discards edits. Preferences persist and are included in JSON backups; older backups acquire the original weekday defaults.
- Export JSON for a complete backup; import validates and confirms replacement. ICS exports all-day calendar events with stable IDs, pace, HR, completion and notes.
- Undo/redo covers workout edits, moves, completion, settings, imports and resets. The last 100 edits are held in memory; history resets on reload. Cmd/Ctrl+Z undoes; Shift+Cmd/Ctrl+Z or Ctrl+Y redoes.
- The plan and theme are saved to this browser's localStorage. Export a backup before clearing browser storage. Storage and import errors appear in the interface.

## Default plan

The skeleton spans 25 Monday-to-Sunday weeks from 26 October 2026. Seven base weeks lead into the 18-week plan starting 14 December. It includes the prescribed base long runs, a 14 March half-marathon rehearsal, a 20-miler on 21 March, and a three-week taper beginning 29 March.

Weekly targets are running mileage; cross-training does not add running miles. Thursday notes specify warm-up, main set, recoveries, cool-down and main-set quality miles. MP work is continuous at 8:00/mi; threshold repetitions use 7:10–7:25 with 2.5-minute jog recoveries. Duration sums easy/work portions for structured Thursday, progression and long-finish sessions; time-based quality mileage and hill moving time remain estimates. All easy/long runs use 9:00–9:45/mi with HR cap 146.

The final week includes 16 pre-race miles plus the 26.2-mile marathon (42.2 total): Tuesday 5, Wednesday 4 including 4 × 20-second strides plus an easy swim, Thursday 5 including 2 at MP, Saturday 2 including four relaxed strides. Monday is an easy swim and Friday rest/mobility only. No race-week strength or badminton. Warnings never prevent a move. Easy parkruns are not hard days; steady parkruns are. Light Wednesday evening badminton (about 90 minutes, no hard matches) is allowed before quality and long runs, but none is allowed from 12 April.

Two long runs include marathon-pace finishes: 31 January (16 mi, last 4 at MP) and 14 February (18 mi, last 6 at MP). The 28 February long run is 14 easy miles and 7 March is 16 easy miles, without fast finishes. Cards' info tooltips and ICS exports show both portions; duration uses each portion's pace. Easy pace/HR/cap apply before the finish; the finish uses its saved MP pace and current MP HR zone. These remain long runs but count as hard days. Edit or clear the finish distance on the card.

Four threshold slots retain variety: 17 December has 6 × 45-second hill repeats, 31 December has 8 × 45-second hill repeats, and 14/28 January have progression runs. Hills use controlled effort rather than a raw uphill pace target, with easy warm-up, downhill recovery and cool-down inside the total distance. Their moving-time estimate is approximate and excludes stopped recovery. V2 progression notes explicitly list easy/MP/threshold portions after the warm-up and before the cool-down; duration sums those portions. Older plans without that breakdown retain their original 40/30/20/10 split. Info tooltips and ICS show instructions/targets. These sessions remain in the threshold category for HR defaults, scheduling and hard-day warnings.

Countdown and the Today marker use the device's current local date, rather than a hard-coded demonstration date. Phase labels follow the base/build/peak schedule and the three weeks ending on the configured race week.

## Structure

```text
src/
  model.ts                  Types, pace/duration/unit and calendar helpers
  seed.ts                   Clones the validated v2 default
  default-plan.json         Python-generated default (same schema as exports)
  races.ts                  Additional-race form conversion and validation
  schedule.ts               Default weekday suggestions and optional rescheduling
  zones.ts                  HR targets, pace-zone matching and boundary validation
  strength.ts               Twice-weekly strength scheduling and equipment routines
  store.ts                  Zustand state, persistence, history and import validation
  rules.ts                  Seven live planning rules
  files.ts                  JSON download and RFC 5545 ICS export
  App.tsx                   App shell, drag orchestration and planning actions
  main.tsx                  React entry point
  styles.css                Responsive light/dark theme and Tailwind entry
  components/
    WeekBoard.tsx
    DayColumn.tsx
    WorkoutCard.tsx
    MonthOverview.tsx
    MileageChart.tsx
    RuleWarnings.tsx
    SettingsPanel.tsx
    AddWorkout.tsx
    Modal.tsx
  *.test.ts                 Calculation, seed, warning and export tests
```

Built with Vite, Tailwind CSS, dnd-kit core/sortable, Zustand, date-fns, Recharts, Lucide icons and Vitest.
