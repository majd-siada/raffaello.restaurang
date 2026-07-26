import logging
from urllib.parse import quote
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

from django.conf import settings

logger = logging.getLogger(__name__)


def format_booking_message(booking):
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
    if booking.message.strip():
        lines.append(f'Meddelande: {booking.message.strip()}')
    return '\n'.join(lines)


def send_booking_whatsapp(booking) -> bool:
    """
    Notify owner via CallMeBot free WhatsApp API.
    Returns True if the request appears successful.
    """
    api_key = (getattr(settings, 'CALLMEBOT_APIKEY', None) or '').strip()
    phone = (getattr(settings, 'BOOKING_NOTIFY_PHONE', None) or '').strip()

    if not api_key or not phone:
        logger.warning(
            'WhatsApp booking notify skipped: CALLMEBOT_APIKEY or '
            'BOOKING_NOTIFY_PHONE not configured'
        )
        return False

    text = format_booking_message(booking)
    url = (
        'https://api.callmebot.com/whatsapp.php'
        f'?phone={quote(phone)}'
        f'&text={quote(text)}'
        f'&apikey={quote(api_key)}'
    )

    try:
        req = Request(url, method='GET', headers={'User-Agent': 'raffaello-bookings/1.0'})
        with urlopen(req, timeout=20) as resp:
            body = resp.read().decode('utf-8', errors='replace')
            if resp.status >= 400:
                logger.error('CallMeBot HTTP %s: %s', resp.status, body[:300])
                return False
            logger.info('CallMeBot WhatsApp sent for booking %s', booking.pk)
            return True
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        logger.exception('CallMeBot WhatsApp failed for booking %s: %s', booking.pk, exc)
        return False
