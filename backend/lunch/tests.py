"""Deterministic Mat och Mat lunch importer tests (no live network)."""

from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from lunch.matochmat import (
    PARSER_VERSION,
    FetchResult,
    assert_allowlisted_url,
    content_hash_for_week,
    dishes_for_service_date,
    parse_price,
    parse_weeks_from_html,
    stockholm_today,
)
from lunch.models import (
    IMPORT_STATUS_FETCH_FAILED,
    IMPORT_STATUS_PARSE_FAILED,
    IMPORT_STATUS_PUBLISHED,
    IMPORT_STATUS_SKIPPED_OVERRIDE,
    IMPORT_STATUS_STALE,
    IMPORT_STATUS_UNCHANGED,
    SOURCE_EXTERNAL_MATOCHMAT,
    LunchDish,
    LunchImportRun,
    LunchWeek,
)
from lunch.services import sync_from_matochmat

FIXTURES = Path(__file__).resolve().parent / 'fixtures'
MINIMAL_HTML = (FIXTURES / 'matochmat_page_minimal.html').read_text(encoding='utf-8')

# Monday 2026-09-14 is ISO week 38.
STOCKHOLM_MON = datetime(2026, 9, 14, 12, 0, tzinfo=ZoneInfo('Europe/Stockholm'))
STOCKHOLM_WED = datetime(2026, 9, 16, 12, 0, tzinfo=ZoneInfo('Europe/Stockholm'))

SOURCE_URL = 'https://www.matochmat.se/restauranger/boden/lunch/raffaello-stekhus-bar/'


def _html_with_menu_text(base: str = MINIMAL_HTML) -> str:
    """Inject menuText + opening hours into the minimal Flight fixture."""
    inject = (
        'lunchFunctionality:$R[200]={menuText:"Till dagens ingår sallad, bröd och kaffe",'
        'openingHourList:$R[201]=['
        '$R[202]={closingTime:"14:00",isoWeekdayNumber:1,open:!0,openingTime:"11:00"},'
        '$R[203]={closingTime:"14:00",isoWeekdayNumber:2,open:!0,openingTime:"11:00"}'
        ']},dinnerFunctionality:'
    )
    return base.replace('<script>', f'<script>{inject}', 1)


class ParserUnitTests(TestCase):
    def test_successful_parse_multiple_dishes_prices_descriptions(self):
        weeks = parse_weeks_from_html(MINIMAL_HTML, 'raffaello-stekhus-bar')
        self.assertEqual(len(weeks), 1)
        week = weeks[0]
        self.assertEqual(week.year, 2026)
        self.assertEqual(week.week_number, 38)
        self.assertGreaterEqual(len(week.dishes), 10)
        monday = [d for d in week.dishes if d.weekday == 0]
        self.assertGreaterEqual(len(monday), 6)
        pasta = next(d for d in monday if d.name == 'Dagens pasta')
        self.assertEqual(pasta.price, Decimal('135'))
        self.assertIn('Currysås', pasta.description)
        lov = next(d for d in monday if d.name == 'Lövstek150g')
        self.assertEqual(lov.price, Decimal('139'))

    def test_inclusions_and_hours_from_source(self):
        html = _html_with_menu_text()
        week = parse_weeks_from_html(html, 'raffaello-stekhus-bar')[0]
        self.assertIn('sallad', week.notes.lower())
        self.assertIn('Mån', week.lunch_hours_text)
        self.assertIn('11:00', week.lunch_hours_text)

    def test_lunch_hours_text_excludes_weekend(self):
        inject = (
            'lunchFunctionality:$R[200]={menuText:"x",'
            'openingHourList:$R[201]=['
            '$R[202]={closingTime:"14:00",isoWeekdayNumber:1,open:!0,openingTime:"10:45"},'
            '$R[203]={closingTime:"14:00",isoWeekdayNumber:5,open:!0,openingTime:"10:45"},'
            '$R[204]={closingTime:"14:00",isoWeekdayNumber:6,open:!0,openingTime:"10:45"},'
            '$R[205]={closingTime:"14:00",isoWeekdayNumber:7,open:!0,openingTime:"10:45"}'
            ']},dinnerFunctionality:'
        )
        html = MINIMAL_HTML.replace('<script>', f'<script>{inject}', 1)
        week = parse_weeks_from_html(html, 'raffaello-stekhus-bar')[0]
        self.assertIn('Mån', week.lunch_hours_text)
        self.assertIn('Fre', week.lunch_hours_text)
        self.assertNotIn('Lör', week.lunch_hours_text)
        self.assertNotIn('Sön', week.lunch_hours_text)

    def test_current_day_detection(self):
        week = parse_weeks_from_html(MINIMAL_HTML)[0]
        mon = dishes_for_service_date(week, date(2026, 9, 14))
        wed = dishes_for_service_date(week, date(2026, 9, 16))
        self.assertTrue(mon)
        self.assertEqual(wed, [])

    def test_source_hash_stable_and_changes(self):
        week = parse_weeks_from_html(MINIMAL_HTML)[0]
        h1 = content_hash_for_week(week)
        h2 = content_hash_for_week(week)
        self.assertEqual(h1, h2)
        self.assertEqual(len(h1), 64)
        week.dishes[0].price = Decimal('999')
        self.assertNotEqual(h1, content_hash_for_week(week))

    def test_malformed_html_parse_failed(self):
        with self.assertRaises(ValueError):
            parse_weeks_from_html('<html><body>no lunch payload</body></html>')

    def test_unexpected_price_format(self):
        self.assertEqual(parse_price('139 kr'), Decimal('139'))
        self.assertEqual(parse_price(''), None)
        self.assertEqual(parse_price('abc'), None)
        self.assertEqual(parse_price('från 135,50'), Decimal('135.50'))

    def test_timezone_stockholm_today(self):
        # 2026-09-14 23:30 UTC is already 2026-09-15 in Stockholm (UTC+2).
        utc_late = datetime(2026, 9, 14, 23, 30, tzinfo=ZoneInfo('UTC'))
        self.assertEqual(stockholm_today(utc_late), date(2026, 9, 15))

    def test_url_allowlist_blocks_ssrf(self):
        with self.assertRaises(ValueError):
            assert_allowlisted_url('https://evil.example/lunch')
        with self.assertRaises(ValueError):
            assert_allowlisted_url('http://www.matochmat.se/restauranger/boden/lunch/raffaello-stekhus-bar/')
        ok = assert_allowlisted_url(SOURCE_URL)
        self.assertTrue(ok.startswith('https://'))


@override_settings(
    MATOCHMAT_LUNCH_URL=SOURCE_URL,
    MATOCHMAT_RESTAURANT_SLUG='raffaello-stekhus-bar',
)
class SyncPipelineTests(TestCase):
    def test_successful_fetch_path_via_html_publish(self):
        result = sync_from_matochmat(
            html=_html_with_menu_text(),
            now=STOCKHOLM_MON,
            notify=False,
        )
        self.assertEqual(result.status, IMPORT_STATUS_PUBLISHED)
        self.assertTrue(result.changed)
        week = LunchWeek.objects.get(year=2026, week_number=38)
        self.assertTrue(week.is_published)
        self.assertEqual(week.source_type, SOURCE_EXTERNAL_MATOCHMAT)
        self.assertEqual(week.parser_version, PARSER_VERSION)
        self.assertTrue(week.source_hash)
        self.assertGreater(week.dishes.count(), 0)
        self.assertIn('sallad', week.notes.lower())

    def test_unchanged_content_no_duplicate_dishes(self):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        first_ids = list(LunchDish.objects.order_by('id').values_list('id', flat=True))
        first_hash = LunchWeek.objects.get(year=2026, week_number=38).source_hash
        result = sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        self.assertEqual(result.status, IMPORT_STATUS_UNCHANGED)
        self.assertFalse(result.changed)
        self.assertEqual(
            list(LunchDish.objects.order_by('id').values_list('id', flat=True)),
            first_ids,
        )
        self.assertEqual(
            LunchWeek.objects.get(year=2026, week_number=38).source_hash,
            first_hash,
        )

    def test_changed_content_updates(self):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        altered = MINIMAL_HTML.replace('Dagens pasta', 'Dagens pasta SPECIAL', 1)
        result = sync_from_matochmat(html=altered, now=STOCKHOLM_MON, notify=False)
        self.assertEqual(result.status, IMPORT_STATUS_PUBLISHED)
        self.assertTrue(result.changed)
        self.assertTrue(
            LunchDish.objects.filter(name='Dagens pasta SPECIAL').exists()
        )

    def test_duplicate_scheduled_execution_idempotent(self):
        a = sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        b = sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        self.assertEqual(a.status, IMPORT_STATUS_PUBLISHED)
        self.assertEqual(b.status, IMPORT_STATUS_UNCHANGED)
        self.assertEqual(LunchWeek.objects.filter(year=2026, week_number=38).count(), 1)

    def test_manual_override_protection(self):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        week = LunchWeek.objects.get(year=2026, week_number=38)
        week.skip_auto_sync = True
        week.save(update_fields=['skip_auto_sync'])
        LunchDish.objects.filter(lunch_week=week).update(name='MANUAL ONLY')
        result = sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        self.assertEqual(result.status, IMPORT_STATUS_SKIPPED_OVERRIDE)
        self.assertTrue(LunchDish.objects.filter(name='MANUAL ONLY').exists())
        self.assertFalse(LunchDish.objects.filter(name='Lövstek150g').exists())

    def test_missing_current_day_does_not_invent(self):
        result = sync_from_matochmat(
            html=MINIMAL_HTML,
            now=STOCKHOLM_WED,
            notify=False,
        )
        self.assertEqual(result.status, IMPORT_STATUS_PUBLISHED)
        week = LunchWeek.objects.get(year=2026, week_number=38)
        self.assertEqual(week.dishes.filter(weekday=2).count(), 0)

    def test_stale_other_week_not_published_as_today(self):
        # Fixture is week 38; pretend today is week 39.
        later = datetime(2026, 9, 21, 12, 0, tzinfo=ZoneInfo('Europe/Stockholm'))
        result = sync_from_matochmat(html=MINIMAL_HTML, now=later, notify=False)
        self.assertEqual(result.status, IMPORT_STATUS_STALE)
        current = LunchWeek.objects.get(year=2026, week_number=39)
        self.assertFalse(current.is_published)
        self.assertEqual(current.dishes.count(), 0)

    @patch('lunch.services.fetch_html')
    def test_network_failure_preserves_published(self, mock_fetch):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        dish_count = LunchDish.objects.count()
        mock_fetch.return_value = FetchResult(ok=False, error='Network error: timeout', url=SOURCE_URL)
        result = sync_from_matochmat(now=STOCKHOLM_MON, notify=False)
        self.assertEqual(result.status, IMPORT_STATUS_FETCH_FAILED)
        self.assertEqual(LunchDish.objects.count(), dish_count)
        self.assertTrue(LunchWeek.objects.get(year=2026, week_number=38).is_published)

    @patch('lunch.services.fetch_html')
    def test_http_failure_preserves_published(self, mock_fetch):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        mock_fetch.return_value = FetchResult(
            ok=False, error='HTTP 503', url=SOURCE_URL, status_code=503
        )
        result = sync_from_matochmat(now=STOCKHOLM_MON, notify=False)
        self.assertEqual(result.status, IMPORT_STATUS_FETCH_FAILED)

    def test_malformed_html_does_not_wipe(self):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        count = LunchDish.objects.count()
        result = sync_from_matochmat(
            html='<html>broken</html>',
            now=STOCKHOLM_MON,
            notify=False,
        )
        self.assertEqual(result.status, IMPORT_STATUS_PARSE_FAILED)
        self.assertEqual(LunchDish.objects.count(), count)

    def test_publish_safety_empty_week_not_published(self):
        # Strip dish payloads but keep LunchMenu shell for week 38 with empty days.
        empty_days = (
            'lunchMenu:$R[1]=$_TSR.t.get("LunchMenu")($R[2]={content:$R[3]={'
            'mandag:$R[4]=[],tisdag:$R[5]=[],onsdag:$R[6]=[],torsdag:$R[7]=[],'
            'fredag:$R[8]=[],lordag:$R[9]=[],sondag:$R[10]=[]},'
            'hasSearchTermMatches:!1,isDefaultMenu:!1,'
            'lastUpdated:"2026-09-14 00:00:00",restaurantId:1497,week:38,year:2026})'
        )
        html = f'<html><body><script>{empty_days}</script></body></html>'
        result = sync_from_matochmat(html=html, now=STOCKHOLM_MON, notify=False)
        self.assertEqual(result.status, 'NOT_PUBLISHED')
        week = LunchWeek.objects.get(year=2026, week_number=38)
        self.assertFalse(week.is_published)

    def test_import_run_logged(self):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        run = LunchImportRun.objects.latest('started_at')
        self.assertEqual(run.status, IMPORT_STATUS_PUBLISHED)
        self.assertEqual(run.parser_version, PARSER_VERSION)
        self.assertTrue(run.source_hash)


@override_settings(
    MATOCHMAT_LUNCH_URL=SOURCE_URL,
    MATOCHMAT_RESTAURANT_SLUG='raffaello-stekhus-bar',
)
class LunchApiCompatTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)

    def test_api_lunch_backwards_compatible(self):
        with patch('django.utils.timezone.localdate', return_value=date(2026, 9, 14)):
            res = self.client.get('/api/lunch/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['year'], 2026)
        self.assertEqual(data['week_number'], 38)
        self.assertIn('dishes', data)
        self.assertIn('intro_text', data)
        self.assertIn('notes', data)
        self.assertTrue(data['dishes'])
        self.assertEqual(data['source_type'], SOURCE_EXTERNAL_MATOCHMAT)
        self.assertIsNotNone(data['source_attribution'])
        self.assertIn('Mat och Mat', data['source_attribution']['label'])

    def test_api_empty_state_when_unpublished(self):
        LunchWeek.objects.filter(year=2026, week_number=38).update(is_published=False)
        with patch('django.utils.timezone.localdate', return_value=date(2026, 9, 14)):
            res = self.client.get('/api/lunch/')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json().get('empty'))
        self.assertEqual(res.json()['dishes'], [])

    def test_import_status_endpoint(self):
        res = self.client.get('/api/lunch/import-status/')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body['parser_version'], PARSER_VERSION)
        self.assertIn('last_run', body)
        self.assertIn('current_week', body)
