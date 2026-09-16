"""Event inquiry create + Telegram notify (fail-closed)."""

from __future__ import annotations

import logging

from bookings.whatsapp import send_telegram_text

from .models import EventInquiry

logger = logging.getLogger(__name__)

EVENT_NOTIFY_FAILED = 'event_notify_failed'

TECHNICAL_ERROR_DETAIL = (
    'Oj! Det verkar som att vi har ett tillfälligt tekniskt problem med '
    'aviseringen. Ring restaurangen så hjälper vi dig med eventförfrågan.'
)


def format_event_message(inquiry: EventInquiry) -> str:
    lines = [
        'Eventförfrågan — Raffaello',
        f'{inquiry.first_name} {inquiry.last_name}',
        f'Tel: {inquiry.phone}',
        f'E-post: {inquiry.email}',
    ]
    if inquiry.preferred_date:
        lines.append(f'Önskat datum: {inquiry.preferred_date.isoformat()}')
    if inquiry.guests:
        lines.append(f'Gäster (ca): {inquiry.guests}')
    if (inquiry.occasion or '').strip():
        lines.append(f'Tillställning: {inquiry.occasion.strip()}')
    if (inquiry.message or '').strip():
        lines.append(f'Meddelande: {inquiry.message.strip()}')
    lines.append(f'Referens: {inquiry.pk}')
    return '\n'.join(lines)


def create_event_inquiry_with_notify(validated_data: dict):
    inquiry = EventInquiry.objects.create(**validated_data)
    sent = send_telegram_text(format_event_message(inquiry))
    if not sent:
        logger.error('Event inquiry %s notify failed; rolling back', inquiry.pk)
        inquiry.delete()
        return None, EVENT_NOTIFY_FAILED

    inquiry.notify_sent = True
    inquiry.save(update_fields=['notify_sent'])
    return inquiry, None
