"""Fetch and parse lunch menus from Mat och Mat's embedded page JSON."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from datetime import date

from django.conf import settings

DAY_SLUG_TO_WEEKDAY = {
    'mandag': 0,
    'tisdag': 1,
    'onsdag': 2,
    'torsdag': 3,
    'fredag': 4,
    'lordag': 5,
    'sondag': 6,
}

DEFAULT_URL = 'https://www.matochmat.se/lunch/boden/raffaello-stekhus-bar/'
DEFAULT_SLUG = 'raffaello-stekhus-bar'
USER_AGENT = 'RaffaelloLunchSync/1.0 (+https://raffaello.se)'


@dataclass
class ParsedDish:
    weekday: int | None
    name: str
    description: str
    price: Decimal | None
    order: int


@dataclass
class ParsedWeek:
    year: int
    week_number: int
    week_start: date
    notes: str
    dishes: list[ParsedDish] = field(default_factory=list)


def monday_of_iso_week(year: int, week: int) -> date:
    # ISO: week 1's Thursday is in `year`; Monday is day 1.
    return date.fromisocalendar(year, week, 1)


def parse_price(raw) -> Decimal | None:
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None
    cleaned = (
        text.lower()
        .replace('kr', ' ')
        .replace('sek', ' ')
        .replace('från', ' ')
        .replace('fr.', ' ')
        .replace('fr ', ' ')
        .replace(':', ' ')
        .replace(',', '.')
    )
    match = re.search(r'(\d+(?:\.\d+)?)', cleaned)
    if not match:
        return None
    try:
        return Decimal(match.group(1))
    except InvalidOperation:
        return None


def _extract_page_data(html: str) -> dict:
    scripts = re.findall(r'<script[^>]*>(\{.*?\})</script>', html, re.S)
    if not scripts:
        raise ValueError('No embedded JSON found on Mat och Mat page')
    # Page ships one large state blob; pick the biggest object.
    candidates = sorted(scripts, key=len, reverse=True)
    for blob in candidates[:3]:
        try:
            data = json.loads(blob)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and 'lunchMenuData' in data and 'restaurantData' in data:
            return data
    raise ValueError('Could not parse Mat och Mat lunch JSON')


def fetch_page_data(url: str | None = None) -> dict:
    target = (url or getattr(settings, 'MATOCHMAT_LUNCH_URL', '') or DEFAULT_URL).strip()
    request = urllib.request.Request(
        target,
        headers={'User-Agent': USER_AGENT, 'Accept': 'text/html'},
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            html = response.read().decode('utf-8', errors='replace')
    except urllib.error.URLError as exc:
        raise RuntimeError(f'Failed to fetch Mat och Mat: {exc}') from exc
    return _extract_page_data(html)


def _restaurant_notes(restaurant: dict) -> str:
    lunch = restaurant.get('lunchFunctionality') or {}
    return (lunch.get('menuText') or '').strip()


def parse_weeks_for_slug(data: dict, slug: str | None = None) -> list[ParsedWeek]:
    target_slug = (slug or getattr(settings, 'MATOCHMAT_RESTAURANT_SLUG', '') or DEFAULT_SLUG).strip()
    restaurants = {
        r['id']: r
        for r in data.get('restaurantData') or []
        if isinstance(r, dict) and 'id' in r
    }
    restaurant = next(
        (r for r in restaurants.values() if (r.get('slug') or '') == target_slug),
        None,
    )
    if restaurant is None:
        raise ValueError(f'Restaurant slug not found on page: {target_slug}')

    notes = _restaurant_notes(restaurant)
    restaurant_id = restaurant['id']
    weeks: list[ParsedWeek] = []

    for menu in data.get('lunchMenuData') or []:
        if menu.get('restaurantId') != restaurant_id:
            continue
        year = int(menu['year'])
        week_number = int(menu['week'])
        content = menu.get('content') or {}
        if isinstance(content, str):
            content = json.loads(content) if content.strip() else {}

        dishes: list[ParsedDish] = []
        order = 0
        for day_slug, weekday in DAY_SLUG_TO_WEEKDAY.items():
            day_dishes = content.get(day_slug) or []
            if not isinstance(day_dishes, list):
                continue
            for dish in day_dishes:
                if not isinstance(dish, dict):
                    continue
                name = (dish.get('name') or '').strip()
                if not name:
                    continue
                dishes.append(
                    ParsedDish(
                        weekday=weekday,
                        name=name[:200],
                        description=(dish.get('description') or '').strip(),
                        price=parse_price(dish.get('price')),
                        order=order,
                    )
                )
                order += 1

        weeks.append(
            ParsedWeek(
                year=year,
                week_number=week_number,
                week_start=monday_of_iso_week(year, week_number),
                notes=notes,
                dishes=dishes,
            )
        )

    weeks.sort(key=lambda w: (w.year, w.week_number))
    return weeks
