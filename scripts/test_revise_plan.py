from copy import deepcopy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from revise_plan import (check, hard, main_miles, revise, validate_revision,
                         week, running, TOTALS, MP, THRESHOLD, START, final_total, HALF_SWAP_WARNINGS, strength_notes, EASY_THURSDAYS, NORMAL_WEEKS, FINISH_WEEKS, tuesday_quality)
from datetime import date, timedelta


ROOT = Path(__file__).resolve().parents[1]


class RevisionTests(unittest.TestCase):
    def setUp(self):
        self.plan = json.loads((ROOT / 'src/default-plan.json').read_text())

    def test_roundtrip_schema_totals_and_exact_quality_sets(self):
        revised = revise(self.plan)
        validate_revision(self.plan, revised)
        self.assertEqual(set(check(revised)), set(HALF_SWAP_WARNINGS))
        self.assertEqual(set(revised), set(self.plan))
        for i in range(len(TOTALS)):
            total = final_total(i)
            monday = (START + timedelta(weeks=i)).isoformat()
            self.assertAlmostEqual(sum(w['distanceMiles'] for w in revised['workouts']
                                       if running(w) and week(w['date']) == monday), total, places=5)
        for day in MP.keys() | THRESHOLD.keys():
            w = next(w for w in revised['workouts'] if w['date'] == day and running(w))
            self.assertGreater(main_miles(w), 0)
        self.assertEqual(revised, self.plan)

    def test_loud_failure_for_each_validation_rule(self):
        mutations = [
            lambda p: p['workouts'].append(deepcopy(p['workouts'][0])),
            lambda p: p.update(workouts=[w for w in p['workouts'] if w['date'] != '2026-10-26']),
            lambda p: p['workouts'][0].update(completed=True),
            lambda p: p['workouts'][0].update(distanceMiles=float('nan')),
            lambda p: next(w for w in p['workouts'] if w['type'] == 'easy').update(hrCapBpm=150),
            lambda p: next(w for w in p['workouts'] if w['date'] == '2027-04-14' and w.get('activity') == 'swim').update(activity='badminton'),
            lambda p: next(w for w in p['workouts'] if w['date'] == '2026-10-31').update(type='parkrun', paceMinPerMile={'min': 8.5, 'max': 9}),
            lambda p: next(w for w in p['workouts'] if w['date'] == '2027-03-16' and running(w)).update(distanceMiles=30),
            lambda p: next(w for w in p['workouts'] if w['date'] == '2027-03-21' and running(w)).update(distanceMiles=21),
            lambda p: next(w for w in p['workouts'] if w['date'] == '2026-10-29' and running(w)).update(notes='No main set'),
            lambda p: p['settings']['paceZones'].update(threshold={'min': 7, 'max': 7.5}),
            lambda p: p.update(qualityVarietyVersion=2),
        ]
        for mutate in mutations:
            plan = deepcopy(self.plan)
            mutate(plan)
            with self.subTest(mutation=mutate), self.assertRaises((ValueError, TypeError)):
                validate_revision(self.plan, plan)

    def test_peak_exception_is_narrow_and_badminton_adjacency_is_allowed(self):
        self.assertEqual(set(check(self.plan)), set(HALF_SWAP_WARNINGS))
        peak = next(w for w in self.plan['workouts'] if w['date'] == '2027-03-21' and running(w))
        self.assertEqual(peak['distanceMiles'], 20)
        self.assertFalse(any(hard(w) for w in self.plan['workouts'] if w['date'] == '2027-03-20'))
        modified = deepcopy(self.plan)
        next(w for w in modified['workouts'] if w['date'] == '2027-03-16' and running(w))['distanceMiles'] -= .5
        self.assertTrue(any('40%' in error for error in check(modified)))
        # Two extra hard easy-run days violate the weekly limit even without adjacency.
        for day in ['2026-10-27', '2026-10-28']:
            next(w for w in modified['workouts'] if w['date'] == day and running(w))['type'] = 'threshold'
        self.assertTrue(any('two hard days' in error for error in check(modified)))

    def test_ten_strength_sessions_rotate_independently_and_repeat(self):
        for index in (0, 1):
            titles = [strength_notes(index, (START + timedelta(weeks=i)).isoformat()).split('\n')[0]
                      for i in range(5)]
            self.assertEqual(len(set(titles)), 5)
            self.assertEqual(strength_notes(index, (START + timedelta(weeks=5)).isoformat()).split('\n')[0], titles[0])
        sessions = [w for w in self.plan['workouts'] if w.get('activity') == 'strength']
        self.assertEqual(len({w['notes'].split('\n')[0] for w in sessions}), 10)
        for w in sessions:
            index = 1 if date.fromisoformat(w['date']).weekday() == 4 else 0
            self.assertEqual(w['notes'], strength_notes(index, w['date']))

    def test_recovery_and_peak_are_explicit(self):
        self.assertEqual(max(TOTALS), 45)
        for day in EASY_THURSDAYS:
            w = next(w for w in self.plan['workouts'] if w['date'] == day and running(w))
            self.assertEqual(w['type'], 'easy')
            self.assertEqual(main_miles(w), 0)
            self.assertFalse(hard(w))
        peak = next(w for w in self.plan['workouts'] if w['date'] == '2027-03-21' and running(w))
        self.assertEqual(peak['distanceMiles'], 20)
        self.assertIn('shorten to 16-18', peak['notes'])
        self.assertNotIn('marathonFinish', peak)
        half = next(w for w in self.plan['workouts'] if w['date'] == '2027-03-14' and running(w))
        self.assertEqual(half['type'], 'race')
        self.assertEqual(half['paceMinPerMile'], {'min': 7 + 20 / 60, 'max': 7.5})
        self.assertIn('target 7:20-7:30/mi', half['notes'])
        self.assertIn('prioritise recovery', half['notes'])
        mutated_half = deepcopy(self.plan)
        next(w for w in mutated_half['workouts'] if w['date'] == '2027-03-14' and running(w))['paceMinPerMile'] = {'min': 8, 'max': 8}
        with self.assertRaisesRegex(ValueError, 'Incorrect half-marathon race pace range'):
            validate_revision(self.plan, mutated_half)
        self.assertTrue(all(not hard(w) for w in self.plan['workouts']
                            if date.fromisoformat(w['date']).weekday() == 5))
        mutated = deepcopy(self.plan)
        next(w for w in mutated['workouts'] if w['date'] == '2027-03-18' and running(w))['type'] = 'threshold'
        with self.assertRaisesRegex(ValueError, 'Incorrect recovery Thursday'):
            validate_revision(self.plan, mutated)

    def test_two_hard_days_in_normal_weeks_with_lighter_exceptions(self):
        for i in range(25):
            monday = START + timedelta(weeks=i)
            items = [w for w in self.plan['workouts'] if week(w['date']) == monday.isoformat()]
            hard_days = {w['date'] for w in items if hard(w)}
            if monday.isoformat() in NORMAL_WEEKS:
                offsets = (3, 6) if monday.isoformat() in FINISH_WEEKS else (1, 3)
                self.assertEqual(hard_days, {(monday + timedelta(days=n)).isoformat() for n in offsets})
            elif i != 24:
                self.assertLessEqual(len(hard_days), 1)
            for w in items:
                if hard(w) and date.fromisoformat(w['date']).weekday() == 1:
                    self.assertGreater(main_miles(w), 0)
                    self.assertGreaterEqual(w['distanceMiles'] - main_miles(w), 2.5)
                    self.assertIn('Warm-up:', w['notes'])
                    self.assertIn('Cool-down:', w['notes'])
                    expected = deepcopy(w)
                    tuesday_quality(expected)
                    self.assertEqual(w, expected)
        mutated = deepcopy(self.plan)
        next(w for w in mutated['workouts'] if w['date'] == '2026-11-03' and running(w)).update(
            type='easy', hrCapBpm=146, qualityStyle=None)
        with self.assertRaisesRegex(ValueError, 'expected exactly two hard days'):
            validate_revision(self.plan, mutated)

    def test_cli_writes_only_after_validation_and_logs_counts(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'marathon-plan-v2.json'
            run = subprocess.run([sys.executable, str(ROOT / 'scripts/revise_plan.py'),
                                  str(ROOT / 'src/default-plan.json'), str(output)],
                                 capture_output=True, text=True, check=True)
            self.assertIn('After unapproved breaches: 0', run.stdout)
            self.assertIn('Before:', run.stdout)
            self.assertEqual(json.loads(output.read_text()), self.plan)
            self.assertTrue(output.with_name('marathon-plan-v2-changes.txt').exists())
            invalid = deepcopy(self.plan)
            invalid['settings']['raceDate'] = '2027-04-19'
            invalid['workouts'][0]['completed'] = True
            next(w for w in invalid['workouts'] if w['date'] == '2026-12-17' and running(w)).pop('qualityStyle')
            invalid_input = Path(directory) / 'invalid.json'
            invalid_input.write_text(json.dumps(invalid))
            failed_output = Path(directory) / 'failed.json'
            failed = subprocess.run([sys.executable, str(ROOT / 'scripts/revise_plan.py'),
                                     str(invalid_input), str(failed_output)], capture_output=True, text=True)
            self.assertNotEqual(failed.returncode, 0)
            self.assertIn('Missing original hills session', failed.stderr)
            self.assertFalse(failed_output.exists())


if __name__ == '__main__':
    unittest.main()
