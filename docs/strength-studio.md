# Strength Studio guide

[Back to the README](../README.md) · [Calendar guide](calendar-guide.md)

## Open and browse

Choose **Strength workouts** in the navigation (`#strength`). The page opens on **All moves** rather than a preselected routine. A compact **Planned this week** summary shows Strength, Pilates and Mobility sessions for the calendar's selected week and highlights any scheduled today.

The 124-movement library includes running-focused calf/foot strength, single-leg control, band hip work, steps, carries, upper-body work and core control. Each movement has original two-position SVG diagrams and technique cues. Search by name, equipment, body area, category or difficulty.

Only the first five library exercises are shown initially. Use **Show all 124 exercises** to expand the list, or search the full library directly. Generated and selected workouts show all their matching exercises.

Collapsed movements show:

- Pink primary-category badges: Strength, Mobility, Stretch, Balance & control, Warm-up or Pilates.
- Easy/Medium/Hard ratings for the standard version's relative balance/control demands.
- Body areas such as core, legs, glutes, hips, calves, feet/ankles, hamstrings, back, shoulders, chest and arms.
- Equipment icons and labels: bodyweight, band, dumbbells, kettlebell alternatives, step, chair, wall or support. Optional loads are labelled.

Movement difficulty is not calendar hard-day status. Actual effort depends on load, resistance and experience. Diagrams are schematic guidance, not a technique assessment.

## Generate a workout

Choose a workout type:

| Type | Exercise pool |
| --- | --- |
| Mobility | 20 Mobility / Balance & control movements |
| Pilates | 20 Pilates movements |
| Strength | Strength-category movements only |

Select **3, 4, 5 or 6 exercises**, defaulting to four per type. Warm-up/cool-down are extra and do not count toward that number.

Expand **Choose exercises** to search and select a pool. **Select all** selects the current type's visible exercises; with a search active, **Select all results** adds matches while keeping hidden selections. **Clear pool** clears the whole current type, including hidden choices. Pools/counts are kept separately by type during the session.

**Generate workout** builds a fresh combination, not a fixed reference routine. It chooses unique movements and favors coverage of new body areas/categories where possible. A small or focused pool still works; if fewer movements are selected than requested, it uses all available ones once. Doses retain library prescriptions where available.

Preview/pool selections survive in-app navigation but reset on reload. Saved calendar entries persist independently.

## Follow a workout

The numbered flow runs from warm-up through exercises to cool-down. It expands sets into separate steps with between-set rests, retains side-to-side instructions and shows exercise-change rests. One-set taper sessions do not add a between-set rest.

- Check off steps to highlight the next unfinished one.
- Movement buttons open and scroll to the corresponding diagram, with keyboard focus.
- Alternatives and multi-movement warm-ups have separate links; they do not mean doing every alternative or adding extra sets.
- **Start Ns rest** starts/replaces the sidebar countdown. Ranges offer both endpoints. Inline rest instructions also get timer buttons; hold durations and rep tempo do not.
- Rest completion is checked manually, not automatically.
- Step progress stays during calendar navigation but clears when changing workouts/weeks, generating a workout or reloading. It does not mark the calendar workout complete.

**Summary notes**, initially collapsed, lists exercises and sets/reps once, including alternatives and saved taper doses. Durations use the approximate total prescribed in notes; custom sessions without totals say "Duration not specified". Taper sessions identify the standard total as a reference and explain that reduced sets take less time.

### Timers

The rest countdown has 30/45/60/75/90-second presets, custom whole seconds from 1 to 3600, and start/pause/resume/reset. Changing duration resets it. It uses elapsed time so delayed background ticks catch up.

A separate stopwatch counts elapsed hours/minutes/seconds. Both timers continue across in-app navigation and reset on reload. There is no sound or notification-permission requirement.

## Save and reopen

After doing a generated workout, use **Save workout** beneath the summary. **Workout date** defaults to today; future/invalid completion dates are rejected.

Saving adds a new completed Strength, Pilates or Mobility calendar entry with the generated notes. Existing planned/completed/custom sessions stay unchanged. An identical workout on the same date is not added again. Calendar info tooltips show the full saved notes without expanding the card; use the calendar to edit completion or delete entries.

Saves use normal localStorage persistence, undo/redo and JSON/ICS exports. A storage failure is reported rather than claiming persistence. Generating another preview does not delete saved sessions.

**Completed workout history** and the selector show completed supporting workouts from the last 30 days, newest first, across calendar weeks. Today is included and future dates are excluded. Unmarking/deleting a workout removes it from completed history.

Calendar strength slots have no routine assigned in advance. Defaults/reset and imported/saved legacy plans clear eligible incomplete automatic rotation notes, retaining completed/custom notes. The Python baseline still contains historical rotation data; browser cleanup does not rewrite it.

## Reference routines and progression

Ten reference routines (**Heavy 1-5**, **Light 1-5**) remain selectable but are not assigned to calendar days. Main references vary calf raises, split squats/steps, bridges, hinges and squats; light references vary core, hips, ankles, balance and mobility. "Heavy" means controlled resistance work, not maximal lifting.

Twelve movements offer expandable optional progressions: side plank from feet, single-leg bridge/deadlift options, light band/weight additions and slower pauses/holds. Progressions replace a variation instead of adding exercises/sets. Keep light/recovery and taper sessions easy; progress only when controlled, pain-free and leaving 2-3 reps in reserve.

Library options also include unilateral squats/lunges/steps, calf/soleus holds and slow lowers, heel-dig bridges/sliders, adductor/hip-flexor work, lateral-trunk/anti-rotation exercises, loaded marches and supported hip control. Sliders need a clear suitable floor and towels/sliders; adductor squeezes use a pillow. Advanced variants include easier alternatives in their cues.

For **Half-kneeling to step-up with knee drive**, keep the front foot on a low stable step, start with the rear knee on a mat, rise through the planted foot and drive the rear knee up. Return under control with the front foot still on the step.

Treat the library as alternatives, not extra scheduled work. Introduce one unfamiliar move at a time away from key runs/races, use light loads and stable support, inspect bands and avoid new demanding eccentric work during taper. No door anchors are needed. Start with one easy set, progress to two as tolerated, and reduce or skip if tired/sore.

Generated strength warm-up substitutions fit within the existing warm-up time: choose one easy squat/sit-to-stand or light mini-band lateral/diagonal walk option, not all. Warm-up/cool-down alternatives such as gentle side steps or seated heel/ankle movements are substitutions, not extra volume.

## Copy to Strava

Expand **Summary notes** and choose **Copy & open Strava**. This copies the title/exercises/reps and opens Strava's manual activity form. Paste into the description, select Weight Training or Workout, and enter date/duration before saving.

Nothing is submitted automatically and no Strava account connection is made. After copying succeeds, a fallback link appears if the browser blocks the new tab. Clipboard failures show an error; notes can be copied manually.
