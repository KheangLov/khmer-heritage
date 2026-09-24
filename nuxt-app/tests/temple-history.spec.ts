import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { yearOf, periodOf } from '../app/utils/temple-history'

const index: Array<{ id: string; y?: string; c: 'prasat' | 'wat' }> =
  JSON.parse(readFileSync(new URL('../public/data/temples/index.json', import.meta.url), 'utf8'))

describe('temple history periods', () => {
  it('reads the period labels written by build-temples.py', () => {
    expect(yearOf('គ.ស. ៨៨១')).toBe(881)
    expect(yearOf('គ.ស. ០៩៦៨')).toBe(968)
    expect(yearOf('សតវត្សទី ១២')).toBe(1150)
    expect(yearOf('ទសវត្សរ៍ ១៩៦០')).toBe(1960)
    expect(yearOf('៥០០ មុនគ.ស.')).toBe(-500)
    expect(yearOf('សម័យអង្គរ')).toBeNull()
    expect(yearOf(undefined)).toBeNull()
  })
  it('places known temples in the right period and era page', () => {
    expect(periodOf({ y: 'គ.ស. ៨៨១', c: 'prasat' })).toMatchObject({ id: 'temple-mountains', to: '/era/era-4' }) // Bakong
    expect(periodOf({ y: 'គ.ស. ៩៦៧', c: 'prasat' })).toMatchObject({ id: 'classic', to: '/era/era-5' }) // Banteay Srei
    expect(periodOf({ y: 'សតវត្សទី ១២', c: 'prasat' })).toMatchObject({ id: 'angkor-wat', to: '/era/era-6' })
    expect(periodOf({ y: 'គ.ស. ១១៨៥', c: 'prasat' })).toMatchObject({ id: 'bayon', to: '/era/era-7' })
    expect(periodOf({ y: 'គ.ស. ១៤៤២', c: 'wat' })).toMatchObject({ id: 'post-angkor', to: '/era/era-9' })
    expect(periodOf({ y: 'សតវត្សទី ១៦', c: 'wat' })).toMatchObject({ id: 'post-angkor', to: '/era/era-10' })
    expect(periodOf({ y: 'សម័យអង្គរ', c: 'prasat' })).toMatchObject({ id: 'angkor', dated: true })
    expect(periodOf({ c: 'wat' })).toMatchObject({ id: 'undated-wat', dated: false })
    expect(periodOf({ c: 'prasat' })).toMatchObject({ id: 'undated-prasat', dated: false })
  })
  it('every temple in the dataset gets history text and a working link', () => {
    for (const t of index) {
      const p = periodOf(t)
      expect(p.text.length, t.id).toBeGreaterThan(80)
      // a dated label that fails to parse would silently fall back to "undated"
      if (t.y) expect(p.dated, `${t.id} ${t.y}`).toBe(true)
      if (p.to.startsWith('/era/')) {
        expect(existsSync(new URL(`../app/content${p.to}.md`, import.meta.url)), p.to).toBe(true)
      }
    }
  })
})
