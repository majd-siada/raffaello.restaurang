import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const indexPath = join(dist, 'index.html')

function deferStylesheets(html) {
  return html.replace(
    /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/g,
    `<link rel="preload" as="style" crossorigin href="$1" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" crossorigin href="$1"></noscript>`,
  )
}

function extractAssets(html) {
  const scripts = html.match(/<script type="module"[^>]*><\/script>/g) || []
  const preloads = html.match(/<link rel="modulepreload"[^>]*>/g) || []
  const styles = html.match(/<link rel="stylesheet"[^>]*>/g) || []
  const deferred = styles.map((tag) => {
    const href = tag.match(/href="([^"]+)"/)?.[1]
    if (!href) return tag
    return `<link rel="preload" as="style" crossorigin href="${href}" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" crossorigin href="${href}"></noscript>`
  })
  return [...deferred, ...preloads, ...scripts].join('\n    ')
}

let html = readFileSync(indexPath, 'utf8')
html = deferStylesheets(html)
writeFileSync(indexPath, html)

const menyShell = `<!doctype html>
<html lang="sv">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0a0908" />
    <title>Meny | Raffaello Restaurang Boden</title>
    <link rel="icon" href="/raffaello-logo.webp" type="image/webp" />
    <link
      rel="preload"
      as="image"
      href="/images/menu-bg-480.webp"
      type="image/webp"
      fetchpriority="high"
    />
    <style>
      html,body{margin:0;background:#0a0908;color:#c8c4bc}
      #boot{
        min-height:42dvh;min-height:240px;max-height:360px;display:flex;
        align-items:center;justify-content:center;text-align:center;
        position:relative;overflow:hidden;background:#000;
      }
      #boot img{
        position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
        object-position:center 75%;
      }
      #boot .veil{
        position:absolute;inset:0;
        background:linear-gradient(to bottom,rgba(0,0,0,.55),rgba(0,0,0,.75));
      }
      #boot .copy{position:relative;z-index:1;padding:1.25rem}
      #boot p{margin:0 0 .75rem;font:500 .7rem/1.2 system-ui,sans-serif;
        letter-spacing:.35em;text-transform:uppercase;color:#d4af37}
      #boot h1{margin:0;font:700 clamp(2.25rem,7vw,3.5rem)/1 system-ui,sans-serif;color:#d4af37}
      #boot .sub{margin:.5rem 0 0;font:500 .85rem/1.2 system-ui,sans-serif;
        letter-spacing:.3em;text-transform:uppercase;color:#fff}
      #boot .rule{width:4rem;height:1px;background:#d4af37;margin:1.1rem auto 0;opacity:.9}
    </style>
  </head>
  <body>
    <div id="root">
      <div id="boot" aria-hidden="true">
        <img
          src="/images/menu-bg-480.webp"
          alt=""
          width="480"
          height="600"
          fetchpriority="high"
          decoding="async"
        />
        <div class="veil"></div>
        <div class="copy">
          <p>Meny</p>
          <h1>Raffaello</h1>
          <p class="sub">Stekhus &amp; Bar</p>
          <div class="rule"></div>
        </div>
      </div>
    </div>
`

const assets = extractAssets(html)
const menyHtml = `${menyShell}
    ${assets}
  </body>
</html>
`

mkdirSync(join(dist, 'meny'), { recursive: true })
writeFileSync(join(dist, 'meny', 'index.html'), menyHtml)

for (const file of ['hero-interior-480.webp', 'menu-bg-480.webp']) {
  try {
    copyFileSync(join(root, 'public', 'images', file), join(dist, 'images', file))
  } catch {
    /* Vite already copied public/ */
  }
}

console.log('Wrote FCP shells: dist/index.html + dist/meny/index.html')
