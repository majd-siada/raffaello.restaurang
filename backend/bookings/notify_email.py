"""One-way email notify to the restaurant (Mailjet), alongside Telegram.

Guests are never emailed by this module — only NOTIFY_EMAIL_TO receives alerts.
Requires MAILJET_API_KEY + MAILJET_API_SECRET when email notify is enabled.
"""

from __future__ import annotations

import base64
import json
import logging
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

logger = logging.getLogger(__name__)

MAILJET_SEND_URL = 'https://api.mailjet.com/v3.1/send'


def email_notify_configured() -> bool:
    key = (getattr(settings, 'MAILJET_API_KEY', None) or '').strip()
    secret = (getattr(settings, 'MAILJET_API_SECRET', None) or '').strip()
    to_addr = (getattr(settings, 'NOTIFY_EMAIL_TO', None) or '').strip()
    from_addr = (getattr(settings, 'NOTIFY_EMAIL_FROM', None) or '').strip()
    return bool(key and secret and to_addr and from_addr)


def send_notify_email(*, subject: str, text: str) -> bool:
    """Send plain-text restaurant alert via Mailjet. Returns True on success."""
    if not email_notify_configured():
        logger.warning(
            'Email notify skipped: set MAILJET_API_KEY, MAILJET_API_SECRET, '
            'NOTIFY_EMAIL_TO, and NOTIFY_EMAIL_FROM'
        )
        return False

    api_key = settings.MAILJET_API_KEY.strip()
    api_secret = settings.MAILJET_API_SECRET.strip()
    to_addr = settings.NOTIFY_EMAIL_TO.strip()
    from_addr = settings.NOTIFY_EMAIL_FROM.strip()
    from_name = (getattr(settings, 'NOTIFY_EMAIL_FROM_NAME', None) or 'Raffaello').strip()

    auth = base64.b64encode(f'{api_key}:{api_secret}'.encode('utf-8')).decode('ascii')
    payload = {
        'Messages': [
            {
                'From': {'Email': from_addr, 'Name': from_name},
                'To': [{'Email': to_addr}],
                'Subject': subject,
                'TextPart': text,
            }
        ]
    }
    data = json.dumps(payload).encode('utf-8')
    req = Request(
        MAILJET_SEND_URL,
        data=data,
        method='POST',
        headers={
            'Authorization': f'Basic {auth}',
            'Content-Type': 'application/json',
            'User-Agent': 'raffaello-bookings/1.0',
        },
    )

    try:
        with urlopen(req, timeout=20) as resp:
            body = resp.read().decode('utf-8', errors='replace')
            if resp.status >= 400:
                logger.error('Mailjet send failed HTTP %s: %s', resp.status, body[:500])
                return False
            parsed = json.loads(body) if body else {}
            # Mailjet v3.1 returns Messages[].Status == "success"
            messages = parsed.get('Messages') or []
            if not messages:
                logger.error('Mailjet send returned no Messages: %s', body[:500])
                return False
            statuses = [m.get('Status') for m in messages]
            if any(s != 'success' for s in statuses):
                logger.error('Mailjet send status not success: %s', body[:500])
                return False
            return True
    except HTTPError as exc:
        err_body = exc.read().decode('utf-8', errors='replace') if exc.fp else ''
        logger.error('Mailjet HTTPError %s: %s', exc.code, err_body[:500])
        return False
    except (URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        logger.exception('Mailjet notify failed: %s', exc)
        return False
