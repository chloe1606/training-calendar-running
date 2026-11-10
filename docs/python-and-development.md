# Python tooling and development

[Back to the README](../README.md) · [Training decisions](training-plan.md)

## Two layers, one JSON plan

The Python code prepares and validates the training data. The browser application makes that plan interactive; it is not served by Python.

```text
Original exported plan.json
        |
        v
scripts/revise_plan.py       Python standard library
        |
        +--> marathon-plan-v2.json
        +--> marathon-plan-v2-changes.txt
        +--> src/default-plan.json       optional --app-default
                    |
                    v
             src/seed.ts                TypeScript app refinements
                    |
                    v
             Browser calendar           localStorage + JSON/ICS export
```

Existing browser plans are not overwritten by regenerating the checked-in default. Import the revised JSON to replace a saved plan, or use the confirmed reset action. Import/reset can be undone during the current app session.

## Run the revision

From the project directory, use Python 3. No third-party Python packages or virtual environment are required.

```sh
python3 scripts/revise_plan.py /path/to/original-plan.json marathon-plan-v2.json
```

To also update the default bundled with the app:

```sh
python3 scripts/revise_plan.py /path/to/original-plan.json marathon-plan-v2.json \
  --app-default src/default-plan.json
```

The script prints before/after workout counts and validation diagnostics, then writes:

- The requested output JSON.
- A change log beside it, named `<output-stem>-changes.txt`.
- The app-default JSON, only if `--app-default` is supplied.

Keep the original export as input for a meaningful before/after log. Input and output must be different files; the app-default destination must not overwrite the source export. Output directories must already exist. Validation failures raise exceptions before output writing. File-system errors are not hidden.

This script encodes a specific 25-week plan, race date and goal; it is not a generic CLI for arbitrary runners or race dates. The browser's Settings controls have a different role: editing a personal calendar after loading.

## How the code works

| Function / data | Role |
| --- | --- |
| `TOTALS`, `LONGS`, `CUTBACKS`, `MP`, `THRESHOLD` | Explicit weekly targets and dated session prescriptions |
| `revise(source)` | Deep-copies the source, revises sessions/settings and sorts the result |
| `tuesday_quality(workout)` | Fits short threshold or hill work within allocated mileage |
| `strength_notes(index, day)` | Builds historical heavy/light rotation notes with taper adjustments |
| `week`, `running`, `hard`, `main_miles` | Calendar grouping, running/hard-day classification and quality-distance calculations |
| `check(plan)` | Collects plan-level validation breaches |
| `validate_revision(source, result)` | Enforces exact revision requirements and raises on unexpected failures |
| `log_changes(source, result)` | Records settings/workout changes and weekly before/after totals |
| `main()` | Parses paths, validates a JSON round-trip and writes outputs |

The implementation uses `deepcopy`, `Counter`, `date`/`timedelta`, regular expressions and JSON serialization. `allow_nan=False` prevents non-finite numbers from being serialized as JSON output.

Checks include:

- Unique workout IDs, valid dates and finite numeric values.
- Expected date coverage, schema keys and preserved race/goal/HR settings.
- Exact weekly running totals and prescribed quality sets, recoveries and easy portions.
- Mileage progression relative to the last non-cut-back training week.
- Long-run share, hard-day spacing and lighter-week exceptions.
- The conditional 21 March 20-miler and its recovery guidance.
- Race-week restrictions and strength/taper scheduling.

The 10% mileage and 40% long-run-share checks are planning aids, not proof of safety. See the [training-plan guide](training-plan.md) for the approved exception and recovery alternatives.

## Test the Python workflow

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts -v
```

[The tests](../scripts/test_revise_plan.py) use `unittest`, temporary directories and subprocesses. They cover round-trip/schema preservation, exact totals and quality sets, deliberate validation failures, recovery/peak conditions, strength rotation, hard-day scheduling and CLI output. Tests use the checked-in default as a fixture; changing training decisions requires updating the script, fixture and corresponding expectations together.

## Browser-side refinements

The checked-in Python JSON is a baseline, not a byte-for-byte representation of every loaded browser session:

- The app clears historical automatic strength assignments from eligible incomplete slots, retaining completed/custom notes.
- Matching unmodified baseline threshold sessions receive provisional exact pace refinements for the 3:30 goal.
- Existing user changes are preserved where migration/refinement guards apply.

See [training-plan details](training-plan.md) and [Strength Studio](strength-studio.md). Do not use a screenshot or browser export as evidence that the checked-in Python baseline has been rewritten.

## App development

Use Node.js 22.12+, 24+ or 26+:

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

`npm run build` runs TypeScript checking followed by Vite. The app uses Vitest; Python tests are separate and are not run by `npm test`.

## Source map

| Path | Responsibility |
| --- | --- |
| [scripts/revise_plan.py](../scripts/revise_plan.py) | Python revision, validation and change log |
| [scripts/test_revise_plan.py](../scripts/test_revise_plan.py) | Python regression and CLI tests |
| [marathon-plan-v2.json](../marathon-plan-v2.json) | Revised export |
| [marathon-plan-v2-changes.txt](../marathon-plan-v2-changes.txt) | Detailed before/after record |
| [src/default-plan.json](../src/default-plan.json) | Bundled Python-generated baseline |
| [src/seed.ts](../src/seed.ts) | Default-plan cloning and app refinements |
| [src/model.ts](../src/model.ts) | Types, dates, units, pace and duration helpers |
| [src/store.ts](../src/store.ts) | Zustand state, persistence, history and import validation |
| [src/rules.ts](../src/rules.ts) | Live calendar planning warnings |
| [src/threshold.ts](../src/threshold.ts), [src/quality.ts](../src/quality.ts) | Structured running sessions and calculations |
| [src/races.ts](../src/races.ts), [src/schedule.ts](../src/schedule.ts), [src/zones.ts](../src/zones.ts) | Races, weekday preferences and training zones |
| [src/strength.ts](../src/strength.ts), [src/random-strength.ts](../src/random-strength.ts), [src/strength-guide.ts](../src/strength-guide.ts) | Strength scheduling, generation and movement library |
| [src/files.ts](../src/files.ts) | Downloads and RFC 5545 ICS export |
| [src/App.tsx](../src/App.tsx), [src/components/](../src/components/) | App shell, calendar, editors, insights and studio |
| [src/styles.css](../src/styles.css) | Responsive light/dark styling |
