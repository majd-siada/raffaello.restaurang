"""Booking alerts via Resend (restaurant inbox). Server-side only."""

from __future__ import annotations

import json
import logging
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

logger = logging.getLogger(__name__)


def format_booking_email_subject(booking) -> str:
    date_str = booking.date.strftime('%Y-%m-%d')
    time_str = booking.time.strftime('%H:%M')
    return f'New Booking – Raffaello – {date_str} {time_str}'


def format_booking_email_body(booking) -> str:
    date_str = booking.date.strftime('%Y-%m-%d')
    time_str = booking.time.strftime('%H:%M')
    restaurant = (
        getattr(settings, 'BOOKING_RESTAURANT_NAME', None) or ''
    ).strip() or 'Raffaello Restaurang, Drottninggatan 18, 961 35 Boden'
    message = (booking.message or '').strip()
    lines = [
        'New booking — Raffaello',
        '',
        f'Booking ID: {booking.pk}',
        f'Customer name: {booking.first_name} {booking.last_name}',
        f'Phone number: {booking.phone}',
        f'Customer email: {booking.email}',
        f'Booking date: {date_str}',
        f'Booking time: {time_str}',
        f'Number of guests: {booking.guests}',
        f'Restaurant/location: {restaurant}',
    ]
    if message:
        lines.append(f'Special requests / notes: {message}')
    return '\n'.join(lines)


def send_booking_email(booking) -> bool:
    """
    Send booking details to the restaurant notify address via Resend.
    Requires RESEND_API_KEY, BOOKING_NOTIFY_EMAIL, and EMAIL_FROM in settings/env.
    Failures are logged; callers must not fail the booking on False.
    """
    api_key = (getattr(settings, 'RESEND_API_KEY', None) or '').strip()
    to_email = (getattr(settings, 'BOOKING_NOTIFY_EMAIL', None) or '').strip()
    from_email = (getattr(settings, 'EMAIL_FROM', None) or '').strip()

    if not api_key or not to_email or not from_email:
        logger.warning(
            'Email booking notify skipped for booking %s: '
            'set RESEND_API_KEY, BOOKING_NOTIFY_EMAIL, and EMAIL_FROM',
            booking.pk,
        )
        return False

    payload = {
        'from': from_email,
        'to': [to_email],
        'subject': format_booking_email_subject(booking),
        'text': format_booking_email_body(booking),
    }
    data = json.dumps(payload).encode('utf-8')
    req = Request(
        'https://api.resend.com/emails',
        data=data,
        method='POST',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'raffaello-bookings/1.0',
        },
    )

    try:
        with urlopen(req, timeout=20) as resp:
            body = resp.read().decode('utf-8', errors='replace')
            if resp.status >= 400:
                logger.error(
                    'Resend email failed for booking %s: HTTP %s %s',
                    booking.pk,
                    resp.status,
                    body[:500],
                )
                return False
            logger.info('Email booking notify sent for booking %s', booking.pk)
            return True
    except HTTPError as exc:
        err_body = exc.read().decode('utf-8', errors='replace') if exc.fp else ''
        logger.error(
            'Resend HTTPError for booking %s: %s %s',
            booking.pk,
            exc.code,
            err_body[:500],
        )
        return False
    except (URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        logger.exception(
            'Email notify failed for booking %s: %s',
            booking.pk,
            exc,
        )
        return False
