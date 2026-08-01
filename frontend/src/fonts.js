/* Loaded after first paint; font-display: optional avoids late-swap CLS */
import playfair400 from '@fontsource/playfair-display/latin-400.css?inline'
import playfair600 from '@fontsource/playfair-display/latin-600.css?inline'
import playfair700 from '@fontsource/playfair-display/latin-700.css?inline'
import playfairExt400 from '@fontsource/playfair-display/latin-ext-400.css?inline'
import playfairExt600 from '@fontsource/playfair-display/latin-ext-600.css?inline'
import playfairExt700 from '@fontsource/playfair-display/latin-ext-700.css?inline'
import poppins400 from '@fontsource/poppins/latin-400.css?inline'
import poppins500 from '@fontsource/poppins/latin-500.css?inline'
import poppins600 from '@fontsource/poppins/latin-600.css?inline'
import poppinsExt400 from '@fontsource/poppins/latin-ext-400.css?inline'
import poppinsExt500 from '@fontsource/poppins/latin-ext-500.css?inline'
import poppinsExt600 from '@fontsource/poppins/latin-ext-600.css?inline'
import outfit700 from '@fontsource/outfit/latin-700.css?inline'
import outfitExt700 from '@fontsource/outfit/latin-ext-700.css?inline'
import cormorant500i from '@fontsource/cormorant-garamond/latin-500-italic.css?inline'
import cormorantExt500i from '@fontsource/cormorant-garamond/latin-ext-500-italic.css?inline'

const sheets = [
  playfair400,
  playfair600,
  playfair700,
  playfairExt400,
  playfairExt600,
  playfairExt700,
  poppins400,
  poppins500,
  poppins600,
  poppinsExt400,
  poppinsExt500,
  poppinsExt600,
  outfit700,
  outfitExt700,
  cormorant500i,
  cormorantExt500i,
]

const css = sheets
  .join('\n')
  .replace(/font-display:\s*swap/g, 'font-display: optional')

const style = document.createElement('style')
style.textContent = css
document.head.appendChild(style)
