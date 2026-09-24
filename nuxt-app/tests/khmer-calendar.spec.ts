import { describe, it, expect } from 'vitest'
import {
  gregorianToKhmerLunar, formatKhmerLunar, khmerNum, khmerYearName,
  lunarYearType, fullMoonOf, lunarEventsFor, dayKey, SOLAR_EVENTS,
} from '../app/utils/khmer-calendar'

const ev = (year: number, m: number, d: number) =>
  lunarEventsFor(year).filter((e) => e.m === m && e.d === d).map((e) => e.t)

describe('engine anchor (Mekong University)', () => {
  it('18 Dec 2025 = រោច ១៣ ខែមិគសិរ, ឆ្នាំម្សាញ់ សប្តស័ក, ព.ស. ២៥៦៩', () => {
    const l = gregorianToKhmerLunar(2025, 12, 18)
    expect(l.phase).toBe('waning')
    expect(l.day).toBe(13)
    expect(l.month).toBe(1) // មិគសិរ
    expect(formatKhmerLunar(l)).toBe('រោច ១៣ ខែមិគសិរ')
    expect(l.beYear + 1).toBe(2569)
    expect(khmerYearName(2569).full).toBe('ឆ្នាំម្សាញ់ សប្តស័ក')
  })
})

describe('2026 official festival dates', () => {
  it('Meak Bochea = Feb 2 (full moon ខែមាឃ)', () => {
    expect(fullMoonOf(2026, 3)).toEqual({ year: 2026, month: 2, day: 2 })
    expect(ev(2026, 2, 2)).toContain('ពិធីបុណ្យមាឃបូជា')
  })
  it('Visak Bochea = May 1 (full moon ខែពិសាខ)', () => {
    expect(fullMoonOf(2026, 6)).toEqual({ year: 2026, month: 5, day: 1 })
    expect(ev(2026, 5, 1)).toContain('ពិធីបុណ្យវិសាខបូជា')
  })
  it('Royal Ploughing Ceremony = May 5 (waning 4 ខែពិសាខ), not October', () => {
    expect(ev(2026, 5, 5)).toContain('ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល')
    expect(ev(2026, 10, 26)).not.toContain('ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល')
  })
  it('Asalha Bochea = Jul 29 (second eighth), Vassa = Jul 30', () => {
    expect(fullMoonOf(2026, 8, false)).toEqual({ year: 2026, month: 7, day: 29 })
    expect(ev(2026, 7, 29)).toContain('ពិធីបុណ្យអាសាឍបូជា')
    expect(ev(2026, 7, 30)).toContain('ចូលវស្សា')
  })
  it('Kan Ben = Sep 27 – Oct 10 (រោច ១–១៤ ខែភទ្របទ)', () => {
    expect(ev(2026, 9, 27)).toContain('កាន់បិណ្ឌ ទី១')
    expect(ev(2026, 10, 10)).toContain('កាន់បិណ្ឌ ទី១៤')
    expect(ev(2026, 9, 26).some((t) => t.startsWith('កាន់បិណ្ឌ'))).toBe(false)
  })
  it('Pchum Ben public holiday = Oct 10–12 (រោច ១៤ – កើត ១ ខែអស្សុជ), Pchum day Oct 11', () => {
    expect(ev(2026, 10, 11)).toContain('ពិធីបុណ្យភ្ជុំបិណ្ឌ')
    expect(ev(2026, 10, 10)).toContain('ថ្ងៃឈប់សម្រាកភ្ជុំបិណ្ឌ')
    expect(ev(2026, 10, 12)).toContain('ថ្ងៃឈប់សម្រាកភ្ជុំបិណ្ឌ')
    expect(ev(2026, 10, 13)).toEqual([])
  })
  it('Pchum Ben holidays match official lists: 2025 Sep 21–23, 2024 Oct 1–3', () => {
    expect(ev(2025, 9, 21)).toContain('ថ្ងៃឈប់សម្រាកភ្ជុំបិណ្ឌ')
    expect(ev(2025, 9, 22)).toContain('ពិធីបុណ្យភ្ជុំបិណ្ឌ')
    expect(ev(2025, 9, 23)).toContain('ថ្ងៃឈប់សម្រាកភ្ជុំបិណ្ឌ')
    expect(ev(2024, 10, 1)).toContain('ថ្ងៃឈប់សម្រាកភ្ជុំបិណ្ឌ')
    expect(ev(2024, 10, 2)).toContain('ពិធីបុណ្យភ្ជុំបិណ្ឌ')
    expect(ev(2024, 10, 3)).toContain('ថ្ងៃឈប់សម្រាកភ្ជុំបិណ្ឌ')
  })
  it('Bon Om Touk = Nov 23–25 (full moon ខែកត្តិក ± 1)', () => {
    expect(fullMoonOf(2026, 12)).toEqual({ year: 2026, month: 11, day: 24 })
    expect(ev(2026, 11, 23)).toContain('ព្រះរាជពិធីបុណ្យអុំទូក')
    expect(ev(2026, 11, 24)).toContain('ព្រះរាជពិធីបុណ្យអុំទូក')
    expect(ev(2026, 11, 25)).toContain('ព្រះរាជពិធីបុណ្យអុំទូក')
  })
  it('Khmer New Year = Apr 14–16 (2026), Apr 13–16 (2024)', () => {
    expect(ev(2026, 4, 14)).toContain('បុណ្យចូលឆ្នាំថ្មី — មហាសង្រ្កាន្ត')
    expect(ev(2026, 4, 16)).toContain('បុណ្យចូលឆ្នាំថ្មី — ថ្ងៃឡើងស័ក')
    expect(ev(2026, 4, 13)).toEqual([])
    expect(ev(2024, 4, 13)).toContain('បុណ្យចូលឆ្នាំថ្មី — មហាសង្រ្កាន្ត')
    expect(ev(2024, 4, 16)).toContain('បុណ្យចូលឆ្នាំថ្មី — ថ្ងៃឡើងស័ក')
  })
})

describe('cross-year consistency', () => {
  it('2025: Meak Feb 12, Visak May 11, Asalha Jul 10, Bon Om Touk Nov 4–6', () => {
    expect(fullMoonOf(2025, 3)).toEqual({ year: 2025, month: 2, day: 12 })
    expect(fullMoonOf(2025, 6)).toEqual({ year: 2025, month: 5, day: 11 })
    expect(fullMoonOf(2025, 8, false)).toEqual({ year: 2025, month: 7, day: 10 })
    expect(ev(2025, 11, 4)).toContain('ព្រះរាជពិធីបុណ្យអុំទូក')
    expect(ev(2025, 11, 6)).toContain('ព្រះរាជពិធីបុណ្យអុំទូក')
  })
  it('2024: Bon Om Touk Nov 14–16', () => {
    expect(ev(2024, 11, 14)).toContain('ព្រះរាជពិធីបុណ្យអុំទូក')
    expect(ev(2024, 11, 16)).toContain('ព្រះរាជពិធីបុណ្យអុំទូក')
  })
  it('Royal Ploughing (រោច ៤ ពិសាខ): 2023 May 8, 2024 May 26, 2025 May 15, 2027 May 24', () => {
    expect(ev(2023, 5, 8)).toContain('ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល')
    expect(ev(2024, 5, 26)).toContain('ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល')
    expect(ev(2025, 5, 15)).toContain('ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល')
    expect(ev(2027, 5, 24)).toContain('ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល')
  })
  it('2023: Meak Feb 5, Asalha Aug 1 (second eighth), Bon Om Touk Nov 26–28', () => {
    expect(fullMoonOf(2023, 3)).toEqual({ year: 2023, month: 2, day: 5 })
    expect(fullMoonOf(2023, 8, false)).toEqual({ year: 2023, month: 8, day: 1 })
    expect(ev(2023, 11, 26)).toContain('ព្រះរាជពិធីបុណ្យអុំទូក')
    expect(ev(2023, 11, 28)).toContain('ព្រះរាជពិធីបុណ្យអុំទូក')
  })
})

describe('year names & types', () => {
  it('BE 2568 = ឆ្នាំរោង ឆស័ក (Apr 2024)', () => {
    expect(khmerYearName(2568).full).toBe('ឆ្នាំរោង ឆស័ក')
  })
  it('BE 2569 = ឆ្នាំម្សាញ់ សប្តស័ក (Apr 2025)', () => {
    expect(khmerYearName(2569).full).toBe('ឆ្នាំម្សាញ់ សប្តស័ក')
  })
  it('BE 2570 = ឆ្នាំមមី អដ្ឋស័ក (Apr 2026)', () => {
    expect(khmerYearName(2570).full).toBe('ឆ្នាំមមី អដ្ឋស័ក')
  })
  it('year types: 2026=C, 2025=B, 2024=A, 2023=C', () => {
    expect(lunarYearType(2570, 'be')).toBe('C') // អធិកមាតិកា
    expect(lunarYearType(2569, 'be')).toBe('B') // អធិកវារៈ
    expect(lunarYearType(2568, 'be')).toBe('A')
    expect(lunarYearType(2567, 'be')).toBe('C')
  })
})

describe('formatting', () => {
  it('khmerNum converts digits', () => {
    expect(khmerNum(2569)).toBe('២៥៦៩')
    expect(khmerNum('2026')).toBe('២០២៦')
  })
  it('full moon ពិសាខ formats as កើត ១៥ ខែពិសាខ', () => {
    const l = gregorianToKhmerLunar(2026, 5, 1)
    expect(l.isFullMoon).toBe(true)
    expect(formatKhmerLunar(l)).toBe('កើត ១៥ ខែពិសាខ')
  })
})

describe('multi-badge days', () => {
  it('May 1 2026 carries Labour Day + Visak Bochea', () => {
    const events = [...lunarEventsFor(2026), ...Object.entries(SOLAR_EVENTS).map(([k, v]) => {
      const [m, d] = k.split('-').map(Number)
      return { y: 2026, m, d, t: v.t, k: v.k }
    })]
    const onMay1 = events.filter((e) => e.m === 5 && e.d === 1).map((e) => e.t)
    expect(onMay1).toContain('ទិវាពលកម្មអន្តរជាតិ')
    expect(onMay1).toContain('ពិធីបុណ្យវិសាខបូជា')
  })
  it('Oct 26 2026 (full moon អស្សុជ) carries ចេញវស្សា only; the ploughing ceremony is in May', () => {
    expect(ev(2026, 10, 26)).toContain('ចេញវស្សា')
    expect(ev(2026, 10, 26)).not.toContain('ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល')
  })
  it('May 5 2026 = រោច ៤ ពិសាខ and carries the Royal Ploughing Ceremony', () => {
    const l = gregorianToKhmerLunar(2026, 5, 5)
    expect(formatKhmerLunar(l)).toBe('រោច ៤ ខែពិសាខ')
    expect(ev(2026, 5, 5)).toContain('ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល')
  })
  it('dayKey helper', () => {
    expect(dayKey(5, 1)).toBe('5-1')
  })
})

describe('official public-holiday classification (2026 official list)', () => {
  const kind = (m: number, d: number) => SOLAR_EVENTS[dayKey(m, d)].k
  it('every official fixed-date 2026 public holiday is flagged holiday', () => {
    const official = [
      [1, 1], [1, 7], [3, 8], [5, 1], [5, 14],
      [6, 18], [9, 24], [10, 15], [10, 29], [11, 9], [12, 29],
    ] as const
    for (const [m, d] of official) expect(kind(m, d), dayKey(m, d)).toBe('holiday')
  })
  it('official lunar holidays (New Year, Visak, Ploughing, Pchum Ben, Water Festival) are holiday-typed', () => {
    const k = (m: number, d: number, t: string) => lunarEventsFor(2026).find((e) => e.m === m && e.d === d && e.t === t)?.k
    expect(k(4, 14, 'បុណ្យចូលឆ្នាំថ្មី — មហាសង្រ្កាន្ត')).toBe('holiday')
    expect(k(5, 1, 'ពិធីបុណ្យវិសាខបូជា')).toBe('holiday')
    expect(k(5, 5, 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល')).toBe('holiday')
    expect(k(10, 11, 'ពិធីបុណ្យភ្ជុំបិណ្ឌ')).toBe('holiday')
    expect(k(11, 24, 'ព្រះរាជពិធីបុណ្យអុំទូក')).toBe('holiday')
    expect(k(2, 2, 'ពិធីបុណ្យមាឃបូជា')).toBe('festival') // removed from the public-holiday list in 2020
  })
  it('Mar 3, May 20, Jun 1, Dec 10 are observances — not on the official public-holiday list since 2020', () => {
    expect(kind(3, 3)).toBe('heritage')
    expect(kind(5, 20)).toBe('heritage')
    expect(kind(6, 1)).toBe('heritage')
    expect(kind(12, 10)).toBe('heritage')
  })
})