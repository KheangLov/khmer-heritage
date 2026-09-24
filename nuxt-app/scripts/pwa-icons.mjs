// PWA icons, drawn from the same sources as the rest of the site:
//   public/icons/maskable-512.png   Angkor Wat mark (app/data/angkor-logo.json)
//                                   full-bleed, inside the maskable safe zone
//                                   (the central 80% circle) so Android's
//                                   circle/squircle crops never cut the towers
//   public/icons/shortcut-*.png     app-shortcut icons (long-press the app
//                                   icon) from the KhmerIcon set
//
// Rasterised with headless Chromium through Playwright, which is not a project
// dependency — point PLAYWRIGHT at an install:
//   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node scripts/pwa-icons.mjs
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const logo = JSON.parse(readFileSync(`${root}app/data/angkor-logo.json`, 'utf8'))
const iconSrc = readFileSync(`${root}app/components/KhmerIcon.vue`, 'utf8')
const icon = (name) => {
  const m = iconSrc.match(new RegExp(`\\n  ${name}: \`([\\s\\S]*?)\`,`))
  if (!m) throw new Error(`icon ${name} not found`)
  return m[1]
}

const MOSS = '#14241B'
const GOLD = '#E8C96A'
const temple = logo.gallery + logo.centre + logo.left + logo.right + logo.base

// Temple bounding box in the flag's coordinates (see scripts/angkor-logo.py).
const [bx, by, bw, bh] = [66.23, 552.64, 258.26, 166.63]
function maskable(size) {
  const w = size * 0.62 // box diagonal ≈ 0.74·size, inside the 0.8·size safe circle
  const s = w / bw
  const tx = (size - w) / 2 - bx * s
  const ty = (size - bh * s) / 2 + size * 0.03 - by * s
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs>
  <radialGradient id="bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#1E3326"/><stop offset="1" stop-color="#0C1410"/></radialGradient>
  <radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F4DC8A" stop-opacity=".45"/><stop offset="1" stop-color="#E8C96A" stop-opacity="0"/></radialGradient>
  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4DC8A"/><stop offset=".55" stop-color="#D4AF37"/><stop offset="1" stop-color="#B08D5F"/></linearGradient>
  <style>.t *{stroke-width:1}</style>
</defs>
<rect width="${size}" height="${size}" fill="url(#bg)"/>
<circle cx="${size / 2}" cy="${size * 0.4}" r="${size * 0.26}" fill="url(#sun)"/>
<g class="t" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})" fill="url(#g)" stroke="${MOSS}">${temple}</g>
</svg>`
}
function shortcut(name, size = 96) {
  const pad = size * 0.22
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="${MOSS}"/>
<svg x="${pad}" y="${pad}" width="${size - 2 * pad}" height="${size - 2 * pad}" viewBox="0 0 48 48" fill="none" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" color="${GOLD}">
<style>.f{fill:${GOLD};fill-opacity:.2}.kh-aw *{stroke-width:5.5px}.kh-aw g[fill="none"] *{fill:none}</style>${icon(name)}</svg>
</svg>`
}

const out = `${root}public/icons/`
mkdirSync(out, { recursive: true })
const jobs = [
  ['maskable-512.png', maskable(512), 512],
  ['shortcut-map.png', shortcut('pin'), 96],
  ['shortcut-timeline.png', shortcut('book'), 96],
  ['shortcut-heritage.png', shortcut('apsara'), 96],
  ['shortcut-calendar.png', shortcut('calendar'), 96],
]

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright')
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [file, svg, size] of jobs) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`)
  await page.screenshot({ path: out + file, clip: { x: 0, y: 0, width: size, height: size } })
  console.log('wrote public/icons/' + file)
}
await browser.close()
