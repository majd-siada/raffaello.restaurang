import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  FAQ_ITEMS,
  LEGAL_PAGES,
  POSITIONING,
  faqItemsReady,
  legalPageReady,
  positioningLineReady,
} from './trustContent.js'

const root = dirname(fileURLToPath(import.meta.url))

describe('P1-D trust content contracts', () => {
  it('does not ship invented FAQ answers', () => {
    assert.equal(faqItemsReady(FAQ_ITEMS).length, 0)
  })

  it('does not ship invented legal paragraphs', () => {
    assert.equal(legalPageReady('bokningsvillkor'), false)
    assert.equal(legalPageReady('integritet'), false)
    assert.ok(Array.isArray(LEGAL_PAGES.bokningsvillkor.paragraphs))
    assert.ok(Array.isArray(LEGAL_PAGES.integritet.paragraphs))
  })

  it('keeps positioning as CONTENT REQUIRED until approved', () => {
    assert.equal(POSITIONING.status, 'CONTENT_REQUIRED')
    assert.equal(positioningLineReady(), false)
  })

  it('App registers trust routes', () => {
    const src = readFileSync(join(root, 'App.jsx'), 'utf8')
    assert.match(src, /path="\/faq"/)
    assert.match(src, /path="\/galleri"/)
    assert.match(src, /path="\/bokningsvillkor"/)
    assert.match(src, /path="\/integritet"/)
  })

  it('homepage reviews fetch API and omit when empty', () => {
    const src = readFileSync(join(root, 'pages', 'HomeBelowFold.jsx'), 'utf8')
    assert.match(src, /\/api\/reviews\//)
    assert.match(src, /data-home-section="reviews"/)
    assert.match(src, /reviews\.length > 0/)
  })

  it('FAQ page uses noindex when empty and FAQPage only when ready', () => {
    const src = readFileSync(join(root, 'pages', 'Faq.jsx'), 'utf8')
    assert.match(src, /noindex/)
    assert.match(src, /FAQPage/)
    assert.match(src, /faqItemsReady/)
  })

  it('homepage gallery uses SITE.gallery when CMS is empty', () => {
    const src = readFileSync(join(root, 'pages', 'HomeBelowFold.jsx'), 'utf8')
    assert.match(src, /\/api\/gallery\//)
    assert.match(src, /siteGalleryFallback|SITE\.gallery/)
    assert.match(src, /data-home-section="gallery"/)
  })

  it('gallery page can use real SITE.gallery photos when CMS is empty', () => {
    const src = readFileSync(join(root, 'pages', 'Gallery.jsx'), 'utf8')
    assert.match(src, /\/api\/gallery\//)
    assert.match(src, /SITE\.gallery/)
    assert.match(src, /usingFallback/)
    assert.doesNotMatch(src, /unsplash|placeholder\.com|lorem/i)
  })

  it('sitemap includes /galleri and published FAQ route; excludes empty legal', () => {
    const sitemap = readFileSync(join(root, '..', 'public', 'sitemap.xml'), 'utf8')
    assert.match(sitemap, /\/galleri/)
    assert.match(sitemap, /\/faq/)
    assert.doesNotMatch(sitemap, /\/bokningsvillkor/)
    assert.doesNotMatch(sitemap, /\/integritet/)
  })

  it('llms.txt points to /boka and /lunch on-site', () => {
    const llms = readFileSync(join(root, '..', 'public', 'llms.txt'), 'utf8')
    assert.match(llms, /raffaello\.se\/boka/)
    assert.match(llms, /raffaello\.se\/lunch/)
    assert.doesNotMatch(llms, /kontakt#boka-bord/)
  })

  it('Menu allergen notice only when allergen data exists', () => {
    const src = readFileSync(join(root, 'pages', 'Menu.jsx'), 'utf8')
    assert.match(src, /allergenItemCount > 0/)
    assert.match(src, /Saknas märkning/)
  })

  it('App exposes skip link to main content', () => {
    const src = readFileSync(join(root, 'App.jsx'), 'utf8')
    assert.match(src, /skip-link/)
    assert.match(src, /id="main-content"/)
  })
})
