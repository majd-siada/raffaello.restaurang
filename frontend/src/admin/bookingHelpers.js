/**
 * Bookings / Events Admin contracts (aligned with staff serializers).
 * Staff APIs are ReadOnlyModelViewSet — no client-side inventing of writes or status.
 */

/** Fields returned by OpsBookingSerializer / staff GET */
export const BOOKING_STAFF_FIELDS = [
  'id',
  'first_name',
  'last_name',
  'phone',
  'email',
  'date',
  'time',
  'guests',
  'message',
  'whatsapp_sent',
  'is_test',
  'created_at',
]

/** PII visible only to staff with bookings.view_booking */
export const BOOKING_PII_FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'email',
  'message',
]

/** No Booking.status in Django — do not render fake status chips */
export const BOOKING_STATUS_FIELD_EXISTS = false

/** Staff mutate API (PATCH/PUT/DELETE) — not exposed on ViewSet */
export const BOOKING_STAFF_WRITE_API = false
export const BOOKING_STAFF_DELETE_API = false

/** Legacy DB column name; transport is Telegram */
export const BOOKING_NOTIFY_FIELD = 'whatsapp_sent'
export const BOOKING_NOTIFY_LABEL = 'Telegram-notifiering skickad'

export const EVENT_STAFF_FIELDS = [
  'id',
  'first_name',
  'last_name',
  'phone',
  'email',
  'preferred_date',
  'guests',
  'occasion',
  'message',
  'notify_sent',
  'created_at',
]

export const EVENT_PII_FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'email',
  'message',
  'occasion',
]

export const EVENT_STATUS_FIELD_EXISTS = false
export const EVENT_STAFF_WRITE_API = false
export const EVENT_STAFF_DELETE_API = false

/** Capacities remain FE-gated; Admin must not invent editable capacity CMS */
export const EVENT_CAPACITY_EDITABLE = false
