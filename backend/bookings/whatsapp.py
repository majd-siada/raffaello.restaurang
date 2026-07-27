"""One-way WhatsApp Business Cloud API: notify the restaurant about new bookings.

Guests never receive WhatsApp — only BOOKING_NOTIFY_PHONE gets a message.
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


def _template_parameters(booking) -> list[dict]:
    date_str = booking.date.strftime('%Y-%m-%d')
    time_str = booking.time.strftime('%H:%M')
    msg = (booking.message or '').strip() or '—'
    values = [
        f'{booking.first_name} {booking.last_name}',
        booking.phone,
        booking.email,
        f'{date_str} kl {time_str}',
        str(booking.guests),
        msg[:500],
    ]
    return [{'type': 'text', 'text': v} for v in values]


def _post_graph(payload: dict) -> bool:
    token = (getattr(settings, 'WHATSAPP_TOKEN', None) or '').strip()
    phone_id = (getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', None) or '').strip()
    version = (getattr(settings, 'WHATSAPP_API_VERSION', None) or 'v21.0').strip()

    if not token or not phone_id:
        logger.warning(
            'WhatsApp skipped: set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID'
        )
        return False

    url = f'https://graph.facebook.com/{version}/{phone_id}/messages'
    data = json.dumps(payload).encode('utf-8')
    req = Request(
        url,
        data=data,
        method='POST',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'User-Agent': 'raffaello-bookings/1.0',
        },
    )
    try:
        with urlopen(req, timeout=25) as resp:
            body = resp.read().decode('utf-8', errors='replace')
            if resp.status >= 400:
                logger.error('WhatsApp Cloud API HTTP %s: %s', resp.status, body[:500])
                return False
            logger.info('WhatsApp Cloud API OK: %s', body[:200])
            return True
    except HTTPError as exc:
        err_body = exc.read().decode('utf-8', errors='replace') if exc.fp else ''
        logger.error('WhatsApp Cloud API HTTPError %s: %s', exc.code, err_body[:500])
        return False
    except (URLError, TimeoutError, OSError) as exc:
        logger.exception('WhatsApp Cloud API failed: %s', exc)
        return False


def send_booking_whatsapp(booking) -> bool:
    """
    Notify restaurant owner only (no chat with the guest).

    Uses Meta WhatsApp Cloud API:
    - Prefer an approved template (required for reliable delivery to your phone).
    - Optional text mode for Meta sandbox / 24h window testing.
    """
    to = (getattr(settings, 'BOOKING_NOTIFY_PHONE', None) or '').strip()
    if not to:
        logger.warning('WhatsApp skipped: BOOKING_NOTIFY_PHONE is empty')
        return False

    # Digits only for Graph API "to" field
    to_digits = ''.join(c for c in to if c.isdigit())

    mode = (getattr(settings, 'WHATSAPP_MESSAGE_MODE', None) or 'template').strip().lower()
    template_name = (getattr(settings, 'WHATSAPP_TEMPLATE_NAME', None) or '').strip()
    template_lang = (getattr(settings, 'WHATSAPP_TEMPLATE_LANG', None) or 'sv').strip()

    if mode == 'text':
        payload = {
            'messaging_product': 'whatsapp',
            'to': to_digits,
            'type': 'text',
            'text': {'preview_url': False, 'body': format_booking_message(booking)},
        }
        return _post_graph(payload)

    if not template_name:
        logger.warning(
            'WhatsApp skipped: set WHATSAPP_TEMPLATE_NAME (or WHATSAPP_MESSAGE_MODE=text for tests)'
        )
        return False

    payload = {
        'messaging_product': 'whatsapp',
        'to': to_digits,
        'type': 'template',
        'template': {
            'name': template_name,
            'language': {'code': template_lang},
            'components': [
                {
                    'type': 'body',
                    'parameters': _template_parameters(booking),
                }
            ],
        },
    }
    return _post_graph(payload)
