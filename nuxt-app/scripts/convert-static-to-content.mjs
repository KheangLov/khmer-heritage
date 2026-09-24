#!/usr/bin/env node
// ---------------------------------------------------------------------------
// convert-static-to-content.mjs
// ---------------------------------------------------------------------------
// One-time, deterministic migration of the verified Khmer heritage static
// article pages (public/static/pages/*.html) into @nuxt/content v3 markdown
// collections. The static HTML is treated as ground truth — this script only
// re-expresses it as editable Khmer markdown; it does not invent or rewrite
// any content. The original static site under /static/ is left untouched.
//
// Output layout (collection = content source rooted at app/content/):
//   app/content/era/era-N.md          — the 15 Suriyakati-era pages
//   app/content/heritage/heritage-*.md — the living-heritage articles
// Frontmatter keeps the hero (kicker, en title, sub), hero image, the
// facts sidebar (dt/dd), and related-links; the body is the d-sec sections
// converted to h2 + paragraph markdown. Related hrefs are remapped to Nuxt
// content routes (era-N.html -> /era N slug, amok.html -> heritage slug).
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'public', 'static', 'pages')
const OUT = path.join(ROOT, 'app', 'content')

const unescape = (s = '') =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .trim()

const pick = (s, from, to) => {
  const i = s.indexOf(from)
  if (i < 0) return undefined
  const j = s.indexOf(to, i + from.length)
  if (j < 0) return undefined
  return s.slice(i + from.length, j)
}

// Map a static relative href to a Nuxt content route.
function toRoute(href = '') {
  const base = href.split('#')[0].split('?')[0]
  if (!base) return href
  const name = base.replace(/\.html$/, '')
  if (name === 'index') return '/'
  if (name === 'calendar') return '/calendar'
  if (/^era-\d+$/.test(name)) return `/era/${name}`
  return `/heritage/${name}`
}

function slugify(name) {
  return name.replace(/\.html$/, '').replace(/[^a-z0-9-]/g, '')
}

function extractFacts(html) {
  // <div class="fact"><dt>K</dt><dd>V</dd></div> (possibly attributes in dt/dd)
  const facts = []
  const re = /<div class="fact">\s*<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>\s*<\/div>/g
  let m
  while ((m = re.exec(html))) {
    const dt = unescape(m[1].replace(/<[^>]+>/g, ''))
    const dd = unescape(m[2].replace(/<[^>]+>/g, ''))
    if (dt) facts.push({ t: dt, d: dd })
  }
  return facts
}

function extractRelated(html) {
  const out = []
  const re = /<a class="d-rel" href="([^"]+)">([\s\S]*?)<\/a>/g
  let m
  while ((m = re.exec(html))) {
    const label = unescape(m[2].replace(/<[^>]+>/g, ''))
    const to = toRoute(m[1])
    if (label && to) out.push({ label, to })
  }
  return out
}

function extractBody(html) {
  // All article bodies are <section class="d-sec"><h2>..</h2><p>..</p>*</section>.
  const secs = []
  const re = /<section class="d-sec">([\s\S]*?)<\/section>/g
  let m
  while ((m = re.exec(html))) {
    const inner = m[1]
    const h = pick(inner, '<h2>', '</h2>')
    const hi = inner.indexOf('</h2>')
    const rest = hi >= 0 ? inner.slice(hi + 6) : inner
    const paras = []
    if (rest) {
      const pre = /<p[^>]*>([\s\S]*?)<\/p>/g
      let p
      while ((p = pre.exec(rest))) {
        const t = unescape(p[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
        if (t) paras.push(t.replace(/\n+/g, '\n\n'))
      }
    }
    if (h) secs.push({ h: unescape(h.replace(/<[^>]+>/g, '')), p: paras })
  }
  return secs
}

function frontmatter(entries) {
  return '---\n' + entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n') + '\n---\n\n'
}

function buildMd(html) {
  const title = (pick(html, '<title>', '</title>') || '').replace(/\s*—\s*បេតិកភណ្ឌរស់រវើក.*$/u, '').trim()
  const kicker = unescape(pick(html, '<div class="kicker">', '</div>') || '')
  const h1 = unescape(pick(html, '<h1>', '</h1>') || '')
  const en = unescape(pick(html, '<div class="d-en">', '</div>') || '')
  const sub = unescape(pick(html, '<p class="d-sub">', '</p>') || '')

  const heroM = /<section class="d-hero"[\s\S]*?<img src="\.\.\/images\/([^"]+)" alt="([^"]*)">/.exec(html)
  const hero = heroM ? heroM[1] : ''
  const heroAlt = heroM ? heroM[2] : ''

  // facts + related live after the body sections
  const facts = extractFacts(html)
  const related = extractRelated(html)

  // Body: everything from first d-sec to the facts aside.
  const bodyStart = html.indexOf('<section class="d-sec">')
  const factsIdx = html.indexOf('<aside class="d-facts">')
  const bodyHtml = bodyStart >= 0 && factsIdx > bodyStart ? html.slice(bodyStart, factsIdx) : html
  const body = extractBody(bodyHtml)

  const fm = frontmatter([
    ['title', title || h1 || en],
    ['kicker', kicker],
    ['h1', h1],
    ['en', en],
    ['sub', sub],
    ['hero', hero],
    ['heroAlt', heroAlt],
    ['facts', facts],
    ['related', related],
  ])

  const md = body
    .map((sec) => {
      const body = sec.p.length
        ? '\n\n' + sec.p.map((p) => p.replace(/\n/g, '\n\n')).join('\n\n')
        : ''
      return `## ${sec.h}${body}`
    })
    .join('\n\n')

  return fm + md + '\n'
}

function main() {
  const files = readdirSync(SRC).filter((f) => f.endsWith('.html'))
  let count = 0
  for (const f of files) {
    const html = readFileSync(path.join(SRC, f), 'utf8')
    const base = f.replace(/\.html$/, '')
    const isEra = /^era-\d+$/.test(base)
    const dir = isEra ? 'era' : 'heritage'
    const outDir = path.join(OUT, dir)
    mkdirSync(outDir, { recursive: true })
    const outFile = path.join(outDir, `${slugify(base)}.md`)
    writeFileSync(outFile, buildMd(html))
    count++
  }
  console.log(`converted ${count} pages into ${OUT}`)
  // sanity: report pages with no facts (should be none)
  const warn = files.filter((f) => {
    const html = readFileSync(path.join(SRC, f), 'utf8')
    return !html.includes('class="fact"')
  })
  if (warn.length) console.warn('pages WITHOUT facts:', warn.join(', '))
}

main()
