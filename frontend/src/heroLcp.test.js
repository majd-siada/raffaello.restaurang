import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8')
const homeJsx = readFileSync(join(root, 'src/pages/Home.jsx'), 'utf8')

describe('hero LCP discovery', () => {
  it('boot img uses the same srcset as the React hero (no mismatched preload)', () => {
    assert.equal(/rel=["']preload["'][^>]*hero-interior/.test(indexHtml), false)
    assert.match(
      indexHtml,
      /srcset="\/images\/hero-interior-480\.webp 480w, \/images\/hero-interior-800\.webp 800w, \/images\/hero-interior\.webp 1024w"/,
    )
    assert.match(indexHtml, /sizes="100vw"/)
    assert.equal(/rel=["']preload["']/.test(homeJsx), false)
    assert.match(
      homeJsx,
      /heroLcp.*480w[\s\S]*heroMobile.*800w[\s\S]*hero.*1024w/,
    )
  })
})
