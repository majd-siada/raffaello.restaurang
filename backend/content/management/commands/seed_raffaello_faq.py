"""
Idempotent seed of authorized everyday Swedish FAQ for Raffaello.

Safe to re-run: matches on question text, updates answer/order/publish.
Does not invent legal policy, hours, prices, or allergens beyond menu guidance.
"""

from django.core.management.base import BaseCommand

from content.models import FaqItem

# Authorized production cutover FAQ (Swedish, everyday restaurant questions).
RAFFAELLO_FAQ = (
    {
        'question': 'Behöver jag boka bord?',
        'answer': (
            'Det är rekommenderat att boka bord, särskilt under kvällar och helger. '
            'Du kan skicka en bokningsförfrågan via vår bokningssida.'
        ),
        'order': 10,
    },
    {
        'question': 'Kan jag boka bord online?',
        'answer': (
            'Ja. Du kan skicka en bokningsförfrågan direkt via vår bokningssida. '
            'Din förfrågan får ett referensnummer så att den kan följas upp.'
        ),
        'order': 20,
    },
    {
        'question': 'Kan jag komma utan bokning?',
        'answer': (
            'Ja, du är välkommen att komma förbi. '
            'Bordsbokning rekommenderas dock när det är mycket gäster.'
        ),
        'order': 30,
    },
    {
        'question': 'Har ni lunch?',
        'answer': (
            'Ja. Veckans lunchmeny publiceras på vår lunchsida och uppdateras löpande.'
        ),
        'order': 40,
    },
    {
        'question': 'Vilka tider serverar ni lunch?',
        'answer': (
            'Aktuella lunchtider och dagens lunch hittar du på vår lunchsida.'
        ),
        'order': 50,
    },
    {
        'question': 'Kan jag boka för ett större sällskap eller privat event?',
        'answer': (
            'Ja. För större sällskap och privata event kan du skicka en förfrågan '
            'via sidan för privata event.'
        ),
        'order': 60,
    },
    {
        'question': 'Kan jag få information om allergener?',
        'answer': (
            'Information om allergener finns på menyn när den är angiven för den '
            'aktuella maträtten. Fråga gärna personalen om du behöver hjälp.'
        ),
        'order': 70,
    },
    {
        'question': 'Kan jag ändra eller avboka min bokningsförfrågan?',
        'answer': (
            'Kontakta restaurangen så hjälper vi dig med din bokningsförfrågan.'
        ),
        'order': 80,
    },
)


class Command(BaseCommand):
    help = 'Seed and publish the authorized Raffaello everyday FAQ set (idempotent).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print actions without writing to the database.',
        )

    def handle(self, *args, **options):
        dry = options['dry_run']
        created = updated = unchanged = 0
        for row in RAFFAELLO_FAQ:
            existing = FaqItem.objects.filter(question=row['question']).first()
            if existing is None:
                created += 1
                self.stdout.write(f'CREATE: {row["question"]}')
                if not dry:
                    FaqItem.objects.create(
                        question=row['question'],
                        answer=row['answer'],
                        order=row['order'],
                        is_published=True,
                    )
                continue
            needs = (
                existing.answer != row['answer']
                or existing.order != row['order']
                or not existing.is_published
            )
            if needs:
                updated += 1
                self.stdout.write(f'UPDATE: {row["question"]}')
                if not dry:
                    existing.answer = row['answer']
                    existing.order = row['order']
                    existing.is_published = True
                    existing.save(
                        update_fields=['answer', 'order', 'is_published', 'updated_at']
                    )
            else:
                unchanged += 1
                self.stdout.write(f'OK: {row["question"]}')

        published = FaqItem.objects.filter(is_published=True).count()
        self.stdout.write(
            self.style.SUCCESS(
                f'Done. created={created} updated={updated} unchanged={unchanged} '
                f'published_total={published} dry_run={dry}'
            )
        )
