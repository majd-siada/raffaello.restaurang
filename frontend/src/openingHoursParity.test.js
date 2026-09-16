import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..')

describe('P1-E opening hours source parity', () => {
  it('keeps frontend and backend openingHours JSON identical', () => {
    const fe = readFileSync(
      join(repoRoot, 'frontend', 'src', 'data', 'openingHours.json'),
    )
    const be = readFileSync(
      join(repoRoot, 'backend', 'raffaello', 'data', 'opening_hours.json'),
    )
    const feHash = createHash('sha256').update(fe).digest('hex')
    const beHash = createHash('sha256').update(be).digest('hex')
    assert.equal(
      feHash,
      beHash,
      'FE and BE opening hours files drifted — sync before deploy',
    )
  })
})
