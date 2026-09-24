// Khmer lunisolar (Suriyakati) calendar engine.
// Ported from the Suriyayatra arithmetic of J.C. Eade,
// "The Calendrical Systems of Mainland South-East Asia" (Brill, 1995),
// via the pythaidate lineage (MIT). All math is integer floor division.
// Verified against official Khmer festival dates (2023-2027) and the
// Mekong University calendar anchor (18 Dec 2025 = រោច ១៣ ខែមិគសិរ).

// ---- Constants ----
const daysIn800Years = 292207
const timeUnitsIn1Day = 800
const epochOffset = 373
const uccaponConstant = 2611
const apogeeRotationDays = 3232
const csJulianDayOffset = 1954167 // JDN of the Chula Sakarat epoch, 22 Mar 638 CE

const calTypeDayCounts: Record<string, number> = { A: 354, B: 355, C: 384, c: 384 }

const monthCumulativeDays: Record<string, number[]> = {
  A: [0, 29, 59, 88, 118, 147, 177, 206, 236, 265, 295, 324, 354, 383],
  B: [0, 29, 59, 89, 119, 148, 178, 207, 237, 266, 296, 325, 355, 384],
  C: [0, 29, 59, 88, 118, 148, 177, 207, 236, 266, 295, 325, 354, 384],
}

const lunarMonths = [0, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 8, 88, 15, 16]

const monthPositionAb = [null, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 15, 16]
const monthPositionC = [null, 5, 6, 7, 8, 88, 9, 10, 11, 12, 1, 2, 3, 4, 15, 16]

// ---- Julian Day Number conversions (Fliegel / Van Flandern) ----
export function gregorianToJulianDay(year: number, month: number, day: number): number {
  let yearp: number, monthp: number
  if (month === 1 || month === 2) {
    yearp = year - 1
    monthp = month + 12
  } else {
    yearp = year
    monthp = month
  }
  let b: number
  if (year < 1582 || (year === 1582 && month < 10) || (year === 1582 && month === 10 && day < 15)) {
    b = 0
  } else {
    const a = Math.trunc(yearp / 100.0)
    b = 2 - a + Math.trunc(a / 4.0)
  }
  const c = yearp < 0 ? Math.trunc(365.25 * yearp - 0.75) : Math.trunc(365.25 * yearp)
  const d = Math.trunc(30.6001 * (monthp + 1))
  return Math.trunc(b + c + d + day + 1720994.5 + 0.5)
}

export function julianDayToGregorian(jd: number): { year: number; month: number; day: number } {
  const i = jd
  const a = Math.trunc((i - 1867216.25) / 36524.25)
  const b = i > 2299160 ? (i + 1 + a - Math.trunc(a / 4.0)) : i
  const c = b + 1524
  const dd = Math.trunc((c - 122.1) / 365.25)
  const e = Math.trunc(365.25 * dd)
  const g = Math.trunc((c - e) / 30.6001)
  const days = c - e - Math.trunc(30.6001 * g)
  const month = g < 13.5 ? g - 1 : g - 13
  const year = month > 2.5 ? dd - 4716 : dd - 4715
  return { year, month, day: days }
}

// ---- LunarYear: classification of one Chula Sakarat year ----
export class LunarYear {
  year: number
  horakhun: number
  kammacapon: number
  uccapon: number
  avoman: number
  masaken: number
  tithi: number
  weekday: number
  langsak: number
  nyd: number
  leapday: boolean
  calType: string
  nextNyd: number
  caldays: number
  offset: boolean
  firstMonth?: string
  firstDay?: number
  offsetDays?: number

  constructor(year: number) {
    this.year = year
    this.horakhun = Math.floor((year * daysIn800Years + epochOffset) / timeUnitsIn1Day) + 1
    this.kammacapon = timeUnitsIn1Day - ((year * daysIn800Years + epochOffset) % timeUnitsIn1Day)
    this.uccapon = (uccaponConstant + this.horakhun) % apogeeRotationDays
    const avoQuot = Math.floor((this.horakhun * 11 + 650) / 692)
    this.avoman = (this.horakhun * 11 + 650) % 692
    if (this.avoman === 0) this.avoman = 692
    this.masaken = Math.floor((avoQuot + this.horakhun) / 30)
    this.tithi = (avoQuot + this.horakhun) % 30
    if (this.avoman === 692) this.tithi -= 1
    this.weekday = this.horakhun % 7

    const horakhun1 = Math.floor(((year + 1) * daysIn800Years + epochOffset) / timeUnitsIn1Day) + 1
    const quot1 = Math.floor((horakhun1 * 11 + 650) / 692)
    const tithi1 = (quot1 + horakhun1) % 30

    this.langsak = this.tithi < 1 ? 1 : this.tithi
    let n = this.langsak
    if (n < 6) n += 29
    this.nyd = (this.weekday - n + 1 + 35) % 7

    this.leapday = this.kammacapon <= 207

    this.calType = 'A'
    if (this.tithi > 24 || this.tithi < 6) this.calType = 'C'
    if (this.tithi === 25 && tithi1 === 5) this.calType = 'A'
    if ((this.leapday && this.avoman <= 126) || (!this.leapday && this.avoman <= 137)) {
      this.calType = this.calType !== 'C' ? 'B' : 'c'
    }

    if (this.calType === 'A') this.nextNyd = (this.nyd + 4) % 7
    else if (this.calType === 'B') this.nextNyd = (this.nyd + 5) % 7
    else this.nextNyd = (this.nyd + 6) % 7

    this.caldays = calTypeDayCounts[this.calType]
    this.offset = false
  }
}

// Reconcile a five-year window centred on `year`; returns the centre year.
function calculateYear0(year: number): LunarYear {
  const y = [
    new LunarYear(year - 2),
    new LunarYear(year - 1),
    new LunarYear(year),
    new LunarYear(year + 1),
    new LunarYear(year + 2),
  ]

  for (const i of [0, 1, 2, 3, 4]) {
    if (y[2].tithi === 24 && y[3].tithi === 6) {
      y[i].calType = 'C'
      y[i].nextNyd = (y[i].nextNyd + 2) % 7
    }
  }

  for (const i of [1, 2, 3]) {
    if (y[i].calType === 'c') {
      const j = y[i].nyd === y[i - 1].nextNyd ? 1 : -1
      y[i + j].calType = 'B'
      y[i + j].nextNyd = (y[i + j].nextNyd + 1) % 7
    }
  }

  for (const i of [1, 2, 3]) {
    if (y[i - 1].nextNyd !== y[i].nyd && y[i].nextNyd !== y[i + 1].nyd) {
      y[i].offset = true
      y[i].langsak += 1
      y[i].nyd = (y[i].nyd + 6) % 7
      y[i].nextNyd = (y[i].nextNyd + 6) % 7
    }
  }

  for (const i of [0, 1, 2, 3, 4]) {
    if (y[i].calType === 'c') y[i].calType = 'C'
    y[i].caldays = calTypeDayCounts[y[i].calType]
  }

  const c = y[2]
  c.firstMonth = 'C' // Caitra
  c.firstDay = c.langsak
  c.offsetDays = c.langsak
  if (c.offsetDays < 6 + (c.offset ? 1 : 0)) {
    c.firstMonth = 'V' // Vaisakha
    c.firstDay = c.offsetDays
    c.offsetDays += 29
  }
  return c
}

// ---- CsDate: a date in the Chula Sakarat lunisolar calendar ----
export class CsDate {
  year: number
  private _month: number
  private _day: number
  private _year0!: LunarYear
  private _days!: number
  private _horakhun!: number
  private _kammacapon!: number
  private _uccapon!: number
  private _avoman!: number
  private _masaken!: number
  private _tithi!: number

  constructor(year: number, month: number, day: number) {
    this.year = year
    this._month = month
    this._day = day
    this._initYmd()
    this._calculate()
  }

  static fromJulianDay(jd: number): CsDate {
    const hk = jd - csJulianDayOffset
    let year = Math.floor((hk * 800 - 373) / 292207)
    let days: number
    if (hk % 292207 === 95333) {
      year -= 1
      days = 365
    } else {
      const y0 = calculateYear0(year)
      days = hk - y0.horakhun
    }
    return CsDate.fromYearDays(year, days)
  }

  static fromYearDays(year: number, days: number): CsDate {
    let y0 = calculateYear0(year)
    let daysInYear = 365 + (y0.leapday ? 1 : 0)
    let yr = year
    let d = days
    while (d > daysInYear) {
      yr += 1
      d -= daysInYear
      y0 = calculateYear0(yr)
      daysInYear = 365 + (y0.leapday ? 1 : 0)
    }
    const md = CsDate._findDate(y0.calType, y0.offsetDays! + d)
    return new CsDate(yr, md.month, md.day)
  }

  private _initYmd() {
    this._year0 = calculateYear0(this.year)
    let dateOffset: number | null = null
    if (this._month === 5) dateOffset = this._day
    else if (this._month === 6) dateOffset = 29 + this._day

    const mp = this._year0.calType === 'C' ? monthPositionC : monthPositionAb
    let tmonth = mp.indexOf(this._month)
    if (dateOffset !== null && dateOffset < this._year0.offsetDays!) {
      tmonth += this._year0.calType === 'C' ? 13 : 12
      this._month += 10
    }
    this._days =
      monthCumulativeDays[this._year0.calType][tmonth - 1] +
      this._day -
      this._year0.offsetDays!
  }

  private _calculate() {
    this._horakhun =
      Math.floor((this.year * daysIn800Years + epochOffset) / timeUnitsIn1Day) + 1 + this._days
    this._kammacapon = timeUnitsIn1Day - ((this.year * daysIn800Years + epochOffset) % timeUnitsIn1Day)
    this._uccapon = (this._horakhun + uccaponConstant) % apogeeRotationDays
    this._avoman = (this._horakhun * 11 + 650) % 692
    if (this._avoman === 0) this._avoman = 692
    const avomanDiv = Math.floor(((this._horakhun + this._days) * 11 + 650) / 692)
    this._masaken = Math.floor((avomanDiv + this._horakhun) / 30)
    const quot = Math.floor((this._horakhun * 11 + 650) / 692)
    this._tithi = (quot + this._horakhun) % 30
  }

  static _findDate(cal: string, days: number): { month: number; day: number } {
    const vals: Record<string, number[][]> = {
      A: [[383, 16], [354, 15], [324, 12], [295, 11], [265, 10], [236, 9], [206, 8], [177, 7], [147, 6], [118, 5], [88, 4], [59, 3], [29, 2]],
      B: [[384, 16], [355, 15], [325, 12], [296, 11], [266, 10], [237, 9], [207, 8], [178, 7], [148, 6], [119, 5], [89, 4], [59, 3], [29, 2]],
      C: [[384, 15], [354, 12], [325, 11], [295, 10], [266, 9], [236, 8], [207, 7], [177, 6], [148, 5], [118, 14], [88, 13], [59, 3], [29, 2]],
    }
    let d = days
    let month = lunarMonths[1]
    for (const row of vals[cal]) {
      const a = row[0], b = row[1]
      if (d > a) {
        d -= a
        month = lunarMonths[b]
        break
      }
      month = lunarMonths[1]
    }
    return { month, day: d }
  }

  get julianDay(): number { return this._horakhun + csJulianDayOffset }
  get month(): number {
    if (this._month === 15 || this._month === 16) return this._month - 10
    return this._month
  }
  get monthRaw(): number { return this._month }
  get day(): number { return this._day }
  get isAthikavar(): boolean { return this._year0.calType === 'B' }
  get isAthikamat(): boolean { return this._year0.calType === 'C' }
  get calType(): string { return this._year0.calType }
  get isSecondEighth(): boolean { return this._month === 88 }
  get isoWeekday(): number { return ((this._horakhun % 7) + 5) % 7 + 1 }
  get monthLength(): number {
    const firstJd = this.julianDay - (this._day - 1)
    let len = 1
    while (len <= 30) {
      const next = CsDate.fromJulianDay(firstJd + len)
      if (next.day === 1) break
      len++
    }
    return len
  }
}

// ---- Public API ----
export interface KhmerLunarDate {
  beYear: number
  ceYear: number
  csYear: number
  month: number
  isSecondEighth: boolean
  isYearEndWrap: boolean
  phase: 'waxing' | 'waning'
  day: number
  monthLengthDays: number
  weekday: number
  isFullMoon: boolean
}

// Convert a Gregorian date to a Khmer lunar date.
export function gregorianToKhmerLunar(year: number, month: number, day: number): KhmerLunarDate {
  const jd = gregorianToJulianDay(year, month, day)
  const cs = CsDate.fromJulianDay(jd)
  const phase: 'waxing' | 'waning' = cs.day <= 15 ? 'waxing' : 'waning'
  const lday = cs.day <= 15 ? cs.day : cs.day - 15
  const beYear = cs.year + 1181
  const lmonth = cs.monthRaw === 88 ? 8 : cs.month
  return {
    beYear,
    ceYear: beYear - 543,
    csYear: beYear - 1181,
    month: lmonth,
    isSecondEighth: cs.isSecondEighth,
    isYearEndWrap: cs.monthRaw === 15 || cs.monthRaw === 16,
    phase,
    day: lday,
    monthLengthDays: cs.monthLength,
    weekday: cs.isoWeekday,
    isFullMoon: phase === 'waxing' && lday === 15,
  }
}

// Classify a lunar year (BE by default): 'A' normal, 'B' extra day, 'C' extra month.
// The lunar year labelled ព.ស. Y (starting ~April of CE Y-543) is engine CS year Y-1182.
export function lunarYearType(year: number, era: 'be' | 'ce' = 'be'): 'A' | 'B' | 'C' {
  const cs = era === 'be' ? year - 1182 : year - 638
  const y0 = calculateYear0(cs)
  return y0.calType === 'C' ? 'C' : y0.calType === 'B' ? 'B' : 'A'
}

export interface GregorianDate { year: number; month: number; day: number }

// Gregorian date (UTC) of the full moon (waxing 15) of lunar month `lunarMonth`
// as it falls within the given CE year. In athikamat years the 8th month is
// doubled; the official Khmer Asalha Bochea falls on the full moon of the
// SECOND (ទុតិយាសាឍ) eighth, so pass secondEighth=true for that one.
export function fullMoonOf(ceYear: number, lunarMonth: number, secondEighth = false): GregorianDate | undefined {
  const fullMoons: Record<number, GregorianDate> = {}
  let secondEighthHit: GregorianDate | null = null
  const start = Date.UTC(ceYear, 0, 1)
  const dayCount = Math.round((Date.UTC(ceYear + 1, 0, 1) - start) / 86400000)
  for (let i = 0; i < dayCount; i++) {
    const g = new Date(start + i * 86400000)
    const cs = CsDate.fromJulianDay(gregorianToJulianDay(g.getUTCFullYear(), g.getUTCMonth() + 1, g.getUTCDate()))
    if (cs.day !== 15) continue
    const date: GregorianDate = { year: g.getUTCFullYear(), month: g.getUTCMonth() + 1, day: g.getUTCDate() }
    if (cs.isSecondEighth) {
      if (secondEighthHit === null) secondEighthHit = date
    } else if (!(cs.month in fullMoons)) {
      fullMoons[cs.month] = date
    }
  }

  if (lunarMonth === 8) {
    if (secondEighth && secondEighthHit !== null) return secondEighthHit
    return secondEighthHit !== null ? secondEighthHit : fullMoons[8]
  }
  return fullMoons[lunarMonth]
}

// ---- Khmer names & numerals ----
export const khmerMonthNames = [
  'មិគសិរ', 'បុស្ស', 'មាឃ', 'ផល្គុន', 'ចេត្រ', 'ពិសាខ',
  'ជេស្ឋ', 'អាសាឍ', 'ស្រាពណ៍', 'ភទ្របទ', 'អស្សុជ', 'កត្តិក',
]

const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
export function khmerNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => khmerDigits[+d])
}

// Zodiac animals for the 12-year cycle (BE 2563 = ឆ្នាំថោះ / Rabbit).
const khmerAnimals = ['ជូត', 'ឆ្លូវ', 'ខាល', 'ថោះ', 'រោង', 'ម្សាញ់', 'មមី', 'មមែ', 'វក', 'រកា', 'ច', 'កុរ']
// 10-year sak (BE 2564 = ឯកស័ក).
const khmerSak = ['ឯកស័ក', 'ទោស័ក', 'ត្រីស័ក', 'ចត្វាស័ក', 'បញ្ចស័ក', 'ឆស័ក', 'សប្តស័ក', 'អដ្ឋស័ក', 'នព្វស័ក', 'សំរឹទ្ធិស័ក']

export interface YearName { animal: string; sak: string; full: string }

// Khmer lunar year name for a Khmer lunar Buddhist Era year.
// Official Khmer convention: the lunar year beginning at Khmer New Year
// (~April) is labelled ព.ស. = CE(start) + 544, i.e. engine beYear + 1.
// Verified: BE 2568 = ឆ្នាំរោង ឆស័ក (Apr 2024), BE 2569 = ឆ្នាំម្សាញ់ សប្តស័ក
// (Apr 2025), BE 2570 = ឆ្នាំមមី អដ្ឋស័ក (Apr 2026).
export function khmerYearName(beYear: number): YearName {
  const animal = khmerAnimals[((beYear - 2564) % 12 + 12) % 12]
  const sak = khmerSak[((beYear - 2563) % 10 + 10) % 10]
  return { animal, sak, full: 'ឆ្នាំ' + animal + ' ' + sak }
}

// Khmer lunar BE year for a Gregorian date (engine beYear + 1).
export function khmerLunarBE(year: number, month: number, day: number): number {
  return gregorianToKhmerLunar(year, month, day).beYear + 1
}

// Format a lunar date in Khmer: e.g. "កើត ១៥ ខែពិសាខ" or "រោច ១០ ខែភទ្របទ".
export function formatKhmerLunar(l: KhmerLunarDate): string {
  const phase = l.phase === 'waxing' ? 'កើត' : 'រោច'
  const monthName = khmerMonthNames[l.month - 1] + (l.isSecondEighth ? ' (ទី២)' : '')
  return phase + ' ' + khmerNum(l.day) + ' ខែ' + monthName
}

// ---- Calendar app data ----
export const WEEKDAYS = ['ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ']
export const GREG_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']

export interface CalendarEvent { t: string; k: 'festival' | 'holiday' | 'heritage' }

// Solar / fixed-date events keyed by "M-D".
export const SOLAR_EVENTS: Record<string, CalendarEvent> = {
  '1-1':  { t: 'ទិវាចូលឆ្នាំសកល', k: 'holiday' },
  '1-7':  { t: 'ទិវាជ័យជំនះ ៧ មករា', k: 'holiday' },
  '2-21': { t: 'ទិវាភាសាមាតុភាពអន្តរជាតិ', k: 'heritage' },
  '3-3':  { t: 'ទិវាវប្បធម៌ជាតិ', k: 'heritage' },
  '3-8':  { t: 'ទិវានារីអន្តរជាតិ', k: 'holiday' },
  '3-27': { t: 'ទិវាល្ខោនពិភពលោក', k: 'heritage' },
  '4-18': { t: 'ទិវាបេតិកភណ្ឌពិភពលោក', k: 'heritage' },
  '4-29': { t: 'ទិវារបាំអន្តរជាតិ', k: 'heritage' },
  '5-1':  { t: 'ទិវាពលកម្មអន្តរជាតិ', k: 'holiday' },
  '5-14': { t: 'ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្មព្រះមហាក្សត្រ', k: 'holiday' },
  '5-18': { t: 'ទិវាសារមន្ទីរអន្តរជាតិ', k: 'heritage' },
  '5-20': { t: 'ទិវារំលឹកវិញ្ញាណក្ខន្ធ (២០ ឧសភា)', k: 'heritage' },
  '6-1':  { t: 'ទិវាកុមារអន្តរជាតិ', k: 'heritage' },
  '6-18': { t: 'ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្មព្រះមហាវីរក្សត្រី', k: 'holiday' },
  '6-21': { t: 'ទិវាតន្ត្រីពិភពលោក', k: 'heritage' },
  '9-8':  { t: 'ទិវាអក្ខរកម្មអន្តរជាតិ', k: 'heritage' },
  '9-24': { t: 'ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ', k: 'holiday' },
  '10-15': { t: 'ព្រះរាជពិធីបុណ្យអនុស្សាវរីយ៍ព្រះបរមសពព្រះបាទសម្តេចព្រះនរោត្តមសីហនុ', k: 'holiday' },
  '10-29': { t: 'ព្រះរាជពិធីបុណ្យគ្រងរាជសម្បត្តិព្រះមហាក្សត្រ', k: 'holiday' },
  '11-9': { t: 'ទិវាបុណ្យឯករាជ្យជាតិ', k: 'holiday' },
  '12-10': { t: 'ទិវាសិទ្ធិមនុស្សអន្តរជាតិ', k: 'heritage' },
  '12-29': { t: 'ទិវាសន្តិភាព (២៩ ធ្នូ)', k: 'holiday' },
}

export interface LunarEvent { y: number; m: number; d: number; t: string; k: CalendarEvent['k'] }

// Khmer New Year (Sangkran). The start day follows the sun's entry into
// Aries as announced each year by the Ministry of Cults & Religion, so it is
// usually Apr 14–16 but some years start on Apr 13 with two វារៈវ័នបត days.
// Known official announcements are listed; other years default to Apr 14–16.
const NEW_YEAR_OVERRIDES: Record<number, { start: number; days: number }> = {
  2024: { start: 13, days: 4 }, // 13 មហាសង្រ្កាន្ត · 14–15 វារៈវ័នបត · 16 ឡើងស័ក
}
export function newYearFor(ceYear: number): LunarEvent[] {
  const { start, days } = NEW_YEAR_OVERRIDES[ceYear] ?? { start: 14, days: 3 }
  return Array.from({ length: days }, (_, i) => ({
    y: ceYear, m: 4, d: start + i, k: 'holiday' as const,
    t: 'បុណ្យចូលឆ្នាំថ្មី — ' + (i === 0 ? 'មហាសង្រ្កាន្ត' : i === days - 1 ? 'ថ្ងៃឡើងស័ក' : 'វារៈវ័នបត'),
  }))
}

// Lunar festivals: computed per CE year. `k: 'holiday'` marks the days on the
// official public-holiday list (sub-decree); the rest are religious observances.
export function lunarEventsFor(ceYear: number): LunarEvent[] {
  const out: LunarEvent[] = []
  // Push `t` on the day `offset` days after `base` (a full moon), for `days` days.
  const addRange = (base: GregorianDate | undefined, days: number, t: string | ((i: number) => string), k: LunarEvent['k'], offset = 0) => {
    if (!base) return
    for (let i = 0; i < days; i++) {
      const dt = new Date(Date.UTC(base.year, base.month - 1, base.day + offset + i))
      if (dt.getUTCFullYear() !== ceYear) continue
      out.push({ y: ceYear, m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), t: typeof t === 'string' ? t : t(i), k })
    }
  }

  addRange(fullMoonOf(ceYear, 3), 1, 'ពិធីបុណ្យមាឃបូជា', 'festival')             // កើត ១៥ ខែមាឃ
  const visakha = fullMoonOf(ceYear, 6)
  addRange(visakha, 1, 'ពិធីបុណ្យវិសាខបូជា', 'holiday')                           // កើត ១៥ ខែពិសាខ
  addRange(visakha, 1, 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល', 'holiday', 4)                 // រោច ៤ ខែពិសាខ
  const asalha = fullMoonOf(ceYear, 8, true)
  addRange(asalha, 1, 'ពិធីបុណ្យអាសាឍបូជា', 'festival')                           // កើត ១៥ ខែអាសាឍ
  addRange(asalha, 1, 'ចូលវស្សា', 'festival', 1)                                   // រោច ១ ខែអាសាឍ
  // Pchum Ben: ១៤ ថ្ងៃកាន់បិណ្ឌ (រោច ១–១៤ ខែភទ្របទ), ភ្ជុំបិណ្ឌ on រោច ១៥;
  // the 3-day public holiday is រោច ១៤ – កើត ១ ខែអស្សុជ.
  // ខែភទ្របទ is an even (30-day) month, so full moon + 15 is always រោច ១៥.
  const bhadrapada = fullMoonOf(ceYear, 10)
  addRange(bhadrapada, 14, (i) => 'កាន់បិណ្ឌ ទី' + khmerNum(i + 1), 'festival', 1)
  addRange(bhadrapada, 1, 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', 'holiday', 15)
  addRange(bhadrapada, 1, 'ថ្ងៃឈប់សម្រាកភ្ជុំបិណ្ឌ', 'holiday', 14)
  addRange(bhadrapada, 1, 'ថ្ងៃឈប់សម្រាកភ្ជុំបិណ្ឌ', 'holiday', 16)
  addRange(fullMoonOf(ceYear, 11), 1, 'ចេញវស្សា', 'festival')                      // កើត ១៥ ខែអស្សុជ
  addRange(fullMoonOf(ceYear, 12), 3, 'ព្រះរាជពិធីបុណ្យអុំទូក', 'holiday', -1) // កើត ១៤ – រោច ១ ខែកត្តិក
  out.push(...newYearFor(ceYear))
  return out
}

export function dayKey(m: number, d: number): string { return m + '-' + d }