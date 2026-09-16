import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatPrice } from './formatPrice.js'

test('formatPrice formats numbers as kr', () => {
  assert.equal(formatPrice(199), '199 kr')
  assert.equal(formatPrice('399.00'), '399 kr')
  assert.equal(formatPrice(12.5), '12.50 kr')
})

test('formatPrice handles empty', () => {
  assert.equal(formatPrice(null), null)
  assert.equal(formatPrice(''), null)
})
