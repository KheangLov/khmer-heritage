// Social share image (Open Graph / Twitter): public/og-image.jpg, 1200×630.
// Angkor at sunrise + the Angkor Wat mark + the site name, in the site's
// palette. Rasterised with headless Chromium through Playwright (not a project
// dependency — point PLAYWRIGHT at an install):
//   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node scripts/og-image.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const b64 = (p) => readFileSync(root + p).toString('base64')
const logo = JSON.parse(readFileSync(`${root}app/data/angkor-logo.json`, 'utf8'))
const temple = logo.gallery + logo.centre + logo.left + logo.right + logo.base

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:KH;src:url(data:font/woff2;base64,${b64('public/fonts/battambang-khmer-700.woff2')}) format('woff2');font-weight:700}
@font-face{font-family:KH;src:url(data:font/woff2;base64,${b64('public/fonts/battambang-khmer-400.woff2')}) format('woff2');font-weight:400}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#0C1410;font-family:KH,Georgia,serif}
.bg{position:absolute;inset:0;background:url(data:image/jpeg;base64,${b64('public/images/angkor-sunrise.jpg')}) center 60%/cover}
.veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(12,20,16,.96) 0%,rgba(12,20,16,.86) 42%,rgba(12,20,16,.25) 75%,rgba(12,20,16,.1)),linear-gradient(0deg,rgba(12,20,16,.7),transparent 40%)}
.frame{position:absolute;inset:22px;border:1.5px solid rgba(212,175,55,.45);border-radius:34px}
.txt{position:absolute;left:84px;top:96px;width:640px;color:#F2E8D5}
svg{display:block;margin-bottom:26px}
h1{font-weight:700;font-size:86px;line-height:1.55;color:#E8C96A;background:linear-gradient(180deg,#F4DC8A,#D4AF37 55%,#B08D5F);-webkit-background-clip:text;color:transparent}
.en{font-family:Georgia,serif;letter-spacing:.32em;font-size:22px;color:#C9A87C;margin-top:2px}
p{font-size:28px;line-height:1.9;color:rgba(242,232,213,.85);margin-top:22px}
.url{position:absolute;left:84px;bottom:58px;font-family:Georgia,serif;font-size:22px;letter-spacing:.06em;color:#E8C96A}
</style></head><body>
<div class="bg"></div><div class="veil"></div><div class="frame"></div>
<div class="txt">
  <svg viewBox="${logo.viewBox}" height="118" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4DC8A"/><stop offset=".55" stop-color="#D4AF37"/><stop offset="1" stop-color="#B08D5F"/></linearGradient></defs>
    <g fill="url(#g)" stroke="#0C1410">${temple}</g>
  </svg>
  <h1>បេតិកភណ្ឌខ្មែរ</h1>
  <div class="en">KHMER HERITAGE</div>
  <p>ប្រាសាទ ប្រវត្តិសាស្ត្រ បេតិកភណ្ឌរស់ និងប្រតិទិនចន្ទគតិខ្មែរ</p>
</div>
<div class="url">kh-historic.vercel.app</div>
</body></html>`

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: `${root}public/og-image.jpg`, type: 'jpeg', quality: 86 })
await browser.close()
console.log('wrote public/og-image.jpg')
