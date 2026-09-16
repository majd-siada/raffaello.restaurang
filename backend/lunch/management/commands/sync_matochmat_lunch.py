"""Sync dagens lunch from Mat och Mat into LunchWeek / LunchDish."""

from django.core.management.base import BaseCommand

from lunch.services import sync_from_matochmat


class Command(BaseCommand):
    help = (
        'Fetch lunch menus from Mat och Mat and safely upsert the current '
        'Swedish ISO week. Idempotent; respects skip_auto_sync manual override.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Parse and report without writing dish rows (still logs an import run).',
        )
        parser.add_argument(
            '--url',
            default='',
            help='Override Mat och Mat lunch page URL (must remain allowlisted).',
        )
        parser.add_argument(
            '--slug',
            default='',
            help='Override restaurant slug (default: raffaello-stekhus-bar).',
        )
        parser.add_argument(
            '--no-notify',
            action='store_true',
            help='Do not send optional Telegram notify on meaningful change.',
        )

    def handle(self, *args, **options):
        result = sync_from_matochmat(
            dry_run=options['dry_run'],
            url=options['url'] or None,
            slug=options['slug'] or None,
            notify=not options['no_notify'],
        )
        style = self.style.SUCCESS
        if result.status.endswith('FAILED') or result.status == 'STALE':
            style = self.style.WARNING
        if result.status in ('FETCH_FAILED', 'PARSE_FAILED'):
            style = self.style.ERROR
        self.stdout.write(
            style(
                f'{result.status}: {result.message} '
                f'(hash={(result.source_hash or "")[:12] or "—"} '
                f'changed={result.changed})'
            )
        )
        if result.status in ('FETCH_FAILED', 'PARSE_FAILED'):
            raise SystemExit(1)
