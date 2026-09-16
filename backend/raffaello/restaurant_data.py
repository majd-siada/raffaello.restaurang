"""Canonical restaurant opening hours and booking rules.

Sources (feature flag ``OPENING_HOURS_SOURCE``):
- ``json`` (default): ``raffaello/data/opening_hours.json``
- ``db``: ``restaurant.OpeningHoursDay`` + ``OpeningHoursSettings``

JSON file is never deleted. FE mirror ``frontend/src/data/openingHours.json``
remains for parity tests / offline fallback until consumers hydrate from API.
"""

from __future__ import annotations

import json
from datetime import time
from functools import lru_cache
from pathlib import Path

from django.conf import settings

_DATA_PATH = Path(__file__).resolve().parent / 'data' / 'opening_hours.json'

# Python weekday frozenset → public schedule label (matches current JSON)
_GROUP_LABELS = {
    frozenset({0, 1, 2, 3}): 'Mån–tors',
    frozenset({4}): 'Fredag',
    frozenset({5}): 'Lördag',
    frozenset({6}): 'Söndag',
}


def opening_hours_source() -> str:
    raw = getattr(settings, 'OPENING_HOURS_SOURCE', 'json') or 'json'
    return str(raw).strip().lower()


def clear_hours_caches() -> None:
    load_opening_hours_config.cache_clear()


@lru_cache(maxsize=1)
def load_opening_hours_config() -> dict:
    with _DATA_PATH.open(encoding='utf-8') as fh:
        return json.load(fh)


def _python_to_js(weekday: int) -> int:
    return (weekday + 1) % 7


def _fmt_time(t: time) -> str:
    return t.strftime('%H:%M')


def _schedule_from_day_map(
    day_map: dict[int, tuple[time, time] | None],
    *,
    timezone: str,
    max_guests: int,
    slot_interval: int,
) -> dict:
    """Build public payload shape from weekday → (opens, closes) or None if closed."""
    # Group consecutive weekdays with identical hours (open days only for groups)
    schedule = []
    used: set[int] = set()
    for start in range(7):
        if start in used:
            continue
        hours = day_map.get(start)
        if hours is None:
            used.add(start)
            continue
        group = [start]
        for nxt in range(start + 1, 7):
            if nxt in used:
                break
            if day_map.get(nxt) == hours:
                group.append(nxt)
            else:
                break
        for g in group:
            used.add(g)
        key = frozenset(group)
        label = _GROUP_LABELS.get(key)
        if label is None:
            # Fallback label if Admin creates unusual groupings
            names = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
            label = '–'.join(names[g] for g in group) if len(group) > 1 else names[group[0]]
        opens, closes = hours
        schedule.append(
            {
                'label': label,
                'days_js': [_python_to_js(w) for w in group],
                'opens': _fmt_time(opens),
                'closes': _fmt_time(closes),
            }
        )
    return {
        'timezone': timezone,
        'max_guests_online': max_guests,
        'slot_interval_minutes': slot_interval,
        'schedule': schedule,
    }


def _payload_from_json() -> dict:
    cfg = load_opening_hours_config()
    return {
        'timezone': cfg.get('timezone', 'Europe/Stockholm'),
        'max_guests_online': cfg['max_guests_online'],
        'slot_interval_minutes': cfg['slot_interval_minutes'],
        'schedule': [
            {
                'label': row['label'],
                'days_js': list(row['days_js']),
                'opens': row['opens'],
                'closes': row['closes'],
            }
            for row in cfg['schedule']
        ],
    }


def _day_map_from_json() -> dict[int, tuple[time, time] | None]:
    cfg = load_opening_hours_config()
    result: dict[int, tuple[time, time] | None] = {i: None for i in range(7)}
    for row in cfg['schedule']:
        opens = time.fromisoformat(row['opens'])
        closes = time.fromisoformat(row['closes'])
        for wd in row['weekday_python']:
            result[int(wd)] = (opens, closes)
    return result


def _payload_from_db() -> dict:
    from restaurant.models import OpeningHoursDay, OpeningHoursSettings

    settings_row = OpeningHoursSettings.objects.filter(pk=1).first()
    if not settings_row:
        raise RuntimeError('OpeningHoursSettings missing — run migrations.')
    day_map: dict[int, tuple[time, time] | None] = {i: None for i in range(7)}
    for day in OpeningHoursDay.objects.all():
        if day.is_closed or day.opens is None or day.closes is None:
            day_map[day.weekday] = None
        else:
            day_map[day.weekday] = (day.opens, day.closes)
    return _schedule_from_day_map(
        day_map,
        timezone=settings_row.timezone,
        max_guests=settings_row.max_guests_online,
        slot_interval=settings_row.slot_interval_minutes,
    )


def _day_map_from_db() -> dict[int, tuple[time, time]]:
    """Open days only — closed days omitted (matches historical JSON map)."""
    from restaurant.models import OpeningHoursDay

    result: dict[int, tuple[time, time]] = {}
    for day in OpeningHoursDay.objects.all():
        if day.is_closed or day.opens is None or day.closes is None:
            continue
        result[day.weekday] = (day.opens, day.closes)
    return result


def opening_hours_by_weekday() -> dict[int, tuple[time, time]]:
    """Python ``date.weekday()`` → (opens, closes). Closed days omitted."""
    if opening_hours_source() == 'db':
        return _day_map_from_db()
    result: dict[int, tuple[time, time]] = {}
    for wd, hours in _day_map_from_json().items():
        if hours is not None:
            result[wd] = hours
    return result


def max_guests_online() -> int:
    if opening_hours_source() == 'db':
        from restaurant.models import OpeningHoursSettings

        row = OpeningHoursSettings.objects.filter(pk=1).first()
        if row:
            return int(row.max_guests_online)
    return int(load_opening_hours_config()['max_guests_online'])


def public_restaurant_payload() -> dict:
    """JSON for GET /api/restaurant/ — hours + booking rules (no secrets)."""
    if opening_hours_source() == 'db':
        return _payload_from_db()
    return _payload_from_json()


def normalize_public_payload(payload: dict) -> dict:
    """Stable comparison form for drift detection."""
    schedule = [
        {
            'label': row['label'],
            'days_js': list(row['days_js']),
            'opens': row['opens'],
            'closes': row['closes'],
        }
        for row in payload.get('schedule', [])
    ]
    return {
        'timezone': payload.get('timezone', 'Europe/Stockholm'),
        'max_guests_online': int(payload['max_guests_online']),
        'slot_interval_minutes': int(payload['slot_interval_minutes']),
        'schedule': schedule,
    }


def detect_hours_drift() -> dict:
    """
    Compare JSON-backed public payload vs DB-backed payload.
    Does not choose a winner — reports match/drift only.
    """
    json_payload = normalize_public_payload(_payload_from_json())
    try:
        db_payload = normalize_public_payload(_payload_from_db())
    except Exception as exc:  # noqa: BLE001 — report missing tables/seed
        return {
            'match': False,
            'status': 'DRIFT',
            'error': str(exc),
            'json': json_payload,
            'db': None,
        }
    match = json_payload == db_payload
    return {
        'match': match,
        'status': 'MATCH' if match else 'DRIFT',
        'json': json_payload,
        'db': db_payload,
        'active_source': opening_hours_source(),
    }


def seed_days_from_json_config(cfg: dict | None = None) -> None:
    """Idempotent seed used by data migration and tests."""
    from restaurant.models import OpeningHoursDay, OpeningHoursSettings

    cfg = cfg if cfg is not None else load_opening_hours_config()
    OpeningHoursSettings.objects.update_or_create(
        pk=1,
        defaults={
            'timezone': cfg.get('timezone', 'Europe/Stockholm'),
            'max_guests_online': int(cfg['max_guests_online']),
            'slot_interval_minutes': int(cfg['slot_interval_minutes']),
        },
    )
    day_map: dict[int, tuple[time, time] | None] = {i: None for i in range(7)}
    for row in cfg['schedule']:
        opens = time.fromisoformat(row['opens'])
        closes = time.fromisoformat(row['closes'])
        for wd in row['weekday_python']:
            day_map[int(wd)] = (opens, closes)

    for wd in range(7):
        hours = day_map.get(wd)
        if hours is None:
            OpeningHoursDay.objects.update_or_create(
                weekday=wd,
                defaults={'opens': None, 'closes': None, 'is_closed': True},
            )
        else:
            opens, closes = hours
            OpeningHoursDay.objects.update_or_create(
                weekday=wd,
                defaults={'opens': opens, 'closes': closes, 'is_closed': False},
            )
