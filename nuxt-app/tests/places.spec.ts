import { describe, it, expect } from 'vitest'
import { PLACES, ERA_PLACES, HERITAGE_PLACES, distanceKm, bearingDeg, khmerDirection } from '../app/data/places'
import { TIMELINE } from '../app/data/visuals'

describe('places data', () => {
  it('every place referenced by eras, heritage and the timeline exists', () => {
    const refs = [
      ...Object.values(ERA_PLACES).flat(),
      ...Object.values(HERITAGE_PLACES).flat().map((l) => l.id),
      ...TIMELINE.flatMap((a) => a.events.map((e) => e.place).filter(Boolean)),
    ]
    for (const id of refs) expect(PLACES[id as string], id as string).toBeDefined()
  })
  it('all coordinates fall in Cambodia or the Mekong delta', () => {
    for (const p of Object.values(PLACES)) {
      expect(p.lat, p.id).toBeGreaterThan(10)
      expect(p.lat, p.id).toBeLessThan(15)
      expect(p.lng, p.id).toBeGreaterThan(102)
      expect(p.lng, p.id).toBeLessThan(108)
    }
  })
})

describe('distance and direction', () => {
  const pp = PLACES['royal-palace']!
  const aw = PLACES['angkor-wat']!
  it('Royal Palace → Angkor Wat is ~230 km to the north-west (ពាយព្យ)', () => {
    const km = distanceKm(pp.lat, pp.lng, aw.lat, aw.lng)
    expect(km).toBeGreaterThan(220)
    expect(km).toBeLessThan(240)
    const deg = bearingDeg(pp.lat, pp.lng, aw.lat, aw.lng)
    expect(deg).toBeGreaterThan(320) // ≈205 km N, 115 km W → ≈331°
    expect(deg).toBeLessThan(340)
    expect(khmerDirection(deg)).toBe('ពាយព្យ')
  })
  it('Angkor Wat → Bayon is ~3.3 km, just west of due north (ខាងជើង)', () => {
    const b = PLACES.bayon!
    expect(distanceKm(aw.lat, aw.lng, b.lat, b.lng)).toBeCloseTo(3.3, 0)
    expect(khmerDirection(bearingDeg(aw.lat, aw.lng, b.lat, b.lng))).toBe('ខាងជើង')
  })
  it('eight Khmer directions', () => {
    expect([0, 45, 90, 135, 180, 225, 270, 315].map(khmerDirection))
      .toEqual(['ខាងជើង', 'ឦសាន', 'ខាងកើត', 'អាគ្នេយ៍', 'ខាងត្បូង', 'និរតី', 'ខាងលិច', 'ពាយព្យ'])
  })
})
