/**
 * Recompress and generate responsive WebP variants for public site images.
 * Usage: node scripts/optimize-images.mjs
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const imagesDir = join(publicDir, 'images')

mkdirSync(imagesDir, { recursive: true })

async function writeWebp(input, output, { width, height, quality = 72 } = {}) {
  let pipeline = sharp(input).rotate()
  if (width || height) {
    pipeline = pipeline.resize({
      width,
      height,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }
  await pipeline.webp({ quality, effort: 6 }).toFile(output)
  const meta = await sharp(output).metadata()
  console.log(
    `wrote ${output.replace(root + '\\', '').replace(root + '/', '')} (${meta.width}x${meta.height}, q${quality})`,
  )
}

const galleryBases = [
  'dish-steak',
  'interior-ambiance',
  'interior-bar',
  'interior-dining',
  'dish-salad',
]

async function optimizeGallery() {
  for (const base of galleryBases) {
    const srcJpg = join(imagesDir, `${base}.jpg`)
    const srcWebp = join(imagesDir, `${base}.webp`)
    const input = await sharp(srcJpg)
      .metadata()
      .then(() => srcJpg)
      .catch(() => srcWebp)

    await writeWebp(input, join(imagesDir, `${base}-480.webp`), {
      width: 480,
      quality: 72,
    })
    await writeWebp(input, join(imagesDir, `${base}-800.webp`), {
      width: 800,
      quality: 72,
    })
    await writeWebp(input, join(imagesDir, `${base}.webp`), {
      width: 1024,
      quality: 72,
    })
  }
}

async function optimizeHero() {
  const src = join(imagesDir, 'hero-interior.jpg')
  const fallback = join(imagesDir, 'hero-interior.webp')
  const input = await sharp(src)
    .metadata()
    .then(() => src)
    .catch(() => fallback)

  await writeWebp(input, join(imagesDir, 'hero-interior-480.webp'), {
    width: 480,
    quality: 70,
  })
  await writeWebp(input, join(imagesDir, 'hero-interior-800.webp'), {
    width: 800,
    quality: 70,
  })
  await writeWebp(input, join(imagesDir, 'hero-interior.webp'), {
    width: 1024,
    quality: 72,
  })
  await writeWebp(input, join(imagesDir, 'hero-interior-1200.webp'), {
    width: 1200,
    quality: 72,
  })
}

async function optimizeLogo() {
  const src = join(publicDir, 'raffaello-logo.png')
  const fallback = join(publicDir, 'raffaello-logo.webp')
  const input = await sharp(src)
    .metadata()
    .then(() => src)
    .catch(() => fallback)

  await writeWebp(input, join(publicDir, 'raffaello-logo-80.webp'), {
    width: 80,
    height: 80,
    quality: 80,
  })
}

await optimizeLogo()
await optimizeHero()
await optimizeGallery()
console.log('Image optimization complete.')
