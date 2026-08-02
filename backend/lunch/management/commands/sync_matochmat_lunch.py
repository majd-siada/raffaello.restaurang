"""Sync dagens lunch from Mat och Mat into LunchWeek / LunchDish."""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from lunch.matochmat import fetch_page_data, parse_weeks_for_slug
from lunch.models import LunchDish, LunchWeek


class Command(BaseCommand):
    help = 'Fetch lunch menus from Mat och Mat and upsert them into the database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Parse and report without writing to the database.',
        )
        parser.add_argument(
            '--url',
            default='',
            help='Override Mat och Mat lunch page URL.',
        )
        parser.add_argument(
            '--slug',
            default='',
            help='Override restaurant slug (default: raffaello-stekhus-bar).',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        url = options['url'] or None
        slug = options['slug'] or None

        try:
            data = fetch_page_data(url)
            weeks = parse_weeks_for_slug(data, slug)
        except Exception as exc:
            raise CommandError(str(exc)) from exc

        if not weeks:
            self.stdout.write(self.style.WARNING('No lunch menus found for restaurant.'))
            return

        synced = 0
        skipped = 0

        for parsed in weeks:
            existing = LunchWeek.objects.filter(
                year=parsed.year,
                week_number=parsed.week_number,
            ).first()

            if existing and existing.skip_auto_sync:
                skipped += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'Skipped v{parsed.week_number}/{parsed.year} (skip_auto_sync).'
                    )
                )
                continue

            self.stdout.write(
                f'{"Would sync" if dry_run else "Syncing"} '
                f'v{parsed.week_number}/{parsed.year}: {len(parsed.dishes)} dish(es)'
            )

            if dry_run:
                for dish in parsed.dishes:
                    price = f'{dish.price} SEK' if dish.price is not None else '—'
                    self.stdout.write(
                        f'  - weekday={dish.weekday} {dish.name} ({price})'
                    )
                synced += 1
                continue

            with transaction.atomic():
                week, _ = LunchWeek.objects.update_or_create(
                    year=parsed.year,
                    week_number=parsed.week_number,
                    defaults={
                        'week_start': parsed.week_start,
                        'notes': parsed.notes,
                        'is_published': True,
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
            synced += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Done. {"Would sync" if dry_run else "Synced"} {synced} week(s)'
                + (f', skipped {skipped}' if skipped else '')
                + '.'
            )
        )
