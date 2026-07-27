"""Delete bookings whose reservation date is older than one month."""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from bookings.models import Booking


class Command(BaseCommand):
    help = 'Delete bookings older than one month (based on reservation date).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show how many bookings would be deleted without deleting them.',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Delete bookings with a reservation date older than this many days (default: 30).',
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        cutoff = timezone.localdate() - timedelta(days=days)

        qs = Booking.objects.filter(date__lt=cutoff)
        count = qs.count()

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'Dry run: {count} booking(s) with date before {cutoff} would be deleted.'
                )
            )
            return

        deleted, _ = qs.delete()
        self.stdout.write(
            self.style.SUCCESS(
                f'Deleted {deleted} booking(s) with reservation date before {cutoff}.'
            )
        )
