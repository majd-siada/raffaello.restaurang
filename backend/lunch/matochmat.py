"""
Fetch and parse Raffaello lunch menus from Mat och Mat.

Source of truth (allowlisted HTTPS only):
  https://www.matochmat.se/restauranger/boden/lunch/raffaello-stekhus-bar/

Production parsing is deterministic (no LLM). Parser v2 reads the current
TSR/React Flight embedded payload; v1 JSON blobs remain as a fallback.
"""

from __future__ import annotations

import hashlib
import json
import re
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass, field
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import urljoin, urlparse

from django.conf import settings

PARSER_VERSION = '2'

DAY_SLUG_TO_WEEKDAY = {
    'mandag': 0,
    'tisdag': 1,
    'onsdag': 2,
    'torsdag': 3,
    'fredag': 4,
    'lordag': 5,
    'sondag': 6,
}

DEFAULT_URL = (
    'https://www.matochmat.se/restauranger/boden/lunch/raffaello-stekhus-bar/'
)
DEFAULT_SLUG = 'raffaello-stekhus-bar'
USER_AGENT = 'RaffaelloLunchSync/1.0 (+https://raffaello.se; lunch-import)'

ALLOWED_HOSTS = frozenset({'www.matochmat.se', 'matochmat.se'})
ALLOWED_PATHS = frozenset(
    {
        '/restauranger/boden/lunch/raffaello-stekhus-bar',
        '/restauranger/boden/lunch/raffaello-stekhus-bar/',
        '/lunch/boden/raffaello-stekhus-bar',
        '/lunch/boden/raffaello-stekhus-bar/',
    }
)

MAX_RESPONSE_BYTES = 2_000_000
FETCH_TIMEOUT_SECONDS = 30
MAX_REDIRECTS = 3


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
    source_last_updated: str = ''
    lunch_hours_text: str = ''


@dataclass
class FetchResult:
    ok: bool
    html: str = ''
    url: str = ''
    error: str = ''
    status_code: int | None = None


def monday_of_iso_week(year: int, week: int) -> date:
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


def configured_source_url() -> str:
    return (getattr(settings, 'MATOCHMAT_LUNCH_URL', '') or DEFAULT_URL).strip() or DEFAULT_URL


def configured_slug() -> str:
    return (
        getattr(settings, 'MATOCHMAT_RESTAURANT_SLUG', '') or DEFAULT_SLUG
    ).strip() or DEFAULT_SLUG


def assert_allowlisted_url(url: str) -> str:
    """Reject non-allowlisted URLs (SSRF protection). Fixed source only."""
    target = (url or '').strip()
    if not target:
        raise ValueError('Empty Mat och Mat URL')
    parsed = urlparse(target)
    if parsed.scheme != 'https':
        raise ValueError('Mat och Mat URL must be https')
    host = (parsed.hostname or '').lower()
    if host not in ALLOWED_HOSTS:
        raise ValueError(f'Host not allowlisted for lunch import: {host}')
    if parsed.path not in ALLOWED_PATHS:
        raise ValueError(f'Path not allowlisted for lunch import: {parsed.path}')
    if parsed.query or parsed.fragment:
        raise ValueError('Mat och Mat URL must not include query or fragment')
    # Normalize trailing slash for requests.
    path = parsed.path if parsed.path.endswith('/') else f'{parsed.path}/'
    return f'https://{host}{path}'


def fetch_html(url: str | None = None) -> FetchResult:
    try:
        target = assert_allowlisted_url(url or configured_source_url())
    except ValueError as exc:
        return FetchResult(ok=False, error=str(exc), url=url or '')

    current = target
    for _ in range(MAX_REDIRECTS + 1):
        request = urllib.request.Request(
            current,
            headers={
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'sv-SE,sv;q=0.9',
            },
            method='GET',
        )
        try:
            with urllib.request.urlopen(request, timeout=FETCH_TIMEOUT_SECONDS) as response:
                status = getattr(response, 'status', None) or response.getcode()
                if status in (301, 302, 303, 307, 308):
                    location = response.headers.get('Location') or ''
                    if not location:
                        return FetchResult(
                            ok=False,
                            url=current,
                            status_code=status,
                            error='Redirect without Location',
                        )
                    try:
                        current = assert_allowlisted_url(urljoin(current, location))
                    except ValueError as exc:
                        return FetchResult(
                            ok=False,
                            url=current,
                            status_code=status,
                            error=f'Redirect blocked: {exc}',
                        )
                    continue

                content_type = (response.headers.get('Content-Type') or '').lower()
                if content_type and 'html' not in content_type and 'text/' not in content_type:
                    return FetchResult(
                        ok=False,
                        url=current,
                        status_code=status,
                        error=f'Unexpected content type: {content_type}',
                    )
                raw = response.read(MAX_RESPONSE_BYTES + 1)
                if len(raw) > MAX_RESPONSE_BYTES:
                    return FetchResult(
                        ok=False,
                        url=current,
                        status_code=status,
                        error='Response exceeded size limit',
                    )
                html = raw.decode('utf-8', errors='replace')
                return FetchResult(ok=True, html=html, url=current, status_code=status)
        except urllib.error.HTTPError as exc:
            # HTTPError is also a file-like response; handle redirects if present.
            if exc.code in (301, 302, 303, 307, 308):
                location = exc.headers.get('Location') if exc.headers else ''
                if location:
                    try:
                        current = assert_allowlisted_url(urljoin(current, location))
                        continue
                    except ValueError as blocked:
                        return FetchResult(
                            ok=False,
                            url=current,
                            status_code=exc.code,
                            error=f'Redirect blocked: {blocked}',
                        )
            return FetchResult(
                ok=False,
                url=current,
                status_code=exc.code,
                error=f'HTTP {exc.code}',
            )
        except urllib.error.URLError as exc:
            return FetchResult(ok=False, url=current, error=f'Network error: {exc}')
        except TimeoutError as exc:
            return FetchResult(ok=False, url=current, error=f'Timeout: {exc}')

    return FetchResult(ok=False, url=current, error='Too many redirects')


def _extract_page_data_v1_json(html: str) -> dict:
    scripts = re.findall(r'<script[^>]*>(\{.*?\})</script>', html, re.S)
    if not scripts:
        raise ValueError('No embedded JSON found on Mat och Mat page')
    candidates = sorted(scripts, key=len, reverse=True)
    for blob in candidates[:3]:
        try:
            data = json.loads(blob)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and 'lunchMenuData' in data and 'restaurantData' in data:
            return data
    raise ValueError('Could not parse Mat och Mat lunch JSON')


def _parse_weeks_v1_json(data: dict, slug: str) -> list[ParsedWeek]:
    restaurants = {
        r['id']: r
        for r in data.get('restaurantData') or []
        if isinstance(r, dict) and 'id' in r
    }
    restaurant = next(
        (r for r in restaurants.values() if (r.get('slug') or '') == slug),
        None,
    )
    if restaurant is None:
        raise ValueError(f'Restaurant slug not found on page: {slug}')

    lunch = restaurant.get('lunchFunctionality') or {}
    notes = (lunch.get('menuText') or '').strip()
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


_DISH_RE = re.compile(
    r'entityName:"Lunch dish"[^{}]*?'
    r'description:"((?:\\.|[^"\\])*)"'
    r'[^{}]*?name:"((?:\\.|[^"\\])*)"'
    r'[^{}]*?price:"((?:\\.|[^"\\])*)"',
    re.S,
)

_DAY_MARKER_RE = re.compile(
    r'(mandag|tisdag|onsdag|torsdag|fredag|lordag|sondag):\$R\[\d+\]=',
    re.S,
)

_LUNCH_MENU_RE = re.compile(
    r'lunchMenu:\$R\[\d+\]=\$_TSR\.t\.get\("LunchMenu"\)\(\$R\[\d+\]=\{'
    r'content:\$R\[\d+\]=\{(.*)\},'
    r'hasSearchTermMatches:![01],'
    r'isDefaultMenu:![01],'
    r'lastUpdated:"((?:\\.|[^"\\])*)",'
    r'restaurantId:(\d+),'
    r'week:(\d+),'
    r'year:(\d+)\}',
    re.S,
)

_MENU_TEXT_RE = re.compile(
    r'lunchFunctionality:\$R\[\d+\]=\{[^}]*?menuText:"((?:\\.|[^"\\])*)"',
    re.S,
)

_OPENING_HOUR_RE = re.compile(
    r'closingTime:"((?:\\.|[^"\\])*)"[^}]*?'
    r'isoWeekdayNumber:(\d+)[^}]*?'
    r'open:!([01])[^}]*?'
    r'openingTime:"((?:\\.|[^"\\])*)"',
    re.S,
)


def _unescape_js_string(value: str) -> str:
    try:
        return json.loads(f'"{value}"')
    except json.JSONDecodeError:
        return value.replace(r'\"', '"').replace(r'\n', '\n').replace(r'\\', '\\')


def _parse_opening_hours_text(html: str) -> str:
    """Build a short lunch-hours summary from embedded openingHourList when present."""
    lf = re.search(
        r'lunchFunctionality:\$R\[\d+\]=\{(.*?)\},dinnerFunctionality:',
        html,
        re.S,
    )
    scope = lf.group(1) if lf else html
    rows = []
    for match in _OPENING_HOUR_RE.finditer(scope):
        closing, iso_weekday, bang_digit, opening = match.groups()
        # JS minification: open:!0 => true, open:!1 => false
        is_open = bang_digit == '0'
        if not is_open:
            continue
        weekday = int(iso_weekday) - 1
        if weekday < 0 or weekday > 6:
            continue
        label = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'][weekday]
        rows.append(
            f'{label} {_unescape_js_string(opening)}–{_unescape_js_string(closing)}'
        )
    seen: set[str] = set()
    unique = []
    for row in rows:
        if row in seen:
            continue
        seen.add(row)
        unique.append(row)
    return '; '.join(unique)


def _iter_day_bodies(content_blob: str):
    """Yield (weekday, day_body) without breaking on nested [] inside dishes."""
    markers = list(_DAY_MARKER_RE.finditer(content_blob))
    if not markers:
        raise ValueError('Day markers missing in LunchMenu content (HTML structure changed?)')
    for index, marker in enumerate(markers):
        day_slug = marker.group(1)
        start = marker.end()
        end = markers[index + 1].start() if index + 1 < len(markers) else len(content_blob)
        body = content_blob[start:end].strip().rstrip(',').strip()
        yield DAY_SLUG_TO_WEEKDAY[day_slug], body


def _parse_weeks_v2_flight(html: str, slug: str) -> list[ParsedWeek]:
    """Parse current Mat och Mat TSR / React Flight embedded lunch payload."""
    menus = list(_LUNCH_MENU_RE.finditer(html))
    if not menus:
        raise ValueError('LunchMenu payload not found (HTML structure changed?)')

    notes_match = _MENU_TEXT_RE.search(html)
    notes = _unescape_js_string(notes_match.group(1)) if notes_match else ''
    lunch_hours = _parse_opening_hours_text(html)

    # Soft identity check: allowlisted fetch URL is the SSRF boundary. Prefer page
    # evidence when present, but fixtures/partial HTML may omit the slug string.
    if slug and slug not in html and f'/lunch/' not in html and 'restaurantId:' not in html:
        raise ValueError(f'Restaurant identity markers missing for slug: {slug}')

    weeks: list[ParsedWeek] = []
    for menu in menus:
        content_blob, last_updated, _restaurant_id, week_s, year_s = menu.groups()
        year = int(year_s)
        week_number = int(week_s)
        dishes: list[ParsedDish] = []
        order = 0
        for weekday, day_body in _iter_day_bodies(content_blob):
            if day_body in ('null', '[]') or day_body.startswith('null'):
                continue
            for dish_match in _DISH_RE.finditer(day_body):
                description = _unescape_js_string(dish_match.group(1)).strip()
                name = _unescape_js_string(dish_match.group(2)).strip()
                price_raw = _unescape_js_string(dish_match.group(3)).strip()
                if not name:
                    continue
                dishes.append(
                    ParsedDish(
                        weekday=weekday,
                        name=name[:200],
                        description=description,
                        price=parse_price(price_raw),
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
                source_last_updated=_unescape_js_string(last_updated),
                lunch_hours_text=lunch_hours,
            )
        )

    if not weeks:
        raise ValueError('No lunch weeks parsed from Mat och Mat payload')
    weeks.sort(key=lambda w: (w.year, w.week_number))
    return weeks


def parse_weeks_from_html(html: str, slug: str | None = None) -> list[ParsedWeek]:
    target_slug = (slug or configured_slug()).strip()
    if not html or not html.strip():
        raise ValueError('Empty HTML')
    # Prefer v2 when the current Flight marker is present; do not hide v2 parse errors.
    if '$_TSR.t.get("LunchMenu")' in html or 'get("LunchMenu")' in html:
        return _parse_weeks_v2_flight(html, target_slug)
    data = _extract_page_data_v1_json(html)
    return _parse_weeks_v1_json(data, target_slug)


def fetch_page_data(url: str | None = None) -> dict:
    """Legacy helper — returns v1-shaped data when the page still embeds JSON."""
    result = fetch_html(url)
    if not result.ok:
        raise RuntimeError(result.error or 'Failed to fetch Mat och Mat')
    return _extract_page_data_v1_json(result.html)


def parse_weeks_for_slug(data: dict, slug: str | None = None) -> list[ParsedWeek]:
    """Legacy helper for v1 JSON dicts."""
    return _parse_weeks_v1_json(data, (slug or configured_slug()).strip())


def content_hash_for_week(week: ParsedWeek) -> str:
    """Deterministic SHA-256 over normalized lunch representation."""
    payload = {
        'year': week.year,
        'week_number': week.week_number,
        'notes': (week.notes or '').strip(),
        'lunch_hours_text': (week.lunch_hours_text or '').strip(),
        'dishes': [
            {
                'weekday': d.weekday,
                'name': d.name.strip(),
                'description': (d.description or '').strip(),
                'price': str(d.price) if d.price is not None else None,
                'order': d.order,
            }
            for d in sorted(
                week.dishes,
                key=lambda x: (
                    x.weekday if x.weekday is not None else -1,
                    x.order,
                    x.name,
                ),
            )
        ],
    }
    raw = json.dumps(payload, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


def stockholm_today(now: datetime | None = None) -> date:
    from zoneinfo import ZoneInfo

    if now is None:
        now = datetime.now(ZoneInfo('Europe/Stockholm'))
    elif now.tzinfo is None:
        now = now.replace(tzinfo=ZoneInfo('Europe/Stockholm'))
    else:
        now = now.astimezone(ZoneInfo('Europe/Stockholm'))
    return now.date()


def dishes_for_service_date(week: ParsedWeek, service_date: date) -> list[ParsedDish]:
    """Select dishes for a Swedish calendar date within the parsed ISO week."""
    iso = service_date.isocalendar()
    if week.year != iso.year or week.week_number != iso.week:
        return []
    weekday = service_date.weekday()
    return [d for d in week.dishes if d.weekday == weekday]


def week_to_public_dict(week: ParsedWeek) -> dict[str, Any]:
    return {
        'year': week.year,
        'week_number': week.week_number,
        'week_start': week.week_start.isoformat(),
        'notes': week.notes,
        'lunch_hours_text': week.lunch_hours_text,
        'source_last_updated': week.source_last_updated,
        'dishes': [asdict(d) for d in week.dishes],
        'content_hash': content_hash_for_week(week),
        'parser_version': PARSER_VERSION,
    }
