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

The current revision reflects a second marathon and ten years of running, while retaining a gradual build from a 25-mile weekly baseline. It builds through 30–35-mile weeks before reaching 40–45, with cut-backs on 9/30 November, 28 December, 18 January and 22 February. Normal weeks have two hard days: short Tuesday threshold/hills and Thursday quality. On MP-finish weeks, Tuesday is easy and Thursday/Sunday are the hard days. Cut-back, half-marathon, post-half recovery and taper weeks stay lighter. The half remains **14 March**, now targeting a raced **7:20–7:30/mi** range in a **32-mile week**; start near 7:30 for the first 2–3 miles and only progress if controlled. The preceding Thursday is easy. The marathon goal remains 3:30:00. The **20-miler remains 21 March** by explicit user choice, with an easy Thursday and no fast finish. Reassess it after the harder half: shorten to 16–18 miles or rest if not recovered; do not make up missed mileage. Comfortably stopping around three hours is preferable to chasing distance.

Regenerate from the original export with Python 3 (standard library only):

```sh
python3 scripts/revise_plan.py /path/to/marathon-plan.json marathon-plan-v2.json --app-default src/default-plan.json
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts -v
```

The script loads JSON, revises a copy, prints before/after counts, validates constraints and JSON round-trip, then writes the output and change log. Validation errors raise an exception and prevent writing. Keep the original export as the input for a meaningful before/after log.

Current training decisions (supersede the original mileage/main-set prescription):

- Every Saturday before a Sunday long run is easy, not a steady/hard parkrun. Saturdays retain 3.1 miles except the 2-mile race-week shakeout.
- Weekly miles: `25, 27.5, 23, 29, 30, 26, 32, 33, 35, 30, 36, 38, 32, 40, 42.5, 45, 45, 36, 41, 32, 45, 40, 32, 24, 42.2`. The last total includes 16 pre-race miles plus the marathon. These are ceilings to work toward when recovering well, not an obligation to complete despite fatigue or pain.
- The conditional 21 March **20-mile easy run in a 45-mile week (44.44%)** is the sole planned long-run-share exception. Notes and the warning sidebar explicitly state the recovery condition and shorter alternative.
- Mileage increases are compared with the last non-cut-back training week. Designated cut-backs, half/marathon race weeks and three taper weeks do not lower that reference; race mileage still counts in totals and increase validation. The 10% and 40% checks are planning aids, not proof of safety.
- Normal-week Tuesday quality alternates short threshold and hills within the existing run distance: base threshold 2 × 5 minutes, early build 2 × 6, later build 3 × 5, with 2.5-minute jog recoveries; hills are 6 × 30 seconds in base and 6 × 45 seconds in build, with full downhill recovery. Each has 1.5 miles easy warm-up and 1 mile cool-down; remaining miles stay easy. Tuesday strength follows running, not before, and can be reduced or skipped if fatigued.
- Before MP-finish long runs, Tuesdays (26 January and 9 February) are easy; Thursdays (28 January and 11 February) have 3.5 miles continuous MP in 6 total. The half-marathon/recovery Thursdays (11/18 March) remain easy. The 25 March workout is 3 miles continuous MP; 8 April is 2 × 5 minutes threshold. Cut-back weeks reduce quality; taper weeks retain one short quality session, with Thursday MP plus Sunday marathon in race week.
- Hills remain on 17/31 December (6 × 45 seconds each) and a progression on 14 January. The 28 January progression is replaced by controlled MP. Time-based quality miles use the threshold midpoint; recovery jog miles use 9.375 min/mi. These are estimates, especially uphill, not measured elevation-adjusted miles.
- Monday swimming is optional easy recovery or complete rest. Strength stays submaximal; reduce sets or skip if recovery suffers. Friday remains light. Long-run notes prioritise conversational effort, familiar kit and gradually practised fuelling over forcing pace.

## Use

- Click a card to edit it inline; click the circle to complete it.
- Hover over a card's info icon for session instructions, notes and pace/HR breakdowns without expanding the card. Keyboard focus or tapping the icon also opens the tooltip; Escape, tapping outside or moving away dismisses it. Notes remain editable on the card and are included in exports.
- Long runs with fast finishes show both portions directly on week/month cards (for example, first 12 mi easy at 9:00–9:45/mi, last 6 mi at MP at 7:50–8:10/mi). The info tooltip repeats the numeric split with the separate HR targets; it is not necessary to infer the finish pace from notes.
- Drag a card by its grip. Drop on a day in Week or Month view, or on a previous/next navigation arrow to move it to the same weekday in another week.
- Keyboard: focus the grip, press Space/Enter, use left/right for days and up/down for weeks, then Space/Enter to drop or Escape to cancel. Touch: hold the grip briefly before dragging.
- Change weeks with the arrows or calendar selector. The chart selector includes exact weekly totals and week-on-week percentage changes.
- Settings controls race details and the HR/pace training-zone boundaries. Workout-specific target paces are edited on calendar cards, not in Settings; saving Settings preserves existing run paces. Moving the race date moves the marathon card, not the whole skeleton.
- Settings > Additional races lets you add, edit or remove race dates and distances in your selected mi/km units, including the seeded half-marathon rehearsal. Save settings applies all race changes together; Cancel discards them. Added races become ordinary draggable race workouts, count toward mileage and warnings, and are included in backups and ICS exports. Existing sessions are not replaced. New races initially use the marathon-pace zone; edit their calendar cards for individual pace and notes.
- Settings > Default activity days sets suggested weekdays for running types and swim, ride, pilates, strength and badminton. Choose “Any day” to leave dates flexible (the default for easy runs, strides, rides and rest). The main Add workout button suggests the chosen type/activity's weekday within the selected week; its date remains editable. Adding from a calendar day deliberately keeps that date.
- Strength has a dedicated two-day setting, initially Tuesday/Friday. Tuesday is the main session: single-leg calf raises, split squats or step-ups, bridges and Romanian deadlifts. Friday is light core, hips and mobility only, with no heavy leg work. Alternate Friday Pilates from the exported plan is retained until the strength cutoff. No strength is scheduled after 6 April; those slots become 15-minute mobility, with rest/mobility only on race-week Friday.
- Ten distinct sessions rotate independently over five calendar weeks from 26 October: **Heavy 1–5** on Tuesdays and **Light 1–5** on Fridays, then repeat. Main sessions vary calf raises, split squats/step-ups, bridges, hinges and controlled squats; light sessions vary core control, hip activation, ankle work, balance and mobility. "Heavy" means the main resistance slot with available light dumbbells/kettlebells, not maximal lifting. Every card's info tooltip includes specific sets, reps, tempo and rest. Start with one set for the first two weeks if unfamiliar; taper prescriptions use one set. Rotation is tied to the calendar week so deleting a session does not shift later weeks. Rescheduling preserves existing notes. The shared routine data feeds Settings, new scheduled sessions and the Python-generated plan.
- **Strength workouts** in the left navigation opens a dedicated page (`#strength`). Select a training week to view its actual saved strength notes (including taper adjustments), browse any of the ten reference routines, or choose **All moves** for 60 original, labelled two-position SVG diagrams and technique cues. Search by movement or equipment. The 31 additional options include calf/foot strength, single-leg control, band hip work, step variations, carries and upper-body exercises using 1–5 kg dumbbells, light resistance bands and a low stable step. Each new option lists equipment and a conservative starting dose. These are alternatives, not extra scheduled work: the ten routines and saved calendar are unchanged. Introduce unfamiliar moves gradually; inspect bands and use stable support. Diagrams are schematic guidance, not a technique assessment.
- The strength page includes a visual rest countdown with 30/45/60/75/90-second presets, custom whole-second durations from 1 to 3600, and start/pause/resume/reset controls. Changing the duration resets the countdown. It uses elapsed time, so delayed background ticks catch up. It continues when navigating back to the calendar, but resets on page reload; there is no sound or notification permission requirement.
- Every movement displays equipment icons and text labels even when collapsed: bodyweight, resistance band, dumbbells, kettlebell alternatives, step, chair, wall or support. Optional weights are labelled explicitly. Equipment labels are included in movement search.
- All 60 moves also show body-area labels when collapsed, including core, legs, glutes, hips, calves, feet/ankles, hamstrings, back, shoulders, chest and arms. Search includes these labels as well as movement names and equipment.
- Every move has a searchable Easy, Medium or Hard badge for its standard version's relative balance/control demands. Actual effort varies with load, resistance and experience; progressions may be harder. These movement ratings do not change running-calendar hard-day counts.
- Below the rest timer, select Light or Heavy and use **Generate workout** for a new balanced combination, not merely a random existing routine. Heavy draws five moves covering squat/step/lunge, posterior chain, calves, upper body and core; Light draws four gentle bodyweight core/hip/ankle/mobility moves. Warm-up, sets/reps/rest, estimated total time and diagram links appear in the usual flowchart. Generated workouts are previews only, survive in-app navigation, and clear on reload; they never modify the saved calendar or add extra workload automatically.
- A separate stopwatch above the rest timer counts elapsed hours/minutes/seconds with Start, Pause/Resume and Reset. Both timers run independently and continue during in-app navigation; reloading resets them.
- The flowchart expands prescribed sets into separate steps (Set 1 → Rest 60s → Set 2), keeps side-to-side rest instructions, and shows exercise-change rests and a dedicated cool-down. One-set taper sessions do not add a between-set rest. Warm-up and cool-down offer gentle side steps, walking or seated heel/ankle movements instead of marching; choose one alternative for the same time, not extra work. This is a display change, not a calendar rewrite.
- Twelve movements have expandable optional progressions, including a diagram for side plank from feet instead of knees, single-leg bridge/deadlift options, light band/weight additions and slower pauses/holds. Progressions replace a variation rather than adding sets or exercises. They leave the 60-move library and scheduled routines unchanged; light/recovery and taper sessions remain easy.
- Workout prescriptions appear as a numbered vertical flowchart, from warm-up through exercises to recovery. Each step retains its exact sets, reps, rests, alternatives and saved taper instructions. Movement buttons open and scroll to the corresponding diagrams below, with keyboard focus moved to the selected movement. Multi-movement warm-ups and alternative exercises have separate buttons; they do not imply extra sets or doing both alternatives.
- Workout titles and selector options show the approximate total duration already prescribed in the routine notes, including rests and warm-up/cool-down where specified. Taper sessions identify the standard duration as a reference and note that reduced sets take less time; custom notes without a total show “Duration not specified”.
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

Weekly targets are running mileage; cross-training does not add running miles. Thursday notes specify warm-up, main set, recoveries, cool-down and main-set quality miles. MP work is continuous at 7:50–8:10/mi, including progression MP portions, long-run finishes and the marathon race target range; the 3:30 goal and half-marathon pace are unchanged. Threshold repetitions use 7:10–7:25 with 2.5-minute jog recoveries. Duration sums easy/work portions for structured Thursday, progression and long-finish sessions; time-based quality mileage and hill moving time remain estimates. All easy/long runs use 9:00–9:45/mi with HR cap 146.

The final week includes 16 pre-race miles plus the 26.2-mile marathon (42.2 total): Tuesday 5, Wednesday 4 including 4 × 20-second strides plus an easy swim, Thursday 5 including 2 at MP, Saturday 2 including four relaxed strides. Monday is an easy swim and Friday rest/mobility only. No race-week strength or badminton. Warnings never prevent a move. Easy parkruns are not hard days; steady parkruns are. Light Wednesday evening badminton (about 90 minutes, no hard matches) is allowed before quality and long runs, but none is allowed from 12 April.

Two long runs include marathon-pace finishes: 31 January (16 mi, last 4 at MP) and 14 February (18 mi, last 6 at MP). The 28 February long run is 14 easy miles and 7 March is 16 easy miles, without fast finishes. Cards' info tooltips and ICS exports show both portions; duration uses each portion's pace. Easy pace/HR/cap apply before the finish; the finish uses its saved MP pace and current MP HR zone. These remain long runs but count as hard days. Edit or clear the finish distance on the card.

Three threshold slots retain variety: 17/31 December have 6 × 45-second controlled hill repeats, and 14 January has a progression. Hills use effort rather than a raw uphill pace target, with easy warm-up, downhill recovery and cool-down inside the total distance. Their moving-time estimate is approximate and excludes stopped recovery. Progression notes list easy/MP/threshold portions after the warm-up and before the cool-down; duration sums those portions. Older plans without that breakdown retain their original 40/30/20/10 split. Info tooltips and ICS show instructions/targets. These sessions remain in the threshold category for HR defaults, scheduling and hard-day warnings.

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
