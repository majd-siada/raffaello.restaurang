"""One-way Telegram notify: restaurant receives booking alerts only.

Guests never get Telegram messages — only TELEGRAM_CHAT_ID does.
"""

from __future__ import annotations

import json
import logging
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

logger = logging.getLogger(__name__)


def format_booking_message(booking) -> str:
    date_str = booking.date.strftime('%Y-%m-%d')
    time_str = booking.time.strftime('%H:%M')
    lines = [
        'Ny bokning — Raffaello',
        f'{booking.first_name} {booking.last_name}',
        f'Tel: {booking.phone}',
        f'E-post: {booking.email}',
        f'{date_str} kl {time_str}',
        f'{booking.guests} pers',
    ]
    if (booking.message or '').strip():
        lines.append(f'Meddelande: {booking.message.strip()}')
    return '\n'.join(lines)


def send_booking_telegram(booking) -> bool:
    """
    Send booking details to the restaurant Telegram chat via Bot API.
    Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in settings/env.
    """
    token = (getattr(settings, 'TELEGRAM_BOT_TOKEN', None) or '').strip()
    chat_id = (getattr(settings, 'TELEGRAM_CHAT_ID', None) or '').strip()

    if not token or not chat_id:
        logger.warning(
            'Telegram booking notify skipped: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID'
        )
        return False

    url = f'https://api.telegram.org/bot{token}/sendMessage'
    payload = {
        'chat_id': chat_id,
        'text': format_booking_message(booking),
        'disable_web_page_preview': True,
    }
    data = json.dumps(payload).encode('utf-8')
    req = Request(
        url,
        data=data,
        method='POST',
        headers={
            'Content-Type': 'application/json',
            'User-Agent': 'raffaello-bookings/1.0',
        },
    )

    try:
        with urlopen(req, timeout=20) as resp:
            body = resp.read().decode('utf-8', errors='replace')
            parsed = json.loads(body) if body else {}
            if resp.status >= 400 or not parsed.get('ok'):
                logger.error('Telegram sendMessage failed: %s', body[:500])
                return False
            logger.info('Telegram booking notify sent for booking %s', booking.pk)
            return True
    except HTTPError as exc:
        err_body = exc.read().decode('utf-8', errors='replace') if exc.fp else ''
        logger.error('Telegram HTTPError %s: %s', exc.code, err_body[:500])
        return False
    except (URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        logger.exception('Telegram notify failed for booking %s: %s', booking.pk, exc)
        return False


def send_booking_whatsapp(booking) -> bool:
    """
    Backwards-compatible name used by views: notify via Telegram.
    (WhatsApp Business can be re-enabled later if needed.)
    """
    return send_booking_telegram(booking)
