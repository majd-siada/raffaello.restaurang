import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HERO_BUSINESS_CTAS, heroCtaLabels } from '../navConfig.js'
import {
  OPS_ROUTE_PATHS,
  opsPathsIncludeRoot,
  OPS_NAV_ITEMS,
} from './opsNav.js'

describe('ops navigation contract', () => {
  it('ops route paths all live under /ops', () => {
    assert.ok(OPS_ROUTE_PATHS.includes('/ops'))
    assert.ok(OPS_ROUTE_PATHS.includes('/ops/login'))
    assert.ok(opsPathsIncludeRoot())
    assert.ok(OPS_NAV_ITEMS.every((item) => item.to.startsWith('/ops')))
  })

  it('public HERO CTAs still include Meny, Veckans, Lunch, Boka', () => {
    const labels = heroCtaLabels(HERO_BUSINESS_CTAS)
    assert.ok(labels.some((l) => l.includes('Meny')))
    assert.ok(labels.some((l) => l.includes('Veckans')))
    assert.ok(labels.some((l) => l.includes('Lunch')))
    assert.ok(labels.some((l) => l.includes('Boka')))
  })
})
