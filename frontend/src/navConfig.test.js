import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ALWAYS_VISIBLE_BUSINESS_LABELS,
  HERO_BUSINESS_CTAS,
  HOME_SECTION_ORDER,
  NAV_LINKS_LEFT,
  heroCtaLabels,
  leftNavIncludesLunch,
  leftNavIncludesWeeklyOffer,
  shouldShowNavLinkForEmptyContent,
} from './navConfig.js'

describe('business navigation structure', () => {
  it('keeps Meny, Erbjudande, Lunch, and Boka bord as first-class destinations', () => {
    assert.ok(NAV_LINKS_LEFT.some((l) => l.to === '/meny' && l.label === 'Meny'))
    assert.ok(leftNavIncludesWeeklyOffer())
    assert.ok(leftNavIncludesLunch())
    assert.deepEqual(
      ALWAYS_VISIBLE_BUSINESS_LABELS,
      ['Meny', 'Erbjudande', 'Lunch', 'Boka bord'],
    )
  })

  it('hero CTA stack is Meny → Veckans Erbjudande → Lunch → Boka bord', () => {
    assert.deepEqual(heroCtaLabels(), [
      'Meny',
      'Veckans Erbjudande',
      'Lunch',
      'Boka bord',
    ])
    assert.equal(HERO_BUSINESS_CTAS[3].to, '/boka')
  })

  it('empty lunch data does not hide Lunch navigation', () => {
    assert.equal(shouldShowNavLinkForEmptyContent('/lunch', true), true)
  })

  it('empty weekly offer data does not hide Erbjudande navigation', () => {
    assert.equal(
      shouldShowNavLinkForEmptyContent('/veckans-erbjudande', true),
      true,
    )
  })

  it('empty gallery may remain hidden (homepage module concern)', () => {
    assert.equal(shouldShowNavLinkForEmptyContent('gallery', true), false)
    assert.equal(shouldShowNavLinkForEmptyContent('gallery', false), true)
  })
})

describe('P1 homepage sequence contract', () => {
  it('exports cinematic section order with reviews slot (bar still gated)', () => {
    assert.deepEqual(HOME_SECTION_ORDER, [
      'atmosphere',
      'signatures',
      'why',
      'lunch-offer',
      'events',
      'reviews',
      'gallery',
      'location',
      'booking-close',
    ])
    assert.ok(!HOME_SECTION_ORDER.includes('bar'))
  })
})

describe('menu data flow contract', () => {
  it('Menu page still targets the CMS menu API path', async () => {
    const { readFile } = await import('node:fs/promises')
    const { fileURLToPath } = await import('node:url')
    const { dirname, join } = await import('node:path')
    const here = dirname(fileURLToPath(import.meta.url))
    const menuSrc = await readFile(join(here, 'pages', 'Menu.jsx'), 'utf8')
    assert.match(menuSrc, /\/api\/menu\//)
    assert.match(menuSrc, /fetch\(API_URL\)/)
    assert.doesNotMatch(menuSrc, /hardcodedMenu|FAKE_MENU|const MENU_ITEMS\s*=\s*\[/)
  })

  it('HomeBelowFold signatures use menu API', async () => {
    const { readFile } = await import('node:fs/promises')
    const { fileURLToPath } = await import('node:url')
    const { dirname, join } = await import('node:path')
    const here = dirname(fileURLToPath(import.meta.url))
    const src = await readFile(join(here, 'pages', 'HomeBelowFold.jsx'), 'utf8')
    assert.match(src, /\/api\/menu\//)
    assert.match(src, /data-home-section="signatures"/)
    assert.match(src, /data-home-section="lunch-offer"/)
    assert.match(src, /data-home-section="booking-close"/)
  })

  it('event capacities remain gated until confirmed', async () => {
    const { readFile } = await import('node:fs/promises')
    const { fileURLToPath } = await import('node:url')
    const { dirname, join } = await import('node:path')
    const here = dirname(fileURLToPath(import.meta.url))
    const site = await readFile(join(here, 'siteConfig.js'), 'utf8')
    const page = await readFile(join(here, 'pages', 'PrivateEvents.jsx'), 'utf8')
    assert.match(site, /capacitiesConfirmed:\s*false/)
    assert.match(page, /capacitiesConfirmed/)
    assert.match(page, /EventsInquiryForm/)
  })
})
