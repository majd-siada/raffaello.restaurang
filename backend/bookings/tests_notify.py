"""Unit tests for restaurant notify (Telegram + optional Mailjet email)."""

from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from bookings.notify import notify_restaurant
from bookings.notify_email import email_notify_configured, send_notify_email


class EmailNotifyConfigTests(SimpleTestCase):
    @override_settings(
        MAILJET_API_KEY='',
        MAILJET_API_SECRET='',
        NOTIFY_EMAIL_TO='',
        NOTIFY_EMAIL_FROM='',
    )
    def test_not_configured_when_empty(self):
        self.assertFalse(email_notify_configured())

    @override_settings(
        MAILJET_API_KEY='key',
        MAILJET_API_SECRET='secret',
        NOTIFY_EMAIL_TO='info@example.com',
        NOTIFY_EMAIL_FROM='from@example.com',
    )
    def test_configured_when_all_set(self):
        self.assertTrue(email_notify_configured())


class NotifyRestaurantTests(SimpleTestCase):
    @override_settings(
        MAILJET_API_KEY='',
        MAILJET_API_SECRET='',
        NOTIFY_EMAIL_TO='',
        NOTIFY_EMAIL_FROM='',
    )
    @patch('bookings.notify.send_telegram_text', return_value=True)
    @patch('bookings.notify.send_notify_email')
    def test_telegram_only_when_email_not_configured(self, mock_email, _mock_tg):
        self.assertTrue(notify_restaurant(text='hello', subject='Subj'))
        mock_email.assert_not_called()

    @override_settings(
        MAILJET_API_KEY='key',
        MAILJET_API_SECRET='secret',
        NOTIFY_EMAIL_TO='info@example.com',
        NOTIFY_EMAIL_FROM='from@example.com',
    )
    @patch('bookings.notify.send_telegram_text', return_value=True)
    @patch('bookings.notify.send_notify_email', return_value=True)
    def test_both_channels_when_email_configured(self, mock_email, mock_tg):
        self.assertTrue(notify_restaurant(text='hello', subject='Subj'))
        mock_tg.assert_called_once_with('hello')
        mock_email.assert_called_once_with(subject='Subj', text='hello')

    @override_settings(
        MAILJET_API_KEY='key',
        MAILJET_API_SECRET='secret',
        NOTIFY_EMAIL_TO='info@example.com',
        NOTIFY_EMAIL_FROM='from@example.com',
    )
    @patch('bookings.notify.send_telegram_text', return_value=True)
    @patch('bookings.notify.send_notify_email', return_value=False)
    def test_fails_when_email_fails(self, _mock_email, _mock_tg):
        self.assertFalse(notify_restaurant(text='hello', subject='Subj'))

    @override_settings(
        MAILJET_API_KEY='key',
        MAILJET_API_SECRET='secret',
        NOTIFY_EMAIL_TO='info@example.com',
        NOTIFY_EMAIL_FROM='from@example.com',
    )
    @patch('bookings.notify.send_telegram_text', return_value=False)
    @patch('bookings.notify.send_notify_email')
    def test_skips_email_when_telegram_fails(self, mock_email, _mock_tg):
        self.assertFalse(notify_restaurant(text='hello', subject='Subj'))
        mock_email.assert_not_called()


class SendNotifyEmailTests(SimpleTestCase):
    @override_settings(
        MAILJET_API_KEY='key',
        MAILJET_API_SECRET='secret',
        NOTIFY_EMAIL_TO='info@example.com',
        NOTIFY_EMAIL_FROM='from@example.com',
        NOTIFY_EMAIL_FROM_NAME='Raffaello',
    )
    @patch('bookings.notify_email.urlopen')
    def test_mailjet_success(self, mock_urlopen):
        class _Resp:
            status = 200

            def read(self):
                return b'{"Messages":[{"Status":"success"}]}'

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        mock_urlopen.return_value = _Resp()
        self.assertTrue(send_notify_email(subject='S', text='Body'))
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.full_url, 'https://api.mailjet.com/v3.1/send')
        self.assertIn('Authorization', req.headers)
