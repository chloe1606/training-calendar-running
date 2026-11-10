# Included training plan

[Back to the README](../README.md) · [Python revision workflow](python-and-development.md)

## Scope and loading

The default is the Python-validated [v2 plan](../marathon-plan-v2.json). The [change log](../marathon-plan-v2-changes.txt) records counts, workout/setting changes, weekly totals, main-set quality miles and the approved exception.

The skeleton spans 25 Monday-to-Sunday weeks from 26 October 2026 to the 18 April 2027 marathon. Seven base weeks lead into the 18-week block starting 14 December. The goal is 3:30:00; the revision reflects a second marathon and ten years of running, building from a 25-mile weekly baseline.

Existing browser plans are **not overwritten**. Import the v2 JSON or confirm a reset to load the default. Keep a JSON backup first.

## Mileage and recovery

Weekly running-mile targets:

```text
25, 27.5, 23, 29, 30, 26, 32, 33, 35, 30, 36, 38, 32,
40, 42.5, 45, 45, 36, 41, 32, 45, 40, 32, 24, 42.2
```

Cross-training does not add running miles. The last total includes 16 pre-race miles plus the 26.2-mile marathon. Targets are ceilings to work toward when recovering well, not obligations despite fatigue or pain.

- Cut-back weeks begin 9/30 November, 28 December, 18 January and 22 February.
- Mileage increases use the last non-cut-back training week as reference. Designated cut-backs, half/marathon race weeks and three taper weeks do not lower that reference; race mileage still counts.
- Normal weeks have two hard days: short Tuesday threshold/hills and Thursday quality.
- Before MP-finish long runs, Tuesday is easy and Thursday/Sunday are hard days.
- Cut-back, half-marathon, post-half recovery and taper weeks stay lighter.
- Saturdays before Sunday long runs are easy, not steady/hard parkruns. They retain 3.1 miles except the 2-mile race-week shakeout.

The 10% mileage and 40% long-run-share checks are planning aids, not proof of safety. Warnings never prevent moving a session.

## Quality sessions

Normal-week Tuesday quality fits inside existing mileage:

- Base threshold: 2 x 5 minutes; early build: 2 x 6; later build: 3 x 5.
- Threshold recoveries: 2.5-minute easy jogs between repetitions.
- Hills: 6 x 30 seconds in base, 6 x 45 seconds in build, with full downhill recovery.
- Each has 1.5 miles easy warm-up and 1 mile cool-down; remaining miles stay easy.
- Tuesday strength follows running and can be reduced or skipped if fatigued.

Thursday notes specify warm-up, main set, recoveries, cool-down and main-set quality miles. MP work is continuous at 7:50-8:10/mi, including progression MP portions and long-run finishes. Easy/long references are 9:00-9:45/mi with an HR cap of 146.

Specific adjustments:

- 26 January and 9 February Tuesdays are easy before MP-finish Sundays.
- 28 January and 11 February Thursdays contain 3.5 miles continuous MP in 6 total.
- 11/18 March Thursdays stay easy around the half-marathon and recovery.
- 25 March has 3 miles continuous MP; 8 April has 2 x 5 minutes threshold.
- 17/31 December retain 6 x 45-second controlled hills; 14 January retains a progression. The 28 January progression is replaced by controlled MP.

Time-based quality miles use the threshold midpoint; recovery jog miles use 9.375 min/mi in the Python baseline. These are estimates, especially uphill, not elevation-adjusted measurements. Hill pace is an effort reference, not a raw uphill speed target; moving-time estimates exclude stopped recovery.

### Browser threshold refinements

The Python baseline uses 7:10-7:25/mi threshold with 2.5-minute jogs. For the 3:30 goal, the app refines matching unmodified baseline interval sessions to provisional exact targets:

- 7:30/mi for 5/6-minute repetitions.
- 7:35/mi for 8-minute repetitions.
- 2:30 easy jogs at a 9:30/mi reference between repetitions only.

These supersede the baseline interval prescription, not hills/progressions or the editable global threshold zone. Dates, distances, repetition counts and hard-day spacing stay unchanged; remaining mileage is easy. Completed, moved, custom-note/distance/pace sessions and other goal times are preserved. JSON/ICS exports include refinements; the Python files remain the baseline.

A goal time does not measure threshold. Slow down or run easy if strained, fatigued or conditions warrant.

## Long runs and races

- 31 January: 16 miles, last 4 at MP.
- 14 February: 18 miles, last 6 at MP.
- 28 February: 14 easy miles; 7 March: 16 easy miles, without fast finishes.
- 14 March: half-marathon, raced at 7:20-7:30/mi in a 32-mile week. Start near 7:30 for 2-3 miles and progress only if controlled; the preceding Thursday is easy.
- 21 March: **conditional 20-mile easy run** in a 45-mile week, with easy Thursday and no fast finish.

The 21 March run is the sole planned long-run-share exception: 44.44%. Reassess after the harder half. Shorten to 16-18 miles or rest if not recovered; do not make up missed mileage. Stopping comfortably around three hours is preferable to chasing distance. Notes and the warning sidebar make the condition visible.

Fast-finish runs remain long runs but count as hard days. Duration sums easy/work portions; the finish uses saved MP pace and the current MP HR zone. Cards and tooltips show both portions. Edit or clear the finish distance on the card.

## Supporting work and taper

Monday swimming is optional easy recovery or complete rest. Light Wednesday evening badminton (about 90 minutes, no hard matches) is allowed, but none is allowed from 12 April.

Strength defaults to Tuesday/Friday. Tuesday is main resistance work; Friday is light core, hips and mobility, not heavy leg work. Alternate Friday Pilates from the exported plan is retained until the strength cutoff. Start with one easy set, progressing to two as tolerated, leaving 2-3 reps in reserve. Use controlled light loads; reduce or skip if recovery suffers.

The three-week taper starts 29 March. No strength is scheduled after 6 April in the included plan; those slots become 15-minute mobility. Race-week Friday is rest/mobility only.

Final week:

| Day | Session |
| --- | --- |
| Monday | Easy swim |
| Tuesday | 5 miles |
| Wednesday | 4 miles including 4 x 20-second strides, plus easy swim |
| Thursday | 5 miles including 2 at MP |
| Friday | Rest/mobility only |
| Saturday | 2 miles including four relaxed strides |
| Sunday | Marathon, 26.2 miles |

Countdown and Today markers use the device's current local date. Phase labels follow the base/build/peak schedule and the three weeks ending on the configured race week.
