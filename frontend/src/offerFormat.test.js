import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatDishDescription, formatOfferIntroText } from './offerFormat.js'

describe('P1-E offer display hygiene', () => {
  it('normalizes known Tillveckans typo without inventing copy', () => {
    assert.equal(
      formatOfferIntroText('Tillveckans erbjudande får ni välja'),
      'Till veckans erbjudande får ni välja',
    )
  })

  it('collapses whitespace', () => {
    assert.equal(formatOfferIntroText('  Hej   där  '), 'Hej där')
  })

  it('returns empty for blank', () => {
    assert.equal(formatOfferIntroText(''), '')
    assert.equal(formatOfferIntroText('   '), '')
  })

  it('normalizes dish description line endings', () => {
    assert.equal(formatDishDescription('A\r\nB\r\nC'), 'A\nB\nC')
  })
})
