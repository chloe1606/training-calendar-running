#!/usr/bin/env python3
"""Revise an exported Marathon Planner plan without adding schema keys."""
import argparse
from collections import Counter
from copy import deepcopy
from datetime import date, timedelta
import json
import math
from pathlib import Path
import re

START = date(2026, 10, 26)
END = date(2027, 4, 18)
TOTALS = [25, 27.5, 23, 29, 30, 26, 32, 33, 35, 30, 36, 38, 32, 40,
          42.5, 45, 45, 36, 41, 32, 45, 40, 32, 24, 42.2]
TARGETS = TOTALS
LONGS = [10, 11, 8, 11, 12, 10, 12, 13, 14, 12, 14, 15, 12, 16,
         17, 18, 18, 14, 16, 13.1, 20, 16, 12, 8, 26.2]
CUTBACKS = {'2026-11-09', '2026-11-30', '2026-12-28', '2027-01-18', '2027-02-22'}
FINISHES = {'2027-01-31': 4, '2027-02-14': 6}
MP = dict(zip(
    ['2026-10-29', '2026-11-26', '2026-12-10', '2026-12-24',
     '2027-01-07', '2027-01-28', '2027-02-04', '2027-02-11', '2027-02-18', '2027-03-04',
     '2027-03-25', '2027-04-01', '2027-04-15'],
    [2, 3, 3, 4, 4, 3.5, 4, 3.5, 4, 3, 3, 3, 2]))
# Repetitions, amount per repetition, unit.
THRESHOLD = {
    '2026-11-05': (2, 6, 'min'), '2026-11-19': (2, 8, 'min'),
    '2027-04-08': (2, 5, 'min'),
}
EASY_THURSDAYS = {
    '2026-11-12': (4, 'Cut-back: easy running only.'),
    '2026-12-03': (5, 'Cut-back: easy running only.'),
    '2027-01-21': (5, 'Cut-back: easy running only.'),
    '2027-02-25': (5, 'Cut-back: easy running only.'),
    '2027-03-11': (5, 'Half-marathon week: save quality effort for Sunday.'),
    '2027-03-18': (6, 'Recovery after the half; no threshold or MP before the conditional 20-miler.'),
}
VARIETY = {'2026-12-17': 'hills', '2026-12-31': 'hills',
           '2027-01-14': 'progression'}
EASY = {'min': 9, 'max': 9.75}
TEMPO = {'min': 7.1667, 'max': 7.4167}
MP_PACE = {'min': 8, 'max': 8}
JOG_PACE = 9.375
THRESHOLD_REFERENCE = (TEMPO['min'] + TEMPO['max']) / 2
PEAK_EXCEPTION = '2027-03-21'
STRENGTH = json.loads((Path(__file__).resolve().parents[1] / 'src/strength-routines.json').read_text())
LIGHT_WEEKS = CUTBACKS | {'2027-03-08', '2027-03-15', '2027-03-29', '2027-04-05', '2027-04-12'}
FINISH_WEEKS = {'2027-01-25', '2027-02-08'}
NORMAL_WEEKS = {(START + timedelta(weeks=i)).isoformat() for i in range(25)} - LIGHT_WEEKS


def tuesday_quality(w):
    """Keep the allocated mileage; replace only a short portion with quality."""
    i = (date.fromisoformat(week(w['date'])) - START).days // 7
    w['type'] = 'threshold'
    w['paceMinPerMile'] = deepcopy(TEMPO)
    w.pop('hrCapBpm', None)
    w.pop('hrZone', None)
    if i % 2:
        seconds = 30 if i < 7 else 45
        main = 6 * seconds / 60 / THRESHOLD_REFERENCE
        recovery = w['distanceMiles'] - 2.5 - main
        w['qualityStyle'] = 'hills'
        structure = (f'6 x {seconds} s uphill at controlled strong effort on a gentle slope, not a sprint. '
                     'Jog/walk downhill until fully recovered (about 2-3 min); '
                     f'use the remaining {recovery:.6f} mi for easy recovery running. '
                     '7:10-7:25/mi is a flat-equivalent reference only, not an uphill speed target.')
    else:
        reps, minutes = (2, 5) if i < 7 else ((2, 6) if i < 13 else (3, 5))
        main = reps * minutes / THRESHOLD_REFERENCE
        recovery = (reps - 1) * 2.5 / JOG_PACE
        w.pop('qualityStyle', None)
        structure = (f'{reps} x {minutes} min at threshold, 7:10-7:25/mi, with 2.5 min easy jog '
                     f'between repetitions ({recovery:.6f} mi total at 9:22.5/mi reference); '
                     f'then {w["distanceMiles"] - 2.5 - main - recovery:.6f} mi easy to complete the allocated mileage.')
    if w['distanceMiles'] < 2.5 + main + (0 if w.get('qualityStyle') else recovery):
        raise ValueError(f'Tuesday quality does not fit warm-up/recovery/cool-down: {w["date"]}')
    w['notes'] = (f'Warm-up: 1.5 mi easy at 9:00-9:45/mi. Main set: {structure} '
                  f'Cool-down: 1 mi easy at 9:00-9:45/mi. Main-set quality miles: {main:.4f}. '
                  'Quality distance is estimated at the threshold midpoint. Keep the work controlled, not maximal; '
                  'Thursday is the other quality day. If recovery is poor, run easy instead. '
                  'Do the Tuesday strength session after running, not before; skip or reduce it if fatigued.')


def strength_notes(index, day):
    rotation = ((date.fromisoformat(week(day)) - START).days // 7) % 5
    group = 'heavy' if index % 2 == 0 else 'light'
    routine = [item for item in STRENGTH['routines'] if item['group'] == group][rotation]
    taper = day >= '2027-03-29'
    exercises = routine['exercises']
    if taper:
        exercises = [text.replace('2 sets', '1 set').replace('2 x 8', '1 x 8') for text in exercises]
    label = 'Tuesday main resistance session.' if group == 'heavy' else 'Friday light/mobility only.'
    parts = [routine['title'], f'Five-week rotation: {rotation + 1}/5. {label}', STRENGTH['guidance'], *exercises]
    if taper:
        parts.append('Taper: 1 easy set with familiar exercises only; no progression. This overrides the normal two-set prescription. No strength after 6 April; use 15 min gentle mobility, not loaded strength. Skip if sore or tired.')
    return '\n\n'.join(parts)
HALF_SWAP_WARNINGS = ()


def final_total(i):
    return TOTALS[i]


def final_sunday(i):
    return LONGS[i]


def week(day):
    value = date.fromisoformat(day)
    return (value - timedelta(days=value.weekday())).isoformat()


def running(w):
    return w['type'] not in ('crossTraining', 'rest')


def hard(w):
    return (w['type'] in ('threshold', 'marathonPace', 'race')
            or bool(w.get('qualityStyle')) or bool(w.get('marathonFinish'))
            or w['type'] == 'parkrun' and w['paceMinPerMile']['min'] < 9)


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def main_miles(w):
    match = re.search(r'Main-set quality miles: (\d+(?:\.\d+)?)', w['notes'])
    return float(match.group(1)) if match else None


def check(plan):
    """Return all unapproved breaches; the peak exception is narrowly bounded."""
    errors = []
    workouts = plan['workouts']
    ids = [w['id'] for w in workouts]
    if len(set(ids)) != len(ids):
        errors.append('Duplicate workout ids')
    expected_dates = {(START + timedelta(days=i)).isoformat() for i in range((END - START).days + 1)}
    if {w['date'] for w in workouts} != expected_dates:
        errors.append('Date coverage has gaps or extends beyond the required span')
    grouped = { (START + timedelta(weeks=i)).isoformat(): [] for i in range(25) }
    for w in workouts:
        if w['id'] != f"seed-{w['date']}-{w['type']}-{w.get('activity', '')}":
            errors.append(f"Invalid seed id: {w['id']}")
        if w['completed'] is not False:
            errors.append(f"Completed is not false: {w['id']}")
        pace = w['paceMinPerMile']
        if (not number(w['distanceMiles']) or not 0 <= w['distanceMiles'] <= 200
                or not number(pace['min']) or not number(pace['max'])
                or not 0 < pace['min'] <= pace['max'] <= 120):
            errors.append(f"Invalid distance/pace: {w['id']}")
        if w['type'] in ('easy', 'long') and w.get('hrCapBpm') != 146:
            errors.append(f"Missing HR cap 146: {w['id']}")
        finish = w.get('marathonFinish')
        if finish and (w['type'] != 'long' or not 0 < finish['distanceMiles'] <= w['distanceMiles']
                       or finish['paceMinPerMile'] != MP_PACE):
            errors.append(f"Invalid marathon finish: {w['id']}")
        if w.get('activity') == 'badminton' and (w['date'] >= '2027-04-12'
                                                  or date.fromisoformat(w['date']).weekday() != 2):
            errors.append(f"Badminton date: {w['date']}")
        if w.get('activity') == 'strength' and w['date'] > '2027-04-06':
            errors.append(f"Late strength: {w['date']}")
        if week(w['date']) in grouped:
            grouped[week(w['date'])].append(w)
    baseline = None
    for i, (monday, items) in enumerate(grouped.items()):
        miles = sum(w['distanceMiles'] for w in items if running(w))
        race_week = any(w['type'] == 'race' for w in items)
        target = final_total(i) if i in (18, 19) else TARGETS[i]
        if abs(miles - target) > 1 + 1e-6:
            errors.append(f'{monday}: mileage {miles:.4f} outside target {TARGETS[i]} +/-1')
        if len({w['date'] for w in items if hard(w)}) > 2 and not race_week:
            errors.append(f'{monday}: more than two hard days')
        if baseline is not None and miles > baseline * 1.1 + 1e-5:
            errors.append(f'{monday}: {miles:.3f} exceeds 110% of last non-cut-back {baseline:.3f}')
        # Half/race weeks, designated cut-backs, recovery and taper do not lower
        # the reference used to evaluate a subsequent mileage increase.
        if monday not in CUTBACKS and not race_week and monday < '2027-03-29':
            baseline = miles
        for w in items:
            if w['type'] == 'long':
                previous = (date.fromisoformat(w['date']) - timedelta(days=1)).isoformat()
                if any(hard(x) for x in workouts if x['date'] == previous):
                    errors.append(f"{w['date']}: hard day immediately before long run")
                approved_peak = w['date'] == PEAK_EXCEPTION and w['distanceMiles'] == 20 and abs(miles - 45) < 1e-5
                if w['distanceMiles'] > miles * .4 + 1e-5 and monday not in CUTBACKS and not approved_peak:
                    errors.append(f"{w['date']}: long run exceeds 40%")
        thursdays = [w for w in items if date.fromisoformat(w['date']).weekday() == 3 and running(w)]
        if len(thursdays) != 1:
            errors.append(f'{monday}: expected one Thursday running session')
        for w in thursdays:
            if (main_miles(w) is None or 'Main set:' not in w['notes'] or 'Warm-up:' not in w['notes']
                    or 'Cool-down:' not in w['notes']):
                errors.append(f"{w['date']}: missing defined Thursday main set / quality miles")
            elif not 0 <= main_miles(w) <= w['distanceMiles'] or (main_miles(w) == 0 and w['type'] != 'easy'):
                errors.append(f"{w['date']}: invalid main-set quality miles")
    return errors


def one(workouts, day, predicate):
    matches = [w for w in workouts if w['date'] == day and predicate(w)]
    if len(matches) != 1:
        raise ValueError(f'Expected exactly one matching workout on {day}, found {len(matches)}')
    return matches[0]


def revise(source):
    plan = deepcopy(source)
    settings = plan['settings']
    settings['trainingZones']['paceBoundaries'] = [8.9833, 7.7333, 6.9333, 6.5, 6.1]
    settings['paceZones']['threshold'] = deepcopy(TEMPO)
    settings['paceZones']['parkrun'] = {'min': 8.5, 'max': 9}
    settings['defaultDays']['badminton'] = 2
    settings['defaultDays']['swim'] = 0
    workouts = plan['workouts']
    for w in workouts:
        w['completed'] = False
        day = date.fromisoformat(w['date'])
        if running(w) and day.weekday() == 1 and w['date'] < '2027-04-12':
            w['type'] = 'easy'
            w.pop('qualityStyle', None)
            w.pop('hrZone', None)
            w['notes'] = 'Easy conversational run, HR under 146; no quality work in recovery or MP-finish weeks.'
        if w['type'] in ('easy', 'long'):
            w['paceMinPerMile'] = deepcopy(EASY)
            w['hrCapBpm'] = 146
        if w['type'] == 'threshold':
            w['paceMinPerMile'] = deepcopy(TEMPO)
        if w.get('activity') == 'badminton':
            w['notes'] = 'Wednesday evening: about 90 minutes, light and easy intensity only, no hard matches because Thursday is a quality day.'
        if w.get('activity') == 'strength':
            if w['date'] > '2027-04-06':
                w['activity'] = 'pilates'
                w['notes'] = STRENGTH['mobility']
            else:
                w['notes'] = strength_notes(0 if day.weekday() == 1 else 1, w['date'])
        if w['type'] == 'easy' and day.weekday() == 2:
            w['notes'] = 'Easy conversational run, HR under 146. Light badminton in the evening, about 90 minutes, no hard matches.'
        if day.weekday() == 5 and running(w):
            w['type'] = 'easy'
            w['paceMinPerMile'] = deepcopy(EASY)
            w['hrCapBpm'] = 146
            w['notes'] = 'social jog, save it for tomorrow'
            w.pop('hrZone', None)
    for i, distance in enumerate(LONGS):
        sunday = (START + timedelta(weeks=i, days=6)).isoformat()
        w = one(workouts, sunday, running)
        w['type'] = 'race' if i in (19, 24) else 'long'
        w['distanceMiles'] = distance
        w.pop('marathonFinish', None)
        if w['type'] == 'long':
            w['paceMinPerMile'] = deepcopy(EASY)
            w['hrCapBpm'] = 146
            w['notes'] = 'Easy long run at 9:00-9:45/mi, HR under 146; practise fuelling.'
        else:
            w.pop('hrCapBpm', None)
        if sunday in FINISHES:
            finish = FINISHES[sunday]
            w['marathonFinish'] = {'distanceMiles': finish, 'paceMinPerMile': deepcopy(MP_PACE)}
            w['notes'] = f'First {distance - finish} mi easy at 9:00-9:45/mi, HR under 146; last {finish} mi continuous at 8:00/mi. Practise fuelling; this counts as a hard day.'
        if sunday == '2027-03-14':
            w['paceMinPerMile'] = {'min': 7 + 20 / 60, 'max': 7.5}
            w['notes'] = 'Half-marathon race: target 7:20-7:30/mi if training and conditions support it. Start near 7:30/mi for the first 2-3 miles, then work towards 7:20/mi only if controlled; do not force the pace. Practise familiar kit, breakfast and fuelling. This is harder than marathon effort: prioritise recovery afterwards and reassess the conditional 20-miler on 21 March; shorten to 16-18 easy miles or rest if not recovered, with no make-up mileage.'
        if sunday == PEAK_EXCEPTION:
            w['notes'] += ' Conditional 20-miler, one week after the half: only attempt if easy running feels normal and there is no lingering soreness, unusual fatigue or pain. Otherwise shorten to 16-18 easy miles or skip if unwell; do not make up the miles. About 3 hours is sufficient; do not chase distance beyond a comfortable duration. No fast finish. Planned long-share exception: 20/45 mi (44.44%); recovery takes priority.'
        if w['type'] == 'long':
            w['notes'] += ' Conversational effort takes priority over pace on hills, in heat or when tired. Practise familiar breakfast, kit and fuelling; gradually build a tolerated carbohydrate strategy, never try something new on race day.'
    for w in workouts:
        if w.get('activity') == 'swim' and date.fromisoformat(w['date']).weekday() == 0:
            w['notes'] = 'Optional easy recovery swim, 15-25 min relaxed. Replace with complete rest if tired or sore; this is not another training obligation.'
    for day, main in MP.items():
        w = one(workouts, day, running)
        w['type'] = 'marathonPace'
        w.pop('qualityStyle', None)
        w.pop('hrCapBpm', None)
        warm, cool = (1.5, 1.5) if day == '2027-04-15' else (1.5, 1)
        w['distanceMiles'] = warm + main + cool
        w['paceMinPerMile'] = deepcopy(MP_PACE)
        w['notes'] = (f'Warm-up: {warm:g} mi easy at 9:00-9:45/mi. Main set: {main:g} mi continuous at MP, 8:00/mi, no recovery breaks. '
                      f'Cool-down: {cool:g} mi easy at 9:00-9:45/mi. Main-set quality miles: {main:.4f}. '
                      'Easy portions HR Z2 (118-146); MP portion HR Z3 (147-160).')
    for day, (reps, amount, unit) in THRESHOLD.items():
        w = one(workouts, day, running)
        w['type'] = 'threshold'
        w.pop('qualityStyle', None)
        w.pop('hrCapBpm', None)
        main = reps * amount / THRESHOLD_REFERENCE if unit == 'min' else reps * amount
        recovery = (reps - 1) * 2.5 / JOG_PACE
        w['distanceMiles'] = round(1.5 + main + recovery + 1, 6)
        w['notes'] = (f'Warm-up: 1.5 mi easy at 9:00-9:45/mi. Main set: {reps} x {amount} {unit} at threshold, '
                      f'7:10-7:25/mi, with 2.5 min easy jog between repetitions ({recovery:.6f} mi total at 9:22.5/mi reference). '
                      f'Cool-down: 1 mi easy at 9:00-9:45/mi. Main-set quality miles: {main:.4f}. '
                      'Time-based main-set miles are estimated at 7:17.5/mi midpoint; no recovery after the final repetition. '
                      'Easy portions HR Z2 (118-146); threshold portions HR Z4 (161-175).')
    for day, style in VARIETY.items():
        w = one(workouts, day, running)
        if w.get('qualityStyle') != style:
            raise ValueError(f'Missing original {style} session: {day}')
        if style == 'hills':
            reps = 6
            main = reps * .75 / THRESHOLD_REFERENCE
            recoveries = w['distanceMiles'] - 2.5 - main
            w['notes'] = (f'Warm-up: 1.5 mi easy. Main set: {reps} x 45 s uphill at controlled strong effort, not a sprint; '
                          f'jog/walk back down until recovered (about 2-3 min), using the remaining {recoveries:.4f} mi for easy recovery running. '
                          'Do not chase raw uphill pace; 7:10-7:25/mi is a flat-equivalent reference only. '
                          f'Cool-down: 1 mi easy. Main-set quality miles: {main:.4f}. '
                          'Uphill distance is estimated at the flat-equivalent midpoint, not measured elevation-adjusted distance. '
                          'Retain the gentle slope and controlled form; shorten if fatigued.')
        else:
            remaining = w['distanceMiles'] - 2.5
            easy, mp, tempo = (remaining * .4, remaining * .35, remaining * .25)
            w['notes'] = (f'Warm-up: 1.5 mi easy. Main set: continuous gradual progression, no recovery breaks. '
                          f'Easy progression: {easy:.6f} mi. MP progression: {mp:.6f} mi at 8:00/mi. '
                          f'Threshold progression: {tempo:.6f} mi at 7:10-7:25/mi. '
                          f'Cool-down: 1 mi easy. Main-set quality miles: {mp + tempo:.4f}. '
                          'Progress smoothly from easy through marathon effort to threshold, never sprint. Easy portions HR Z2; MP Z3; threshold Z4.')
    for day, (distance, reason) in EASY_THURSDAYS.items():
        w = one(workouts, day, running)
        w['type'] = 'easy'
        w['distanceMiles'] = distance
        w['paceMinPerMile'] = deepcopy(EASY)
        w['hrCapBpm'] = 146
        w.pop('qualityStyle', None)
        w.pop('hrZone', None)
        w['notes'] = (f'Warm-up: 1 mi relaxed. Main set: {distance - 2} mi conversational easy running at 9:00-9:45/mi or slower as needed, no hard efforts. '
                      f'Cool-down: 1 mi easy. Main-set quality miles: 0.0000. HR under 146. {reason}')
    # Race week: retain existing records where possible, remove duplicate mobility slots.
    for w in workouts:
        if w['date'] == '2027-04-14' and w.get('activity') == 'badminton':
            w['activity'] = 'swim'
            w['notes'] = 'Easy recovery swim, relaxed effort; no badminton in race week.'
        if w['date'] == '2027-04-13' and running(w):
            w['distanceMiles'] = 5
        if w['date'] == '2027-04-14' and running(w):
            w['distanceMiles'] = 4
            w['notes'] = '4 mi easy including 4 x 20 s relaxed strides, full easy jog recovery. Strides are included in total distance; no hard workout.'
        if w['date'] == '2027-04-16':
            w['type'] = 'rest'
            w.pop('activity', None)
            w['notes'] = 'Rest; optional 15 min gentle mobility only. No Pilates class, strength or loaded leg work.'
        if w['date'] == '2027-04-17':
            w['type'] = 'easy'
            w['distanceMiles'] = 2
            w['paceMinPerMile'] = deepcopy(EASY)
            w['hrCapBpm'] = 146
            w['notes'] = '2 mi easy shakeout including 4 relaxed strides with full easy recovery. Prepare kit and fuel; no racing.'
    seen = set()
    deduped = []
    for w in workouts:
        w['id'] = f"seed-{w['date']}-{w['type']}-{w.get('activity', '')}"
        if w['id'] in seen:
            if w['date'] != '2027-04-16' or w['type'] != 'rest':
                raise ValueError(f"Unexpected duplicate after revision: {w['id']}")
            continue
        seen.add(w['id'])
        deduped.append(w)
    workouts = plan['workouts'] = deduped
    for i, total in enumerate(TOTALS):
        monday = START + timedelta(weeks=i)
        if i == 24:
            continue
        items = [w for w in workouts if week(w['date']) == monday.isoformat()]
        tuesday = one(items, (monday + timedelta(days=1)).isoformat(), lambda w: w['type'] == 'easy')
        wednesday = one(items, (monday + timedelta(days=2)).isoformat(), lambda w: w['type'] == 'easy')
        remaining = total - sum(w['distanceMiles'] for w in items if running(w) and w not in (tuesday, wednesday))
        if remaining <= 0:
            raise ValueError(f'No mileage available for easy runs: {monday}')
        ratio = tuesday['distanceMiles'] / (tuesday['distanceMiles'] + wednesday['distanceMiles'])
        tuesday['distanceMiles'] = round(remaining * ratio, 6)
        wednesday['distanceMiles'] = round(remaining - tuesday['distanceMiles'], 6)
    for w in workouts:
        if (running(w) and date.fromisoformat(w['date']).weekday() == 1
                and week(w['date']) in NORMAL_WEEKS - FINISH_WEEKS):
            tuesday_quality(w)
        w['id'] = f"seed-{w['date']}-{w['type']}-{w.get('activity', '')}"
    plan['workouts'].sort(key=lambda w: (w['date'], w['id']))
    return plan


def validate_revision(source, result):
    # Keep an explicit allowlist; never hide unexpected validation failures.
    errors = [error for error in check(result) if error not in HALF_SWAP_WARNINGS]
    for i in range(25):
        monday = (START + timedelta(weeks=i)).isoformat()
        items = [w for w in result['workouts'] if week(w['date']) == monday]
        hard_days = {w['date'] for w in items if hard(w)}
        if monday in NORMAL_WEEKS:
            expected_days = { (START + timedelta(weeks=i, days=3)).isoformat(),
                              (START + timedelta(weeks=i, days=6 if monday in FINISH_WEEKS else 1)).isoformat() }
            if hard_days != expected_days:
                errors.append(f'{monday}: expected exactly two hard days on the scheduled weekdays')
        elif monday != '2027-04-12' and len(hard_days) > 1:
            errors.append(f'{monday}: lighter week must have at most one hard day')
        for w in items:
            if hard(w) and date.fromisoformat(w['date']).weekday() == 1:
                expected = deepcopy(w)
                tuesday_quality(expected)
                if w != expected:
                    errors.append(f'Incorrect Tuesday quality structure: {w["date"]}')
            if hard(w) and any(hard(x) for x in result['workouts']
                               if x['date'] == (date.fromisoformat(w['date']) + timedelta(days=1)).isoformat()):
                errors.append(f'{w["date"]}: consecutive hard days')
    if set(result) != set(source):
        errors.append('Top-level keys changed')
    for key in ('marathonFinishesVersion', 'qualityVarietyVersion'):
        if result.get(key) != source.get(key):
            errors.append(f'{key} changed')
    for key in ('raceDate', 'goalTime'):
        if result['settings'][key] != source['settings'][key]:
            errors.append(f'{key} changed')
    if result['settings']['raceDate'] != '2027-04-18' or result['settings']['goalTime'] != '3:30:00':
        errors.append('Race date/goal must be 18 April 2027 / 3:30:00')
    if result['settings']['trainingZones']['hrBoundaries'] != source['settings']['trainingZones']['hrBoundaries']:
        errors.append('HR boundaries changed')
    if result['settings']['trainingZones']['paceBoundaries'] != [8.9833, 7.7333, 6.9333, 6.5, 6.1]:
        errors.append('Incorrect pace boundaries')
    if result['settings']['paceZones']['threshold'] != TEMPO:
        errors.append('Incorrect threshold pace setting')
    if result['settings']['defaultDays']['badminton'] != 2 or result['settings']['defaultDays']['swim'] != 0:
        errors.append('Incorrect badminton/swim default days')
    def key_paths(value, prefix=''):
        paths = set()
        if isinstance(value, dict):
            for key, child in value.items():
                paths.add(prefix + key)
                paths |= key_paths(child, prefix + key + '.')
        return paths
    if key_paths(result['settings']) != key_paths(source['settings']):
        errors.append('Settings schema keys changed')
    source_keys = set().union(*(w.keys() for w in source['workouts']))
    if set().union(*(w.keys() for w in result['workouts'])) != source_keys:
        errors.append('Workout schema keys changed')
    for day, main in MP.items():
        w = one(result['workouts'], day, running)
        if w['type'] != 'marathonPace' or w['paceMinPerMile'] != MP_PACE or main_miles(w) is None or abs(main_miles(w) - main) > 1e-4:
            errors.append(f'Incorrect MP main set: {day}')
        if abs(w['distanceMiles'] - main - (3 if day == '2027-04-15' else 2.5)) > 1e-5:
            errors.append(f'Incorrect MP total: {day}')
    for day, (reps, amount, unit) in THRESHOLD.items():
        w = one(result['workouts'], day, running)
        main = reps * amount / THRESHOLD_REFERENCE if unit == 'min' else reps * amount
        expected = 2.5 + main + (reps - 1) * 2.5 / JOG_PACE
        if (w['type'] != 'threshold' or w['paceMinPerMile'] != TEMPO or main_miles(w) is None
                or abs(main_miles(w) - main) > 1e-4 or abs(w['distanceMiles'] - expected) > 1e-5
                or f'{reps} x {amount} {unit}' not in w['notes'] or '2.5 min easy jog' not in w['notes']):
            errors.append(f'Incorrect threshold main set/recoveries/total: {day}')
    for day, (distance, _) in EASY_THURSDAYS.items():
        w = one(result['workouts'], day, running)
        if (w['type'] != 'easy' or w['distanceMiles'] != distance or w.get('qualityStyle')
                or w.get('hrCapBpm') != 146 or main_miles(w) != 0):
            errors.append(f'Incorrect recovery Thursday: {day}')
    for w in result['workouts']:
        if running(w) and date.fromisoformat(w['date']).weekday() == 5:
            if w['type'] != 'easy' or w['paceMinPerMile'] != EASY or w.get('hrCapBpm') != 146:
                errors.append(f"Saturday is not easy: {w['date']}")
        if w.get('activity') == 'strength':
            weekday = date.fromisoformat(w['date']).weekday()
            if weekday not in (1, 4):
                errors.append(f"Strength not Tuesday/Friday: {w['date']}")
            if weekday == 4 and 'No heavy leg work' not in w['notes']:
                errors.append(f"Friday strength is not light: {w['date']}")
    expected_race_runs = {'2027-04-13': 5, '2027-04-14': 4, '2027-04-15': 5,
                          '2027-04-17': 2, '2027-04-18': 26.2}
    half = one(result['workouts'], '2027-03-14', running)
    if half['paceMinPerMile'] != {'min': 7 + 20 / 60, 'max': 7.5}:
        errors.append('Incorrect half-marathon race pace range')
    actual_race_runs = {w['date']: w['distanceMiles'] for w in result['workouts']
                        if w['date'] >= '2027-04-12' and running(w)}
    if actual_race_runs != expected_race_runs:
        errors.append('Incorrect race-week running schedule')
    for day, style in VARIETY.items():
        old = one(source['workouts'], day, running)
        new = one(result['workouts'], day, running)
        if new['qualityStyle'] != style or new['distanceMiles'] != old['distanceMiles']:
            errors.append(f'Original variety session changed: {day}')
    for i in range(len(TOTALS)):
        total = final_total(i)
        monday = (START + timedelta(weeks=i)).isoformat()
        if abs(sum(w['distanceMiles'] for w in result['workouts'] if week(w['date']) == monday and running(w)) - total) > 1e-5:
            errors.append(f'{monday}: expected exact revised total {total}')
        sunday = (START + timedelta(weeks=i, days=6)).isoformat()
        run = one(result['workouts'], sunday, running)
        if run['distanceMiles'] != final_sunday(i):
            errors.append(f'Incorrect Sunday distance: {sunday}')
        if run['type'] != ('race' if i in (19, 24) else 'long'):
            errors.append(f'Incorrect Sunday type: {sunday}')
        if run.get('marathonFinish') != ({'distanceMiles': FINISHES[sunday], 'paceMinPerMile': MP_PACE} if sunday in FINISHES else None):
            errors.append(f'Incorrect Sunday finish: {sunday}')
    if errors:
        raise ValueError('VALIDATION FAILED:\n' + '\n'.join(errors))


def log_changes(source, result):
    lines = ['Marathon Planner v2 change log: experienced-runner two-quality-day revision',
             'Runner baseline: 25 mi/week, second marathon, ten years running, comfortable with 10-13 mi long runs. Peak capped at 45 mi/week.',
             'Normal weeks: Tuesday short threshold/hills plus Thursday quality. MP-finish weeks: Tuesday easy, Thursday MP and Sunday finish. Weekly mileage unchanged.',
             'Cut-back, half-marathon, post-half recovery and taper weeks remain lighter; race week retains Thursday MP plus Sunday marathon.',
             'All Saturday parkruns are easy, especially during the taper; no distance added to maintain an arbitrary intensity target.',
             'Planned long-share exception: conditional 20 mi on 21 Mar in a 45 mi week (44.44%), one week after the half.',
             'The 20-miler was explicitly kept on 21 Mar at user request. Notes advise 16-18 mi, or skipping if unwell, if not recovered; no fast finish.',
             'Half stays on 14 Mar, now raced at 7:20-7:30/mi rather than fixed 8:00/mi; start conservatively and reassess recovery before the conditional 20-miler. Marathon goal unchanged.',
             'Thursdays on 11/18 Mar are easy; 25 Mar uses 3 mi MP instead of 3 x 2 mi threshold.',
             'MP long finishes: 31 Jan 16 mi / last 4 MP; 14 Feb 18 mi / last 6 MP. Thursdays before both contain 3.5 mi MP in 6 mi total; Tuesdays are easy.',
             'Lighter base, six build cut-back/race reductions, mostly easy training, optional Monday swims, unchanged ten-session submaximal strength rotation.',
             'Cut-back/recovery weeks: ' + ', '.join(sorted(CUTBACKS)),
             'Mileage reference skips cut-back/recovery, race and taper weeks; race miles still count in totals and increase checks.',
             '17/31 Dec hills retained (6 reps each); 14 Jan progression retained. 28 Jan is controlled MP rather than progression.',
             'Time-based threshold/hill quality miles use the threshold midpoint; recovery jog reference is 9.375 min/mi.',
             f"Before counts: {dict(Counter(w['type'] for w in source['workouts']))}",
             f"After counts: {dict(Counter(w['type'] for w in result['workouts']))}",
             f'Before validation breaches: {len(check(source))}', 'After unapproved validation breaches: 0', '', 'Settings changes:']
    def diff(old, new, prefix):
        for key in sorted(old.keys() | new.keys()):
            a, b = old.get(key), new.get(key)
            if a == b:
                continue
            if isinstance(a, dict) and isinstance(b, dict):
                diff(a, b, f'{prefix}{key}.')
            else:
                lines.append(f'{prefix}{key}: {json.dumps(a)} -> {json.dumps(b)}')
    diff(source['settings'], result['settings'], '')
    lines += ['', 'Before validation breaches (diagnostic, not approved for output):', *check(source)]
    lines += ['', 'Weekly running miles (before -> after; Thursday quality miles):']
    for i in range(25):
        monday = (START + timedelta(weeks=i)).isoformat()
        total = lambda p: sum(w['distanceMiles'] for w in p['workouts'] if running(w) and week(w['date']) == monday)
        thu = one(result['workouts'], (START + timedelta(weeks=i, days=3)).isoformat(), running)
        lines.append(f'{monday}: {total(source):.4f} -> {total(result):.4f}; Thursday main-set quality {main_miles(thu):.4f} mi')
    lines += ['', 'Workout changes (matched by date/type/activity, including canonicalized ids):']
    old_by_id = {w['id']: w for w in source['workouts']}
    new_by_id = {w['id']: w for w in result['workouts']}
    for identifier in sorted(old_by_id.keys() | new_by_id.keys()):
        old, new = old_by_id.get(identifier), new_by_id.get(identifier)
        if old is None:
            lines.append(f'ADDED {identifier}: {json.dumps(new, ensure_ascii=False)}')
        elif new is None:
            lines.append(f'REMOVED {identifier}: {json.dumps(old, ensure_ascii=False)}')
        elif old != new:
            lines.append(identifier)
            diff(old, new, '  ')
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--app-default', type=Path, help='Also write the validated app default JSON')
    args = parser.parse_args()
    if args.input.resolve() == args.output.resolve():
        parser.error('Input and output must be different files')
    if args.app_default and args.app_default.resolve() == args.input.resolve():
        parser.error('App default destination must not overwrite the source export')
    source = json.loads(args.input.read_text())
    print(f"Before: {len(source['workouts'])} workouts; {dict(Counter(w['type'] for w in source['workouts']))}")
    print(f'Before unapproved breaches: {len(check(source))}')
    result = revise(source)
    print(f"After: {len(result['workouts'])} workouts; {dict(Counter(w['type'] for w in result['workouts']))}")
    validate_revision(source, result)
    contents = json.dumps(result, indent=2, ensure_ascii=False, allow_nan=False) + '\n'
    validate_revision(source, json.loads(contents))
    print('After unapproved breaches: 0')
    print('PLANNED EXCEPTION: conditional 21 Mar 20-mile long run / 45-mile week = 44.44%; shorten to 16-18 if not recovered.')
    for warning in check(result):
        print(f'ACCEPTED VISIBLE WARNING (Sunday-only swap): {warning}')
    print('VALIDATION PASSED: no other breaches; JSON round-trip verified.')
    args.output.write_text(contents)
    log_path = args.output.with_name(args.output.stem + '-changes.txt')
    log_path.write_text(log_changes(source, result))
    if args.app_default:
        args.app_default.write_text(contents)
    print(f'Wrote {args.output}\nWrote {log_path}')


if __name__ == '__main__':
    main()
