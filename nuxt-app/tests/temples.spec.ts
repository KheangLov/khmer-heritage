import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'

const read = (p: string) => JSON.parse(readFileSync(new URL(`../public/data/${p}`, import.meta.url), 'utf8'))
const index: Array<{ id: string; km: string; en: string; lat: number; lng: number; c: string; p: string; d: string; m: string; h?: 1 }> = read('temples/index.json')
const provinces = new Set(read('cambodia-admin/provinces.geojson').features.map((f: { properties: { c: string } }) => f.properties.c))
const districts = new Set(read('cambodia-admin/districts.geojson').features.map((f: { properties: { c: string } }) => f.properties.c))

describe('temple dataset', () => {
  it('has hundreds of temples with unique ids and a name', () => {
    expect(index.length).toBeGreaterThan(300)
    expect(new Set(index.map((t) => t.id)).size).toBe(index.length)
    for (const t of index) expect(t.km || t.en, t.id).toBeTruthy()
  })
  it('every temple lies inside Cambodia and has a known province and district', () => {
    for (const t of index) {
      expect(t.lat, t.id).toBeGreaterThan(10)
      expect(t.lat, t.id).toBeLessThan(15)
      expect(t.lng, t.id).toBeGreaterThan(102)
      expect(t.lng, t.id).toBeLessThan(108)
      expect(provinces.has(t.p), `${t.id} province ${t.p}`).toBe(true)
      expect(districts.has(t.d), `${t.id} district ${t.d}`).toBe(true)
      expect(t.d.startsWith(t.p) && t.m.startsWith(t.d), `${t.id} code chain`).toBe(true)
    }
  })
  it('every district with temples has its commune boundaries on disk', () => {
    for (const d of new Set(index.map((t) => t.d))) {
      expect(existsSync(new URL(`../public/data/cambodia-admin/communes/${d}.geojson`, import.meta.url)), d).toBe(true)
    }
  })
  it('temples flagged with history have the text in their province detail file', () => {
    const byProv = new Map<string, Record<string, { history: Record<string, { text: string }> }>>()
    for (const t of index.filter((x) => x.h)) {
      if (!byProv.has(t.p)) byProv.set(t.p, read(`temples/detail/${t.p}.json`))
      const h = byProv.get(t.p)![t.id]!.history
      expect((h.km ?? h.en)?.text.length, t.id).toBeGreaterThan(40)
    }
  })
  it('Bakong is dated 881 CE and sits in Siem Reap', () => {
    const b = index.find((t) => t.km === 'ប្រាសាទបាគង')!
    expect(b.p).toBe('17')
    expect(read('temples/detail/17.json')[b.id].facts.period).toBe('គ.ស. ៨៨១')
  })
})
