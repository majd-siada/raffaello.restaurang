import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  ADMIN_NAV_ITEMS,
  ADMIN_NAV_GROUPS,
  ADMIN_OVERVIEW_ITEM,
  ADMIN_ROUTE_PATHS,
  adminPathsUnderAdmin,
  getAdminNavItem,
  getAdminNavGroupId,
} from './adminNav.js'
import { ADMIN_API_BASE } from './api.js'
import { OPS_API_BASE } from '../ops/api.js'
import { OPS_ROUTE_PATHS } from '../ops/opsNav.js'
import { normalizePriceInput, MENU_ITEM_WRITABLE_FIELDS } from './menuHelpers.js'
import {
  classifySyncResult,
  LUNCH_DISH_WRITE_API,
  LUNCH_IMPORT_STATUSES,
  LUNCH_WEEK_WRITABLE_FIELDS,
} from './lunchHelpers.js'
import {
  OFFER_DISH_WRITABLE,
  OFFER_IMAGE_SUPPORTED,
  OFFER_WEEK_WRITABLE,
  publishLabel,
} from './offerHelpers.js'
import {
  BOOKING_PII_FIELDS,
  BOOKING_STAFF_DELETE_API,
  BOOKING_STAFF_WRITE_API,
  BOOKING_STATUS_FIELD_EXISTS,
  EVENT_CAPACITY_EDITABLE,
  EVENT_PII_FIELDS,
} from './bookingHelpers.js'
import {
  GALLERY_DELETE_SUPPORTED,
  GALLERY_UPLOAD_DEFAULT_PUBLISHED,
  MAX_PUBLISHED,
  REVIEW_DELETE_SUPPORTED,
  REVIEW_SOURCE_CHOICES,
  publishLabel as galleryPublishLabel,
} from './galleryHelpers.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

describe('admin Restaurant read-only page', () => {
  it('AdminApp wires RestaurantPage for /admin/restaurang', () => {
    const app = readFileSync(join(root, 'src/admin/AdminApp.jsx'), 'utf8')
    assert.match(app, /AdminRestaurantPage/)
    assert.match(app, /path="restaurang"/)
    assert.doesNotMatch(app, /soon\('Restaurang'/)
  })

  it('RestaurantPage uses Admin restaurant API and stays read-only', () => {
    const page = readFileSync(join(root, 'src/admin/RestaurantPage.jsx'), 'utf8')
    assert.match(page, /adminFetch\('\/restaurant\/'\)/)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
    assert.match(page, /ForbiddenState/)
    assert.match(page, /ErrorState/)
    assert.match(page, /LoadingState/)
    assert.match(page, /Endast visning/)
    assert.match(page, /siteConfig/)
    assert.doesNotMatch(page, /method:\s*['"]PUT|method:\s*['"]PATCH|method:\s*['"]POST|method:\s*['"]DELETE/)
    assert.doesNotMatch(page, /Spara|Redigera|Uppdatera spar|Ta bort/)
    assert.match(page, /max_guests_online/)
    assert.match(page, /schedule/)
    assert.match(page, /Uppdatera/)
  })

  it('getAdminNavItem highlights Restaurang for /admin/restaurang', () => {
    assert.equal(getAdminNavItem('/admin/restaurang')?.to, '/admin/restaurang')
    assert.equal(getAdminNavGroupId('/admin/restaurang'), 'restaurang')
  })
})

describe('admin operational Overview', () => {
  it('OverviewPage loads /overview and shows today bookings without status chips', () => {
    const page = readFileSync(join(root, 'src/admin/OverviewPage.jsx'), 'utf8')
    assert.match(page, /adminFetch\('\/overview\/'\)/)
    assert.match(page, /today_bookings/)
    assert.match(page, /Dagens bokningar/)
    assert.match(page, /Bokningsförfrågningar/)
    assert.doesNotMatch(page, /confirmed|pending|cancelled|Bekräftad/)
    assert.match(page, /Inget erbjudande publicerat ännu/)
    assert.match(page, /Snabbåtgärder/)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
  })
})

describe('admin Phase A navigation contract', () => {
  it('admin routes all live under /admin', () => {
    assert.ok(ADMIN_ROUTE_PATHS.includes('/admin'))
    assert.ok(ADMIN_ROUTE_PATHS.includes('/admin/login'))
    assert.ok(adminPathsUnderAdmin())
    assert.ok(ADMIN_NAV_ITEMS.every((item) => item.to.startsWith('/admin')))
  })

  it('includes required Phase A nav labels including Öppettider', () => {
    const labels = ADMIN_NAV_ITEMS.map((i) => i.label)
    for (const required of [
      'Översikt',
      'Meny',
      'Lunch',
      'Veckans Erbjudande',
      'Bokningar',
      'Privata Event',
      'Galleri',
      'Recensioner',
      'Restaurang',
      'Öppettider',
      'FAQ',
      'Legal',
      'System',
    ]) {
      assert.ok(labels.includes(required), `missing ${required}`)
    }
  })

  it('uses four nav groups with Overview above groups', () => {
    assert.equal(ADMIN_OVERVIEW_ITEM.to, '/admin')
    assert.equal(ADMIN_OVERVIEW_ITEM.label, 'Översikt')
    assert.equal(ADMIN_NAV_ITEMS[0], ADMIN_OVERVIEW_ITEM)
    assert.deepEqual(
      ADMIN_NAV_GROUPS.map((g) => g.id),
      ['innehall', 'bokning', 'restaurang', 'system'],
    )
    assert.deepEqual(
      ADMIN_NAV_GROUPS.map((g) => g.label),
      ['Innehåll', 'Bokning', 'Restaurang', 'System'],
    )
    const groupedPaths = ADMIN_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.to))
    const flatPaths = ADMIN_NAV_ITEMS.filter((i) => i.to !== '/admin').map((i) => i.to)
    assert.deepEqual(groupedPaths, flatPaths)
  })

  it('places content, booking, restaurant, system items in expected groups', () => {
    const byId = Object.fromEntries(ADMIN_NAV_GROUPS.map((g) => [g.id, g.items.map((i) => i.to)]))
    assert.deepEqual(byId.innehall, [
      '/admin/meny',
      '/admin/lunch',
      '/admin/erbjudande',
      '/admin/galleri',
      '/admin/recensioner',
      '/admin/faq',
      '/admin/legal',
    ])
    assert.deepEqual(byId.bokning, ['/admin/bokningar', '/admin/event'])
    assert.deepEqual(byId.restaurang, ['/admin/oppettider', '/admin/restaurang'])
    assert.deepEqual(byId.system, ['/admin/system'])
  })

  it('resolves nested booking/event paths to parent nav items', () => {
    assert.equal(getAdminNavItem('/admin')?.label, 'Översikt')
    assert.equal(getAdminNavItem('/admin/bokningar/42')?.to, '/admin/bokningar')
    assert.equal(getAdminNavItem('/admin/event/7')?.to, '/admin/event')
    assert.equal(getAdminNavGroupId('/admin/meny'), 'innehall')
    assert.equal(getAdminNavGroupId('/admin/bokningar/1'), 'bokning')
    assert.equal(getAdminNavGroupId('/admin'), null)
  })

  it('AdminShell renders grouped navigation from ADMIN_NAV_GROUPS', () => {
    const shell = readFileSync(join(root, 'src/admin/AdminShell.jsx'), 'utf8')
    assert.match(shell, /ADMIN_NAV_GROUPS/)
    assert.match(shell, /ADMIN_OVERVIEW_ITEM/)
    assert.match(shell, /role="group"/)
    assert.match(shell, /aria-labelledby/)
    assert.match(shell, /overflow-x-auto/)
    assert.match(shell, /Raffaello Admin/)
    assert.match(shell, /getAdminNavItem/)
    assert.match(shell, /Logga ut/)
  })

  it('AdminShell uses top horizontal chrome not sidebar layout', () => {
    const shell = readFileSync(join(root, 'src/admin/AdminShell.jsx'), 'utf8')
    assert.match(shell, /admin-app/)
    assert.match(shell, /backdrop-blur/)
    assert.doesNotMatch(shell, /w-60/)
    assert.doesNotMatch(shell, /<aside/)
  })

  it('marks all nav modules ready (no ComingSoon placeholders)', () => {
    const overview = ADMIN_NAV_ITEMS.find((i) => i.to === '/admin')
    const faq = ADMIN_NAV_ITEMS.find((i) => i.to === '/admin/faq')
    const legal = ADMIN_NAV_ITEMS.find((i) => i.to === '/admin/legal')
    const system = ADMIN_NAV_ITEMS.find((i) => i.to === '/admin/system')
    const restaurant = ADMIN_NAV_ITEMS.find((i) => i.to === '/admin/restaurang')
    assert.equal(overview?.ready, true)
    assert.equal(faq?.ready, true)
    assert.equal(legal?.ready, true)
    assert.equal(system?.ready, true)
    assert.equal(restaurant?.ready, true)
    assert.equal(ADMIN_NAV_ITEMS.filter((i) => !i.ready).length, 0)
  })

  it('App mounts AdminApp for /admin and OpsApp for /ops', () => {
    const app = readFileSync(join(root, 'src/App.jsx'), 'utf8')
    assert.match(app, /pathname\.startsWith\('\/admin'\)/)
    assert.match(app, /pathname\.startsWith\('\/ops'\)/)
    assert.match(app, /AdminApp/)
    assert.match(app, /OpsApp/)
    assert.doesNotMatch(app, /AdminRedirect/)
  })

  it('ops compatibility paths unchanged', () => {
    assert.ok(OPS_ROUTE_PATHS.every((p) => p.startsWith('/ops')))
    assert.equal(OPS_API_BASE, '/api/ops')
    assert.equal(ADMIN_API_BASE, '/api/admin')
    assert.notEqual(ADMIN_API_BASE, OPS_API_BASE)
  })

  it('vite proxies django-admin not React /admin', () => {
    const vite = readFileSync(join(root, 'vite.config.js'), 'utf8')
    assert.match(vite, /['"]\/django-admin['"]/)
    assert.doesNotMatch(vite, /['"]\/admin['"]\s*:/)
  })

  it('AdminApp wires MenuPage for /admin/meny', () => {
    const app = readFileSync(join(root, 'src/admin/AdminApp.jsx'), 'utf8')
    assert.match(app, /AdminMenuPage/)
    assert.match(app, /path="meny"/)
    assert.match(app, /path="menu"/)
  })

  it('AdminApp wires LunchPage for /admin/lunch', () => {
    const app = readFileSync(join(root, 'src/admin/AdminApp.jsx'), 'utf8')
    assert.match(app, /AdminLunchPage/)
    assert.match(app, /path="lunch"/)
  })

  it('AdminApp wires OffersPage for /admin/erbjudande', () => {
    const app = readFileSync(join(root, 'src/admin/AdminApp.jsx'), 'utf8')
    assert.match(app, /AdminOffersPage/)
    assert.match(app, /path="erbjudande"/)
  })
})

describe('admin menu Phase B helpers', () => {
  it('normalizePriceInput keeps decimal strings without float drift', () => {
    assert.equal(normalizePriceInput('139'), '139')
    assert.equal(normalizePriceInput('139.50'), '139.50')
    assert.equal(normalizePriceInput('139,50'), '139.50')
    assert.equal(normalizePriceInput('139 kr'), '139')
  })

  it('documents writable fields aligned with OpsMenuItemSerializer', () => {
    for (const f of [
      'category',
      'name',
      'description',
      'price',
      'is_available',
      'order',
      'allergens',
      'tags',
      'image',
      'is_featured',
    ]) {
      assert.ok(MENU_ITEM_WRITABLE_FIELDS.includes(f), f)
    }
  })

  it('MenuPage uses /api/admin not /api/ops', () => {
    const page = readFileSync(join(root, 'src/admin/MenuPage.jsx'), 'utf8')
    assert.match(page, /adminFetch|adminList/)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
  })
})

describe('admin lunch Phase C helpers', () => {
  it('classifySyncResult distinguishes failures from success-ish statuses', () => {
    assert.equal(classifySyncResult({ status: 'FETCH_FAILED' }).kind, 'error')
    assert.equal(classifySyncResult({ status: 'PARSE_FAILED' }).kind, 'error')
    assert.equal(classifySyncResult({ status: 'STALE' }).kind, 'warning')
    assert.equal(classifySyncResult({ status: 'NOT_PUBLISHED' }).kind, 'warning')
    assert.equal(classifySyncResult({ status: 'UNCHANGED' }).treatAsSuccess, true)
    assert.equal(classifySyncResult({ status: 'SKIPPED_OVERRIDE' }).treatAsSuccess, true)
    assert.equal(
      classifySyncResult({ status: 'PUBLISHED', changed: true }).kind,
      'success',
    )
  })

  it('documents week writable fields and dish write gap', () => {
    for (const f of [
      'week_start',
      'intro_text',
      'notes',
      'lunch_hours_text',
      'is_published',
      'skip_auto_sync',
    ]) {
      assert.ok(LUNCH_WEEK_WRITABLE_FIELDS.includes(f), f)
    }
    assert.equal(LUNCH_DISH_WRITE_API, false)
  })

  it('LunchPage uses /api/admin, Sync Now, override, and Escape dialogs', () => {
    const page = readFileSync(join(root, 'src/admin/LunchPage.jsx'), 'utf8')
    assert.match(page, /adminFetch|adminList/)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
    assert.match(page, /\/lunch\/sync\//)
    assert.match(page, /skip_auto_sync/)
    assert.match(page, /MANUAL OVERRIDE/)
    assert.match(page, /OpsDialog/)
    assert.match(page, /aria-live/)
    assert.match(page, /role="alert"|role=\{.*alert/)
  })

  it('uses exact backend import statuses (no invented SUCCESS)', () => {
    assert.ok(LUNCH_IMPORT_STATUSES.includes('PUBLISHED'))
    assert.ok(LUNCH_IMPORT_STATUSES.includes('UNCHANGED'))
    assert.ok(LUNCH_IMPORT_STATUSES.includes('SKIPPED_OVERRIDE'))
    assert.ok(!LUNCH_IMPORT_STATUSES.includes('SUCCESS'))
  })
})

describe('admin offers Phase D helpers', () => {
  it('documents writable week and dish fields', () => {
    for (const f of ['week_start', 'intro_text', 'is_published']) {
      assert.ok(OFFER_WEEK_WRITABLE.includes(f), f)
    }
    for (const f of [
      'offer',
      'name',
      'description',
      'price',
      'is_available',
      'order',
    ]) {
      assert.ok(OFFER_DISH_WRITABLE.includes(f), f)
    }
    assert.equal(OFFER_IMAGE_SUPPORTED, false)
  })

  it('publishLabel uses PUBLICERAD / EJ PUBLICERAD', () => {
    assert.equal(publishLabel(true), 'PUBLICERAD')
    assert.equal(publishLabel(false), 'EJ PUBLICERAD')
  })

  it('OffersPage uses /api/admin offers + offer-dishes, dialogs, no ops', () => {
    const page = readFileSync(join(root, 'src/admin/OffersPage.jsx'), 'utf8')
    assert.match(page, /adminFetch|adminList/)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
    assert.match(page, /\/offers\//)
    assert.match(page, /\/offer-dishes\//)
    assert.match(page, /is_published/)
    assert.match(page, /OpsDialog/)
    assert.match(page, /aria-live/)
    assert.match(page, /Inget aktivt erbjudande/)
  })
})

describe('admin opening hours Phase E', () => {
  it('AdminApp wires OpeningHoursPage for /admin/oppettider', () => {
    const app = readFileSync(join(root, 'src/admin/AdminApp.jsx'), 'utf8')
    assert.match(app, /AdminOpeningHoursPage/)
    assert.match(app, /path="oppettider"/)
  })

  it('OpeningHoursPage uses /api/admin/restaurant/hours and drift UI', () => {
    const page = readFileSync(join(root, 'src/admin/OpeningHoursPage.jsx'), 'utf8')
    assert.match(page, /\/restaurant\/hours\//)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
    assert.match(page, /OPENING_HOURS_SOURCE|source_flag|drift/)
    assert.match(page, /aria-live/)
    assert.match(page, /Stängt/)
  })

  it('openingHours hydrates from public API for JSON-LD parity', () => {
    const oh = readFileSync(join(root, 'src/openingHours.js'), 'utf8')
    assert.match(oh, /hydrateOpeningHoursFromApi/)
    assert.match(oh, /\/api\/restaurant\//)
    const home = readFileSync(join(root, 'src/pages/Home.jsx'), 'utf8')
    assert.match(home, /hydrateOpeningHoursFromApi/)
    assert.match(home, /schemaHours/)
  })

  it('Restaurant JSON-LD includes geo from published SITE map coordinates', () => {
    const site = readFileSync(join(root, 'src/siteConfig.js'), 'utf8')
    assert.match(site, /geo:\s*\{/)
    assert.match(site, /latitude:\s*65\.8226176/)
    assert.match(site, /longitude:\s*21\.6817581/)
    const home = readFileSync(join(root, 'src/pages/Home.jsx'), 'utf8')
    assert.match(home, /GeoCoordinates/)
    assert.match(home, /SITE\.geo\.latitude/)
    assert.match(home, /SITE\.geo\.longitude/)
    assert.doesNotMatch(home, /aggregateRating/)
  })
})

describe('admin bookings + events Phase F', () => {
  it('AdminApp wires BookingsPage and EventsPage with detail routes', () => {
    const app = readFileSync(join(root, 'src/admin/AdminApp.jsx'), 'utf8')
    assert.match(app, /AdminBookingsPage/)
    assert.match(app, /AdminEventsPage/)
    assert.match(app, /path="bokningar"/)
    assert.match(app, /path="bokningar\/:id"/)
    assert.match(app, /path="event"/)
    assert.match(app, /path="event\/:id"/)
    assert.match(app, /privata-events/)
  })

  it('BookingsPage uses /api/admin, ForbiddenState, no fake status, Telegram label', () => {
    const page = readFileSync(join(root, 'src/admin/BookingsPage.jsx'), 'utf8')
    const helpers = readFileSync(join(root, 'src/admin/bookingHelpers.js'), 'utf8')
    assert.match(page, /adminFetch|adminList/)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
    assert.match(page, /ForbiddenState/)
    assert.match(page, /BOOKING_NOTIFY_LABEL/)
    assert.match(helpers, /Telegram-notifiering skickad/)
    assert.match(page, /Telegram/)
    assert.doesNotMatch(page, /WhatsApp skickad/)
    assert.doesNotMatch(page, /StatusChip|statuschip/)
    assert.match(page, /Kunduppgifter/)
    assert.match(page, /break-all/)
  })

  it('EventsPage is read-only and honest about capacities', () => {
    const page = readFileSync(join(root, 'src/admin/EventsPage.jsx'), 'utf8')
    assert.match(page, /adminFetch|adminList/)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
    assert.match(page, /ForbiddenState/)
    assert.match(page, /capacitiesConfirmed/)
    assert.match(page, /Telegram-notifiering/)
  })

  it('bookingHelpers document RO API and missing status field', () => {
    assert.equal(BOOKING_STATUS_FIELD_EXISTS, false)
    assert.equal(BOOKING_STAFF_WRITE_API, false)
    assert.equal(BOOKING_STAFF_DELETE_API, false)
    assert.equal(EVENT_CAPACITY_EDITABLE, false)
    assert.ok(BOOKING_PII_FIELDS.includes('email'))
    assert.ok(EVENT_PII_FIELDS.includes('phone'))
  })
})

describe('admin gallery + reviews Phase G', () => {
  it('AdminApp wires GalleryPage and ReviewsPage', () => {
    const app = readFileSync(join(root, 'src/admin/AdminApp.jsx'), 'utf8')
    assert.match(app, /AdminGalleryPage/)
    assert.match(app, /AdminReviewsPage/)
    assert.match(app, /path="galleri"/)
    assert.match(app, /path="recensioner"/)
  })

  it('GalleryPage uses /api/admin, max publish, delete confirm, SITE fallback note', () => {
    const page = readFileSync(join(root, 'src/admin/GalleryPage.jsx'), 'utf8')
    assert.match(page, /adminFetch|adminList/)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
    assert.match(page, /ForbiddenState/)
    assert.match(page, /MAX_PUBLISHED|max/)
    assert.match(page, /SITE\.gallery/)
    assert.match(page, /OpsDialog/)
    assert.match(page, /aria-live/)
    assert.match(page, /formData/)
  })

  it('ReviewsPage requires real source, publish labels, no invented enum', () => {
    const page = readFileSync(join(root, 'src/admin/ReviewsPage.jsx'), 'utf8')
    assert.match(page, /adminFetch|adminList/)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
    assert.match(page, /ForbiddenState/)
    assert.match(page, /Källa krävs|verklig källa/)
    assert.match(page, /OpsDialog/)
    assert.match(page, /PUBLICERAD|publishLabel/)
    assert.equal(REVIEW_SOURCE_CHOICES, null)
    assert.equal(MAX_PUBLISHED, 6)
    assert.equal(GALLERY_UPLOAD_DEFAULT_PUBLISHED, false)
    assert.equal(GALLERY_DELETE_SUPPORTED, true)
    assert.equal(REVIEW_DELETE_SUPPORTED, true)
    assert.equal(galleryPublishLabel(true), 'PUBLICERAD')
    assert.equal(galleryPublishLabel(false), 'EJ PUBLICERAD')
  })
})

describe('admin System Phase I', () => {
  it('AdminApp wires SystemPage for /admin/system', () => {
    const app = readFileSync(join(root, 'src/admin/AdminApp.jsx'), 'utf8')
    assert.match(app, /AdminSystemPage/)
    assert.match(app, /path="system"/)
    assert.doesNotMatch(app, /soon\('System'/)
  })

  it('SystemPage uses Admin system endpoint and never invents secrets', () => {
    const page = readFileSync(join(root, 'src/admin/SystemPage.jsx'), 'utf8')
    assert.match(page, /adminFetch\('\/system\/'\)/)
    assert.doesNotMatch(page, /opsFetch/)
    assert.doesNotMatch(page, /TELEGRAM_BOT_TOKEN|SECRET_KEY|DB_PASSWORD/)
    assert.match(page, /inga hemligheter/)
    assert.match(page, /telegram_configured/)
  })
})

describe('admin FAQ + Legal Phase H', () => {
  it('AdminApp wires FaqPage and LegalPage', () => {
    const app = readFileSync(join(root, 'src/admin/AdminApp.jsx'), 'utf8')
    assert.match(app, /AdminFaqPage/)
    assert.match(app, /AdminLegalPage/)
    assert.match(app, /path="faq"/)
    assert.match(app, /path="legal"/)
  })

  it('FaqPage uses /api/admin/faq and empty honest state', () => {
    const page = readFileSync(join(root, 'src/admin/FaqPage.jsx'), 'utf8')
    assert.match(page, /\/faq\//)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
    assert.match(page, /ForbiddenState/)
    assert.match(page, /Inget FAQ-innehåll ännu/)
    assert.match(page, /OpsDialog/)
  })

  it('LegalPage admin edits keys only and blocks inventing', () => {
    const page = readFileSync(join(root, 'src/admin/LegalPage.jsx'), 'utf8')
    assert.match(page, /\/legal\//)
    assert.doesNotMatch(page, /opsFetch|\/api\/ops/)
    assert.match(page, /ForbiddenState/)
    assert.match(page, /Inventera inte|restauranggodkänt/)
    assert.match(page, /TRUST_CONTENT_SOURCE/)
  })

  it('public Faq hydrates /api/faq with trustContent fallback', () => {
    const faq = readFileSync(join(root, 'src/pages/Faq.jsx'), 'utf8')
    assert.match(faq, /\/api\/faq\//)
    assert.match(faq, /faqItemsReady/)
    assert.match(faq, /noindex/)
    assert.match(faq, /FAQPage/)
  })
})
