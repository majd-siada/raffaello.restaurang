"""Restaurant notify: Telegram (required) + optional Mailjet email."""

from __future__ import annotations

import logging

from .notify_email import email_notify_configured, send_notify_email
from .whatsapp import format_booking_message, send_telegram_text

logger = logging.getLogger(__name__)


def notify_restaurant(*, text: str, subject: str) -> bool:
    """
    Send alert to the restaurant.

    Telegram is always required.
    When Mailjet email is configured, email is also required (fail-closed).
    """
    tg_ok = send_telegram_text(text)
    if not tg_ok:
        return False

    if not email_notify_configured():
        return True

    email_ok = send_notify_email(subject=subject, text=text)
    if not email_ok:
        logger.error('Restaurant email notify failed after Telegram succeeded')
        return False
    return True


def notify_booking(booking) -> bool:
    subject = (
        'TESTBOKNING — Raffaello'
        if getattr(booking, 'is_test', False)
        else 'Ny bokning — Raffaello'
    )
    return notify_restaurant(text=format_booking_message(booking), subject=subject)
