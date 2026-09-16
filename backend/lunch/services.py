"""Mat och Mat lunch import pipeline: fetch → parse → hash → safe persist."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from django.db import transaction
from django.utils import timezone

from lunch.matochmat import (
    PARSER_VERSION,
    ParsedWeek,
    assert_allowlisted_url,
    configured_source_url,
    content_hash_for_week,
    dishes_for_service_date,
    fetch_html,
    parse_weeks_from_html,
    stockholm_today,
)
from lunch.models import (
    IMPORT_STATUS_FETCHED,
    IMPORT_STATUS_FETCH_FAILED,
    IMPORT_STATUS_NOT_PUBLISHED,
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

logger = logging.getLogger(__name__)


@dataclass
class SyncResult:
    status: str
    message: str
    changed: bool = False
    source_hash: str = ''
    year: int | None = None
    week_number: int | None = None
    item_count: int | None = None
    service_date: Any = None
    dry_run: bool = False


def _finish_run(
    run: LunchImportRun,
    *,
    status: str,
    message: str,
    changed: bool = False,
    source_hash: str = '',
    year: int | None = None,
    week_number: int | None = None,
    item_count: int | None = None,
    service_date=None,
) -> SyncResult:
    run.status = status
    run.message = message
    run.changed = changed
    run.source_hash = source_hash or ''
    run.year = year
    run.week_number = week_number
    run.item_count = item_count
    run.service_date = service_date
    run.parser_version = PARSER_VERSION
    run.finished_at = timezone.now()
    run.save()
    logger.info(
        'matochmat_lunch_import status=%s hash=%s year=%s week=%s items=%s changed=%s msg=%s',
        status,
        (source_hash or '')[:16],
        year,
        week_number,
        item_count,
        changed,
        message[:200],
    )
    return SyncResult(
        status=status,
        message=message,
        changed=changed,
        source_hash=source_hash or '',
        year=year,
        week_number=week_number,
        item_count=item_count,
        service_date=service_date,
    )


def _maybe_notify_change(result: SyncResult) -> None:
    """Optional operator notify on meaningful change only (existing Telegram infra)."""
    if not result.changed or result.status != IMPORT_STATUS_PUBLISHED:
        return
    try:
        from bookings.whatsapp import send_telegram_text
    except Exception:  # pragma: no cover
        return
    text = (
        f'Raffaello lunch import: ny/ändrad meny publicerad '
        f'v{result.week_number}/{result.year} '
        f'({result.item_count or 0} rätter).'
    )
    try:
        send_telegram_text(text)
    except Exception:
        logger.exception('Lunch change notify failed')


def _apply_week(
    parsed: ParsedWeek,
    *,
    source_url: str,
    content_hash: str,
    status: str,
    publish: bool,
) -> LunchWeek:
    now = timezone.now()
    week, _created = LunchWeek.objects.update_or_create(
        year=parsed.year,
        week_number=parsed.week_number,
        defaults={
            'week_start': parsed.week_start,
            'notes': parsed.notes or '',
            'lunch_hours_text': parsed.lunch_hours_text or '',
            'is_published': publish,
            'source_type': SOURCE_EXTERNAL_MATOCHMAT,
            'source_url': source_url,
            'source_hash': content_hash,
            'fetched_at': now,
            'published_at': now if publish else None,
            'source_last_updated': (parsed.source_last_updated or '')[:64],
            'parser_version': PARSER_VERSION,
            'last_import_status': status,
        },
    )
    week.dishes.all().delete()
    LunchDish.objects.bulk_create(
        [
            LunchDish(
                lunch_week=week,
                weekday=dish.weekday,
                name=dish.name,
                description=dish.description,
                price=dish.price,
                is_available=True,
                order=dish.order,
            )
            for dish in parsed.dishes
        ]
    )
    return week


def sync_from_matochmat(
    *,
    dry_run: bool = False,
    html: str | None = None,
    url: str | None = None,
    slug: str | None = None,
    now: datetime | None = None,
    notify: bool = True,
) -> SyncResult:
    """
    Idempotent import for the current Swedish calendar week.

    Safety rules:
    - FETCH/PARSE failure → preserve existing published data
    - skip_auto_sync (manual override) → do not overwrite
    - unchanged hash → no duplicate rewrite of dishes
    - successful parse with no current-week / no today dishes → NOT_PUBLISHED
    """
    service_date = stockholm_today(now)
    iso = service_date.isocalendar()
    year, week_number = iso.year, iso.week

    try:
        source_url = assert_allowlisted_url(url or configured_source_url())
    except ValueError as exc:
        run = LunchImportRun.objects.create(
            status=IMPORT_STATUS_FETCH_FAILED,
            source_url=url or '',
            service_date=service_date,
            year=year,
            week_number=week_number,
            parser_version=PARSER_VERSION,
            message=str(exc),
        )
        return _finish_run(
            run,
            status=IMPORT_STATUS_FETCH_FAILED,
            message=str(exc),
            service_date=service_date,
            year=year,
            week_number=week_number,
        )

    logger.info(
        'matochmat_lunch_import start url=%s parser=%s service_date=%s',
        source_url,
        PARSER_VERSION,
        service_date.isoformat(),
    )

    run = LunchImportRun.objects.create(
        status=IMPORT_STATUS_FETCHED,
        source_url=source_url,
        service_date=service_date,
        year=year,
        week_number=week_number,
        parser_version=PARSER_VERSION,
        message='started',
    )

    if html is None:
        fetch = fetch_html(source_url)
        if not fetch.ok:
            msg = fetch.error or 'Fetch failed'
            # Preserve previous valid data — do not touch LunchWeek rows.
            return _finish_run(
                run,
                status=IMPORT_STATUS_FETCH_FAILED,
                message=msg,
                service_date=service_date,
                year=year,
                week_number=week_number,
            )
        html = fetch.html
        source_url = fetch.url or source_url

    try:
        weeks = parse_weeks_from_html(html, slug)
    except ValueError as exc:
        return _finish_run(
            run,
            status=IMPORT_STATUS_PARSE_FAILED,
            message=str(exc),
            service_date=service_date,
            year=year,
            week_number=week_number,
        )
    except Exception as exc:  # pragma: no cover — unexpected parser bugs
        logger.exception('Unexpected parse failure')
        return _finish_run(
            run,
            status=IMPORT_STATUS_PARSE_FAILED,
            message=f'Unexpected parse error: {exc}',
            service_date=service_date,
            year=year,
            week_number=week_number,
        )

    current = next(
        (w for w in weeks if w.year == year and w.week_number == week_number),
        None,
    )

    if current is None:
        # Successful parse, but source has no menu for the current Stockholm week.
        if dry_run:
            return _finish_run(
                run,
                status=IMPORT_STATUS_STALE,
                message=(
                    f'Dry-run: no menu for current week v{week_number}/{year} '
                    f'(parsed {len(weeks)} other week(s))'
                ),
                service_date=service_date,
                year=year,
                week_number=week_number,
                item_count=0,
            )
        existing = LunchWeek.objects.filter(year=year, week_number=week_number).first()
        if existing and existing.skip_auto_sync:
            return _finish_run(
                run,
                status=IMPORT_STATUS_SKIPPED_OVERRIDE,
                message='Current week missing in source; manual override preserved',
                service_date=service_date,
                year=year,
                week_number=week_number,
            )
        from datetime import date as date_cls

        empty = ParsedWeek(
            year=year,
            week_number=week_number,
            week_start=date_cls.fromisocalendar(year, week_number, 1),
            notes='',
            dishes=[],
        )
        empty_hash = content_hash_for_week(empty)
        with transaction.atomic():
            _apply_week(
                empty,
                source_url=source_url,
                content_hash=empty_hash,
                status=IMPORT_STATUS_NOT_PUBLISHED,
                publish=False,
            )
        return _finish_run(
            run,
            status=IMPORT_STATUS_STALE,
            message=f'No current-week menu in source (v{week_number}/{year})',
            service_date=service_date,
            year=year,
            week_number=week_number,
            item_count=0,
            changed=True,
            source_hash=empty_hash,
        )

    content_hash = content_hash_for_week(current)
    today_dishes = dishes_for_service_date(current, service_date)
    item_count = len(current.dishes)
    existing = LunchWeek.objects.filter(
        year=current.year, week_number=current.week_number
    ).first()

    if existing and existing.skip_auto_sync:
        return _finish_run(
            run,
            status=IMPORT_STATUS_SKIPPED_OVERRIDE,
            message='Skipped — skip_auto_sync (manual override)',
            source_hash=content_hash,
            service_date=service_date,
            year=current.year,
            week_number=current.week_number,
            item_count=item_count,
        )

    if existing and existing.source_hash and existing.source_hash == content_hash:
        if not dry_run:
            existing.fetched_at = timezone.now()
            existing.last_import_status = IMPORT_STATUS_UNCHANGED
            existing.parser_version = PARSER_VERSION
            existing.source_url = source_url
            existing.save(
                update_fields=[
                    'fetched_at',
                    'last_import_status',
                    'parser_version',
                    'source_url',
                ]
            )
        return _finish_run(
            run,
            status=IMPORT_STATUS_UNCHANGED,
            message='Content hash unchanged — no dish rewrite',
            source_hash=content_hash,
            service_date=service_date,
            year=current.year,
            week_number=current.week_number,
            item_count=item_count,
            changed=False,
        )

    # Publish only when the week has dish content from source.
    # Missing *today* alone does not invent dishes; week may still publish other days.
    publish = item_count > 0
    status = IMPORT_STATUS_PUBLISHED if publish else IMPORT_STATUS_NOT_PUBLISHED
    if publish and not today_dishes:
        # Honest: week published from source, but today's weekday has no entries.
        message = (
            f'Published week v{current.week_number}/{current.year} '
            f'({item_count} items); today ({service_date.isoformat()}) has no dishes in source'
        )
    elif publish:
        message = (
            f'Published week v{current.week_number}/{current.year} '
            f'({item_count} items, today={len(today_dishes)})'
        )
    else:
        message = (
            f'Current week present but empty — NOT_PUBLISHED '
            f'v{current.week_number}/{current.year}'
        )

    if dry_run:
        return _finish_run(
            run,
            status=status,
            message=f'Dry-run: {message}',
            source_hash=content_hash,
            service_date=service_date,
            year=current.year,
            week_number=current.week_number,
            item_count=item_count,
            changed=True,
        )

    with transaction.atomic():
        _apply_week(
            current,
            source_url=source_url,
            content_hash=content_hash,
            status=status,
            publish=publish,
        )

    result = _finish_run(
        run,
        status=status,
        message=message,
        source_hash=content_hash,
        service_date=service_date,
        year=current.year,
        week_number=current.week_number,
        item_count=item_count,
        changed=True,
    )
    if notify:
        _maybe_notify_change(result)
    return result


def import_status_payload() -> dict[str, Any]:
    """Safe public-ish status for operators (no secrets)."""
    last = LunchImportRun.objects.order_by('-started_at').first()
    last_ok = (
        LunchImportRun.objects.filter(
            status__in=[IMPORT_STATUS_PUBLISHED, IMPORT_STATUS_UNCHANGED]
        )
        .order_by('-started_at')
        .first()
    )
    last_fail = (
        LunchImportRun.objects.filter(
            status__in=[IMPORT_STATUS_FETCH_FAILED, IMPORT_STATUS_PARSE_FAILED]
        )
        .order_by('-started_at')
        .first()
    )
    today = stockholm_today()
    iso = today.isocalendar()
    current = LunchWeek.objects.filter(
        year=iso.year, week_number=iso.week
    ).prefetch_related('dishes').first()
    today_count = 0
    if current:
        today_count = current.dishes.filter(weekday=today.weekday(), is_available=True).count()

    return {
        'parser_version': PARSER_VERSION,
        'service_date': today.isoformat(),
        'last_run': None
        if last is None
        else {
            'started_at': last.started_at.isoformat(),
            'finished_at': last.finished_at.isoformat() if last.finished_at else None,
            'status': last.status,
            'message': last.message,
            'source_hash': last.source_hash,
            'changed': last.changed,
        },
        'last_success': None
        if last_ok is None
        else {
            'started_at': last_ok.started_at.isoformat(),
            'status': last_ok.status,
            'source_hash': last_ok.source_hash,
        },
        'last_failure': None
        if last_fail is None
        else {
            'started_at': last_fail.started_at.isoformat(),
            'status': last_fail.status,
            'message': last_fail.message,
        },
        'current_week': None
        if current is None
        else {
            'year': current.year,
            'week_number': current.week_number,
            'is_published': current.is_published,
            'source_type': current.source_type,
            'source_hash': current.source_hash,
            'fetched_at': current.fetched_at.isoformat() if current.fetched_at else None,
            'published_at': current.published_at.isoformat() if current.published_at else None,
            'last_import_status': current.last_import_status,
            'manual_override': current.skip_auto_sync,
            'dish_count': current.dishes.count(),
            'today_dish_count': today_count,
            'source_url': current.source_url,
        },
    }
