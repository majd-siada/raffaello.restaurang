"""Shared booking create + notify path (Telegram + optional email)."""

from __future__ import annotations

import logging

from .models import Booking
from .notify import notify_booking

logger = logging.getLogger(__name__)

BOOKING_NOTIFY_FAILED = 'booking_notify_failed'

TECHNICAL_ERROR_DETAIL = (
    'Oj! Det verkar som att vi har ett tillfälligt tekniskt problem med '
    'bokningsaviseringen. Vi jobbar på att lösa det så snart som möjligt. '
    'Vill du boka direkt? Ring restaurangen, så hjälper vi dig!'
)


def create_booking_with_notify(validated_data: dict, *, is_test: bool = False):
    """
    Create a booking and notify the restaurant (Telegram + optional email).

    On notify success: returns (booking, None) with whatsapp_sent=True.
    On notify failure: deletes the booking and returns (None, BOOKING_NOTIFY_FAILED).
    """
    create_kwargs = {**validated_data, 'is_test': is_test}
    booking = Booking.objects.create(**create_kwargs)
    sent = notify_booking(booking)
    if not sent:
        logger.error(
            'Booking %s notify failed; rolling back booking (is_test=%s)',
            booking.pk,
            is_test,
        )
        booking.delete()
        return None, BOOKING_NOTIFY_FAILED

    booking.whatsapp_sent = True
    booking.save(update_fields=['whatsapp_sent'])
    return booking, None
