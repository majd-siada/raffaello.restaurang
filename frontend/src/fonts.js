/* Brand fonts only — body/heading use metric-adjusted system fallbacks in index.css.
   font-display: optional avoids late-swap CLS. */
import outfit700 from '@fontsource/outfit/latin-700.css?inline'
import outfitExt700 from '@fontsource/outfit/latin-ext-700.css?inline'
import cormorant500i from '@fontsource/cormorant-garamond/latin-500-italic.css?inline'
import cormorantExt500i from '@fontsource/cormorant-garamond/latin-ext-500-italic.css?inline'
import playfair700 from '@fontsource/playfair-display/latin-700.css?inline'
import playfairExt700 from '@fontsource/playfair-display/latin-ext-700.css?inline'

const sheets = [
  outfit700,
  outfitExt700,
  cormorant500i,
  cormorantExt500i,
  playfair700,
  playfairExt700,
]

const css = sheets
  .join('\n')
  .replace(/font-display:\s*swap/g, 'font-display: optional')

const style = document.createElement('style')
style.textContent = css
document.head.appendChild(style)
