# Calendar and data guide

[Back to the README](../README.md) · [Training plan](training-plan.md) · [Strength Studio](strength-studio.md)

## Edit and arrange sessions

- Click a card to edit; click its circle to toggle completion.
- Hover, focus or tap the info icon for instructions, notes and pace/HR breakdowns. Escape, tapping outside or moving away dismisses it.
- Drag by the grip onto a day in Week, Agenda or Month, or onto a previous/next navigation arrow to move to the same weekday in another week.
- Keyboard dragging: focus the grip, press Space/Enter, use left/right for days and up/down for weeks, then Space/Enter to drop or Escape to cancel.
- Touch dragging: hold the grip briefly before moving.
- **Move to date** and **Copy to date** use the saved workout: save edits first. Moving keeps completion; copying creates a new ID, starts incomplete and does not copy an actual fuelling log.

Agenda lists a Monday-Sunday week vertically and defaults at phone widths (760px or less). All views remain selectable. Change weeks with arrows or the calendar selector. Today uses the device's local date.

Track defaults to 4 miles total including a 1-mile warm-up; Cross country defaults to 5 miles. Both count as hard days and have editable distance, pace, notes, weekdays and HR targets. Their starting pace is the easy-zone reference, not a prescribed interval or off-road target. Track notes do not calculate total mileage automatically. Existing plans do not gain new runs automatically.

## Pace, duration and HR

Distances display to three significant figures (3.00 mi, 25.0 mi, 42.2 km); paces use minutes:seconds. Display rounding does not round stored values, calculations or exports. Saving an unchanged displayed distance preserves its precision.

Every run shows numeric pace, pace zone/span, HR zone and range. Fast-finish long runs show easy/MP distances and targets separately. Threshold cards show repetitions, target pace, recovery and warm-up/cool-down distances; tooltips provide the full breakdown. Structured-session duration sums the relevant portions; hill/time-based estimates are approximate.

Settings offers five HR zones and six pace zones with editable shared boundaries:

- HR defaults: under 118, 118-146, 147-160, 161-175, 176+ bpm.
- Pace boundaries: `[8.9833, 7.7333, 6.9333, 6.5, 6.1]` min/mi, based on a 20:00 5K reference.
- The global threshold range is 7.1667-7.4167 min/mi (7:10-7:25); see [browser refinements](training-plan.md#browser-threshold-refinements) for matching baseline intervals.
- Boundaries are edited in min/mi regardless of display units; tables show both mi/km. Unchanged displayed boundaries retain decimal precision.

Pace zones match the existing pace range rather than forcing workouts into a zone. Shared boundaries belong to the faster zone; open end zones cover other paces. Grade-adjusted zones are a reference only: the app does not calculate elevation adjustment.

Default HR targets: easy/long Z2, threshold Z4, marathon pace/parkrun/race Z3 and strides Z5. Change targets by run type in Settings or override a run's HR zone. Zone edits update targets without changing pace, distance or date. Easy default HR caps follow the top of Z2; explicit custom caps remain. Mixed quality uses the work portion's zone, not its warm-up. These are personal references, not medical guidance.

## Insights and warnings

**Plan insights** (`#insights`, with legacy `#mileage` links supported) includes planned/completed mileage, selected-week totals, a weekly comparison and warnings.

The marathon date and goal time come directly from saved Settings. Additional race dates/distances follow their saved calendar workouts. Week statuses use icons (history for past, clock for current, calendar-clock for upcoming), with accessible labels and hover titles. A green tick replaces the status icon when a nonzero planned mileage target is reached, using unrounded running-mile totals rather than rounded display values.

- Completed mileage is the saved distance of running workouts marked complete, not separately logged actual distance. Cross-training is excluded.
- Empty future weeks have no completed chart point and are labelled Upcoming.
- The Long run column lists full planned long-run distances, including faster finishes; multiple runs are listed individually. Race distance stays in totals, not that column.
- Race rows show date/distance highlights that follow added, moved or deleted races.
- Chart/table selectors inspect weeks without leaving Insights. **View selected week in calendar** opens that week.
- Both series and the comparison respect mi/km; selectors include weekly totals and week-on-week changes.

Warnings are advisory, not blockers. Easy parkruns are not hard days; steady parkruns are. See [training-plan constraints](training-plan.md) for progression and long-run exceptions.

## Settings and scheduling

Settings controls race details and shared HR/pace boundaries. Individual target paces are edited on cards; saving Settings preserves existing run paces. Moving the marathon date moves its card, not the whole plan skeleton.

**Additional races** supports adding/editing/removing dates and distances in mi/km, including the seeded half. Save applies changes together; Cancel discards them. Added races are ordinary draggable workouts, count toward totals/warnings and appear in backups/ICS. Existing sessions are not replaced. New races start with the marathon-pace zone; edit their pace/notes as needed.

**Default activity days** sets suggested weekdays for running types and swim, ride, mobility, Pilates, strength and badminton. "Any day" leaves dates flexible. The main Add workout button suggests that weekday in the selected week; adding from a day keeps that day.

Weekday preferences move nothing unless **Apply to existing workouts** is checked. Applying moves incomplete matching sessions within their Monday-Sunday week; completed workouts and dated races never move. Collisions are allowed and warnings update. The change is undoable, and defaults are included in JSON backups; older backups acquire the original weekday defaults.

Strength has dedicated two-day scheduling. Applying strength weekdays moves incomplete sessions and fills missing slots only until 12 days before the configured marathon. Completed/custom workouts and extra sessions are kept; the general weekday-apply option does not move strength.

## Long-run fuelling log

Open a long-run card and expand **Long-run fuelling log** below the workout editor. Record:

- Timing in minutes from run start (negative values for pre-run intake).
- Product/food, carbohydrate grams and fluid millilitres.
- Stomach comfort, energy and what to repeat/change in notes.

Totals update as you type. **Save fuelling log** is separate from workout Save and does not complete the run. Entries appear in the info tooltip, local storage, JSON and ICS descriptions, with undo/redo support. Moving preserves the log; copying starts empty. These are personal observations, not intake recommendations.

## Persistence, backups and undo

The plan and theme live in this browser's localStorage. There is no account or cross-device sync. Export before clearing browser storage.

**Import / Export** supports:

- Full JSON backup and restore, including settings, completion and notes.
- Validated, confirmed JSON replacement that can be undone.
- ICS all-day events with stable IDs, pace, HR, completion and notes.

Undo/redo covers edits, moves, completion, settings, imports and resets. The last 100 edits are held in memory; history resets on reload. Cmd/Ctrl+Z undoes; Shift+Cmd/Ctrl+Z or Ctrl+Y redoes. Storage/import errors appear explicitly in the interface.
