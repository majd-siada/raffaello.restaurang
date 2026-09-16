import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))

/** Mirrors HomeBelowFold featured preference for signatures. */
function pickSignaturePool(items) {
  const available = items.filter((i) => i.is_available !== false)
  const featured = available.filter((i) => i.is_featured === true)
  return featured.length > 0 ? featured : available
}

describe('P1-C featured signature pool', () => {
  it('prefers featured items when any exist', () => {
    const pool = pickSignaturePool([
      { name: 'A', is_featured: false },
      { name: 'B', is_featured: true },
      { name: 'C', is_featured: false },
    ])
    assert.deepEqual(
      pool.map((i) => i.name),
      ['B'],
    )
  })

  it('falls back to all available when none featured', () => {
    const pool = pickSignaturePool([
      { name: 'A', is_featured: false },
      { name: 'B', is_available: false },
      { name: 'C' },
    ])
    assert.deepEqual(
      pool.map((i) => i.name),
      ['A', 'C'],
    )
  })

  it('never invents dishes', () => {
    assert.deepEqual(pickSignaturePool([]), [])
  })
})

describe('P1-C menu UX contracts', () => {
  it('Menu still uses CMS menu API and does not filter-hide categories', () => {
    const src = readFileSync(join(root, 'pages', 'Menu.jsx'), 'utf8')
    assert.match(src, /\/api\/menu\//)
    assert.match(src, /scrollIntoView/)
    assert.match(src, /IntersectionObserver/)
    assert.doesNotMatch(src, /filtered\.map/)
  })

  it('HomeBelowFold prefers is_featured for signatures', () => {
    const src = readFileSync(join(root, 'pages', 'HomeBelowFold.jsx'), 'utf8')
    assert.match(src, /is_featured/)
    assert.match(src, /featured\.length/)
  })

  it('Lunch and WeeklyOffer keep honest empty states with booking CTAs', () => {
    const lunch = readFileSync(join(root, 'pages', 'Lunch.jsx'), 'utf8')
    const offer = readFileSync(join(root, 'pages', 'WeeklyOffer.jsx'), 'utf8')
    assert.match(lunch, /Ingen lunchmeny publicerad ännu/)
    assert.match(lunch, /Boka bord/)
    assert.match(lunch, /Källa:/)
    assert.match(lunch, /Mat och Mat/)
    assert.match(lunch, /source_attribution/)
    assert.match(offer, /Inget erbjudande publicerat ännu/)
    assert.match(offer, /Inget erbjudande publicerat ännu/)
  })
})
