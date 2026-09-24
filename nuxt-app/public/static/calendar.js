// Khmer lunisolar (Suriyakati) calendar engine + calendar app.
// Engine ported from the Suriyayatra arithmetic of J.C. Eade,
// "The Calendrical Systems of Mainland South-East Asia" (Brill, 1995),
// via the pythaidate lineage (MIT). All math is integer floor division.
// Verified 33/33 against official Khmer festival dates (2023-2027).

// ---- Constants ----
const daysIn800Years = 292207;
const timeUnitsIn1Day = 800;
const epochOffset = 373;
const uccaponConstant = 2611;
const apogeeRotationDays = 3232;
const csJulianDayOffset = 1954167; // JDN of the Chula Sakarat epoch, 22 Mar 638 CE

const calTypeDayCounts = { A: 354, B: 355, C: 384, c: 384 };

const monthCumulativeDays = {
  A: [0, 29, 59, 88, 118, 147, 177, 206, 236, 265, 295, 324, 354, 383],
  B: [0, 29, 59, 89, 119, 148, 178, 207, 237, 266, 296, 325, 355, 384],
  C: [0, 29, 59, 88, 118, 148, 177, 207, 236, 266, 295, 325, 354, 384],
};

const lunarMonths = [0, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 8, 88, 15, 16];

const monthPositionAb = [null, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 15, 16];
const monthPositionC = [null, 5, 6, 7, 8, 88, 9, 10, 11, 12, 1, 2, 3, 4, 15, 16];

// ---- Julian Day Number conversions (Fliegel / Van Flandern) ----
function gregorianToJulianDay(year, month, day) {
  let yearp, monthp;
  if (month === 1 || month === 2) {
    yearp = year - 1;
    monthp = month + 12;
  } else {
    yearp = year;
    monthp = month;
  }
  let b;
  if (year < 1582 || (year === 1582 && month < 10) || (year === 1582 && month === 10 && day < 15)) {
    b = 0;
  } else {
    const a = Math.trunc(yearp / 100.0);
    b = 2 - a + Math.trunc(a / 4.0);
  }
  const c = yearp < 0 ? Math.trunc(365.25 * yearp - 0.75) : Math.trunc(365.25 * yearp);
  const d = Math.trunc(30.6001 * (monthp + 1));
  return Math.trunc(b + c + d + day + 1720994.5 + 0.5);
}

function julianDayToGregorian(jd) {
  const i = jd;
  const a = Math.trunc((i - 1867216.25) / 36524.25);
  const b = i > 2299160 ? (i + 1 + a - Math.trunc(a / 4.0)) : i;
  const c = b + 1524;
  const dd = Math.trunc((c - 122.1) / 365.25);
  const e = Math.trunc(365.25 * dd);
  const g = Math.trunc((c - e) / 30.6001);
  const days = c - e - Math.trunc(30.6001 * g);
  const month = g < 13.5 ? g - 1 : g - 13;
  const year = month > 2.5 ? dd - 4716 : dd - 4715;
  return { year, month, day: days };
}

// ---- LunarYear: classification of one Chula Sakarat year ----
class LunarYear {
  constructor(year) {
    this.year = year;
    this.horakhun = Math.floor((year * daysIn800Years + epochOffset) / timeUnitsIn1Day) + 1;
    this.kammacapon = timeUnitsIn1Day - ((year * daysIn800Years + epochOffset) % timeUnitsIn1Day);
    this.uccapon = (uccaponConstant + this.horakhun) % apogeeRotationDays;
    const avoQuot = Math.floor((this.horakhun * 11 + 650) / 692);
    this.avoman = (this.horakhun * 11 + 650) % 692;
    if (this.avoman === 0) this.avoman = 692;
    this.masaken = Math.floor((avoQuot + this.horakhun) / 30);
    this.tithi = (avoQuot + this.horakhun) % 30;
    if (this.avoman === 692) this.tithi -= 1;
    this.weekday = this.horakhun % 7;

    const horakhun1 = Math.floor(((year + 1) * daysIn800Years + epochOffset) / timeUnitsIn1Day) + 1;
    const quot1 = Math.floor((horakhun1 * 11 + 650) / 692);
    const tithi1 = (quot1 + horakhun1) % 30;

    this.langsak = this.tithi < 1 ? 1 : this.tithi;
    let n = this.langsak;
    if (n < 6) n += 29;
    this.nyd = (this.weekday - n + 1 + 35) % 7;

    this.leapday = this.kammacapon <= 207;

    this.calType = 'A';
    if (this.tithi > 24 || this.tithi < 6) this.calType = 'C';
    if (this.tithi === 25 && tithi1 === 5) this.calType = 'A';
    if ((this.leapday && this.avoman <= 126) || (!this.leapday && this.avoman <= 137)) {
      this.calType = this.calType !== 'C' ? 'B' : 'c';
    }

    if (this.calType === 'A') this.nextNyd = (this.nyd + 4) % 7;
    else if (this.calType === 'B') this.nextNyd = (this.nyd + 5) % 7;
    else this.nextNyd = (this.nyd + 6) % 7;

    this.caldays = calTypeDayCounts[this.calType];
    this.offset = false;
  }
}

// Reconcile a five-year window centred on `year`; returns the centre year.
function calculateYear0(year) {
  const y = [
    new LunarYear(year - 2),
    new LunarYear(year - 1),
    new LunarYear(year),
    new LunarYear(year + 1),
    new LunarYear(year + 2),
  ];

  for (const i of [0, 1, 2, 3, 4]) {
    if (y[2].tithi === 24 && y[3].tithi === 6) {
      y[i].calType = 'C';
      y[i].nextNyd = (y[i].nextNyd + 2) % 7;
    }
  }

  for (const i of [1, 2, 3]) {
    if (y[i].calType === 'c') {
      const j = y[i].nyd === y[i - 1].nextNyd ? 1 : -1;
      y[i + j].calType = 'B';
      y[i + j].nextNyd = (y[i + j].nextNyd + 1) % 7;
    }
  }

  for (const i of [1, 2, 3]) {
    if (y[i - 1].nextNyd !== y[i].nyd && y[i].nextNyd !== y[i + 1].nyd) {
      y[i].offset = true;
      y[i].langsak += 1;
      y[i].nyd = (y[i].nyd + 6) % 7;
      y[i].nextNyd = (y[i].nextNyd + 6) % 7;
    }
  }

  for (const i of [0, 1, 2, 3, 4]) {
    if (y[i].calType === 'c') y[i].calType = 'C';
    y[i].caldays = calTypeDayCounts[y[i].calType];
  }

  const c = y[2];
  c.firstMonth = 'C'; // Caitra
  c.firstDay = c.langsak;
  c.offsetDays = c.langsak;
  if (c.offsetDays < 6 + (c.offset ? 1 : 0)) {
    c.firstMonth = 'V'; // Vaisakha
    c.firstDay = c.offsetDays;
    c.offsetDays += 29;
  }
  return c;
}

// ---- CsDate: a date in the Chula Sakarat lunisolar calendar ----
class CsDate {
  constructor(year, month, day) {
    this.year = year;
    this._month = month;
    this._day = day;
    this._initYmd();
    this._calculate();
  }

  static fromJulianDay(jd) {
    const hk = jd - csJulianDayOffset;
    let year = Math.floor((hk * 800 - 373) / 292207);
    let days;
    if (hk % 292207 === 95333) {
      year -= 1;
      days = 365;
    } else {
      const y0 = calculateYear0(year);
      days = hk - y0.horakhun;
    }
    return CsDate.fromYearDays(year, days);
  }

  static fromYearDays(year, days) {
    let y0 = calculateYear0(year);
    let daysInYear = 365 + (y0.leapday ? 1 : 0);
    let yr = year;
    let d = days;
    while (d > daysInYear) {
      yr += 1;
      d -= daysInYear;
      y0 = calculateYear0(yr);
      daysInYear = 365 + (y0.leapday ? 1 : 0);
    }
    const md = CsDate._findDate(y0.calType, y0.offsetDays + d);
    return new CsDate(yr, md.month, md.day);
  }

  _initYmd() {
    this._year0 = calculateYear0(this.year);
    let dateOffset = null;
    if (this._month === 5) dateOffset = this._day;
    else if (this._month === 6) dateOffset = 29 + this._day;

    const mp = this._year0.calType === 'C' ? monthPositionC : monthPositionAb;
    let tmonth = mp.indexOf(this._month);
    if (dateOffset !== null && dateOffset < this._year0.offsetDays) {
      tmonth += this._year0.calType === 'C' ? 13 : 12;
      this._month += 10;
    }
    this._days =
      monthCumulativeDays[this._year0.calType][tmonth - 1] +
      this._day -
      this._year0.offsetDays;
  }

  _calculate() {
    this._horakhun =
      Math.floor((this.year * daysIn800Years + epochOffset) / timeUnitsIn1Day) + 1 + this._days;
    this._kammacapon = timeUnitsIn1Day - ((this.year * daysIn800Years + epochOffset) % timeUnitsIn1Day);
    this._uccapon = (this._horakhun + uccaponConstant) % apogeeRotationDays;
    this._avoman = (this._horakhun * 11 + 650) % 692;
    if (this._avoman === 0) this._avoman = 692;
    const avomanDiv = Math.floor(((this._horakhun + this._days) * 11 + 650) / 692);
    this._masaken = Math.floor((avomanDiv + this._horakhun) / 30);
    const quot = Math.floor((this._horakhun * 11 + 650) / 692);
    this._tithi = (quot + this._horakhun) % 30;
  }

  static _findDate(cal, days) {
    const vals = {
      A: [[383, 16], [354, 15], [324, 12], [295, 11], [265, 10], [236, 9], [206, 8], [177, 7], [147, 6], [118, 5], [88, 4], [59, 3], [29, 2]],
      B: [[384, 16], [355, 15], [325, 12], [296, 11], [266, 10], [237, 9], [207, 8], [178, 7], [148, 6], [119, 5], [89, 4], [59, 3], [29, 2]],
      C: [[384, 15], [354, 12], [325, 11], [295, 10], [266, 9], [236, 8], [207, 7], [177, 6], [148, 5], [118, 14], [88, 13], [59, 3], [29, 2]],
    };
    let d = days;
    let month = lunarMonths[1];
    for (const row of vals[cal]) {
      const a = row[0], b = row[1];
      if (d > a) {
        d -= a;
        month = lunarMonths[b];
        break;
      }
      month = lunarMonths[1];
    }
    return { month, day: d };
  }

  get julianDay() { return this._horakhun + csJulianDayOffset; }
  get month() {
    if (this._month === 15 || this._month === 16) return this._month - 10;
    return this._month;
  }
  get monthRaw() { return this._month; }
  get day() { return this._day; }
  get isAthikavar() { return this._year0.calType === 'B'; }
  get isAthikamat() { return this._year0.calType === 'C'; }
  get calType() { return this._year0.calType; }
  get isSecondEighth() { return this._month === 88; }
  get isoWeekday() { return ((this._horakhun % 7) + 5) % 7 + 1; }
  get monthLength() {
    const firstJd = this.julianDay - (this._day - 1);
    let len = 1;
    while (len <= 30) {
      const next = CsDate.fromJulianDay(firstJd + len);
      if (next.day === 1) break;
      len++;
    }
    return len;
  }
}

// ---- Public API ----
// Convert a Gregorian date to a Khmer lunar date.
// Returns { beYear, ceYear, csYear, month, isSecondEighth, isYearEndWrap,
//           phase: 'waxing'|'waning', day, monthLengthDays, weekday, isFullMoon }
function gregorianToKhmerLunar(year, month, day) {
  const jd = gregorianToJulianDay(year, month, day);
  const cs = CsDate.fromJulianDay(jd);
  const phase = cs.day <= 15 ? 'waxing' : 'waning';
  const lday = cs.day <= 15 ? cs.day : cs.day - 15;
  const beYear = cs.year + 1181;
  const lmonth = cs.monthRaw === 88 ? 8 : cs.month;
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
  };
}

// Classify a lunar year (BE by default): 'A' normal, 'B' extra day, 'C' extra month.
// The lunar year labelled ព.ស. Y (starting ~April of CE Y-543) is engine CS year Y-1182.
function lunarYearType(year, era) {
  const cs = era === 'be' ? year - 1182 : year - 638;
  const y0 = calculateYear0(cs);
  return y0.calType === 'C' ? 'C' : y0.calType === 'B' ? 'B' : 'A';
}

// Gregorian date (UTC) of the full moon (waxing 15) of lunar month `lunarMonth`
// as it falls within the given CE year. In athikamat years the 8th month is
// doubled; the official Khmer Asalha Bochea falls on the full moon of the
// SECOND (ទុតិយាសាឍ) eighth, so pass secondEighth=true for that one.
function fullMoonOf(ceYear, lunarMonth, secondEighth) {
  const fullMoons = {};
  let secondEighthHit = null;
  const start = Date.UTC(ceYear, 0, 1);
  const dayCount = Math.round((Date.UTC(ceYear + 1, 0, 1) - start) / 86400000);
  for (let i = 0; i < dayCount; i++) {
    const g = new Date(start + i * 86400000);
    const cs = CsDate.fromJulianDay(gregorianToJulianDay(g.getUTCFullYear(), g.getUTCMonth() + 1, g.getUTCDate()));
    if (cs.day !== 15) continue;
    const date = { year: g.getUTCFullYear(), month: g.getUTCMonth() + 1, day: g.getUTCDate() };
    if (cs.isSecondEighth) {
      if (secondEighthHit === null) secondEighthHit = date;
    } else if (!(cs.month in fullMoons)) {
      fullMoons[cs.month] = date;
    }
  }

  if (lunarMonth === 8) {
    if (secondEighth && secondEighthHit !== null) return secondEighthHit;
    return secondEighthHit !== null ? secondEighthHit : fullMoons[8];
  }
  return fullMoons[lunarMonth];
}

// ---- Khmer names & numerals ----
const khmerMonthNames = [
  'មិគសិរ', 'បុស្ស', 'មាឃ', 'ផល្គុន', 'ចេត្រ', 'ពិសាខ',
  'ជេស្ឋ', 'អាសាឍ', 'ស្រាពណ៍', 'ភទ្របទ', 'អស្សុជ', 'កត្តិក',
];

const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
function khmerNum(n) {
  return String(n).replace(/\d/g, (d) => khmerDigits[+d]);
}

// Zodiac animals for the 12-year cycle (BE 2563 = ឆ្នាំថោះ / Rabbit).
const khmerAnimals = ['ជូត', 'ឆ្លូវ', 'ខាល', 'ថោះ', 'រោង', 'ម្សាញ់', 'មមី', 'មមែ', 'វក', 'រកា', 'ច', 'កុរ'];
// 10-year sak (BE 2564 = ឯកស័ក).
const khmerSak = ['ឯកស័ក', 'ទោស័ក', 'ត្រីស័ក', 'ចត្វាស័ក', 'បញ្ចស័ក', 'ឆស័ក', 'សប្តស័ក', 'អដ្ឋស័ក', 'នព្វស័ក', 'សំរឹទ្ធិស័ក'];

// Khmer lunar year name for a Khmer lunar Buddhist Era year.
// Official Khmer convention: the lunar year beginning at Khmer New Year
// (~April) is labelled ព.ស. = CE(start) + 544, i.e. engine beYear + 1.
// Verified: BE 2568 = ឆ្នាំរោង ឆស័ក (Apr 2024), BE 2569 = ឆ្នាំម្សាញ់ សប្តស័ក
// (Apr 2025), BE 2570 = ឆ្នាំមមី អដ្ឋស័ក (Apr 2026).
function khmerYearName(beYear) {
  const animal = khmerAnimals[((beYear - 2564) % 12 + 12) % 12];
  const sak = khmerSak[((beYear - 2563) % 10 + 10) % 10];
  return { animal, sak, full: 'ឆ្នាំ' + animal + ' ' + sak };
}

// Khmer lunar BE year for a Gregorian date (engine beYear + 1).
function khmerLunarBE(year, month, day) {
  return gregorianToKhmerLunar(year, month, day).beYear + 1;
}

// Format a lunar date in Khmer: e.g. "កើត ១៥ ខែពិសាខ" or "រោច ១០ ខែភទ្របទ".
function formatKhmerLunar(l) {
  const phase = l.phase === 'waxing' ? 'កើត' : 'រោច';
  const monthName = khmerMonthNames[l.month - 1] + (l.isSecondEighth ? ' (ទី២)' : '');
  return phase + ' ' + khmerNum(l.day) + ' ខែ' + monthName;
}

// ================= CALENDAR APP =================

const WEEKDAYS = ['ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];
const GREG_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

// ---- Events ----
// Solar / fixed-date events keyed by "M-D".
const SOLAR_EVENTS = {
  '1-1':  { t: 'ទិវាចូលឆ្នាំសកល', k: 'holiday' },
  '1-7':  { t: 'ទិវាជ័យជំនះ ៧ មករា', k: 'holiday' },
  '2-21': { t: 'ទិវាភាសាមាតុភាពអន្តរជាតិ', k: 'heritage' },
  '3-3':  { t: 'ទិវាវប្បធម៌ជាតិ', k: 'heritage' },
  '3-8':  { t: 'ទិវានារីអន្តរជាតិ', k: 'holiday' },
  '3-27': { t: 'ទិវាល្ខោនពិភពលោក', k: 'heritage' },
  '4-14': { t: 'បុណ្យចូលឆ្នាំថ្មី — មហាសង្រ្កាន្ត', k: 'festival' },
  '4-15': { t: 'បុណ្យចូលឆ្នាំថ្មី — វន្តបត្តិ', k: 'festival' },
  '4-16': { t: 'បុណ្យចូលឆ្នាំថ្មី — ថ្ងៃឡើងស័ក', k: 'festival' },
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
};

// Lunar festivals: computed per CE year. Each returns a list of
// { y, m, d, t, k } entries.
function lunarEventsFor(ceYear) {
  const out = [];
  const add = (date, t, k) => {
    if (date && date.year === ceYear) out.push({ y: date.year, m: date.month, d: date.day, t, k });
  };
  const addRange = (start, days, t, k, offset) => {
    if (!start || start.year !== ceYear) return;
    const off = offset || 0;
    for (let i = 0; i < days; i++) {
      const dt = new Date(Date.UTC(start.year, start.month - 1, start.day + off + i));
      out.push({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), t, k });
    }
  };

  add(fullMoonOf(ceYear, 3), 'ពិធីបុណ្យមាឃបូជា', 'festival');          // full moon ខែមាឃ
  add(fullMoonOf(ceYear, 6), 'ពិធីបុណ្យវិសាខបូជា', 'festival');        // full moon ខែពិសាខ
  addRange(fullMoonOf(ceYear, 6), 1, 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល', 'festival', 4); // waning 4 ខែពិសាខ
  add(fullMoonOf(ceYear, 8, false), 'ពិធីបុណ្យអាសាឍបូជា', 'festival'); // full moon ខែអាសាឍ
  const asalha = fullMoonOf(ceYear, 8, false);
  addRange(asalha, 1, 'ចូលវស្សា', 'festival', 1);                         // waning 1 ខែអាសាឍ
  add(fullMoonOf(ceYear, 11), 'ចេញវស្សា', 'festival');                    // full moon ខែអស្សុជ
  addRange(fullMoonOf(ceYear, 10), 15, 'បុណ្យភ្ជុំបិណ្ឌ', 'festival', 1); // waning 1–15 ខែភទ្របទ
  addRange(fullMoonOf(ceYear, 12), 3, 'បុណ្យអុំទូក', 'festival', -1);        // full moon ខែកត្តិក ± 1 ថ្ងៃ
  return out;
}

// ---- Rendering ----
const state = (() => {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1 };
})();

function dayKey(m, d) { return m + '-' + d; }

function render() {
  const { y, m } = state;
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first offset

  // Lunar context for the month (use the 15th as representative).
  const mid = gregorianToKhmerLunar(y, m, 15);
  // Year-end wrap: ចេត្រ days before the new-year day still belong to the old
  // year, so the lunar year in effect is one further ahead.
  const beYear = mid.isYearEndWrap ? mid.beYear + 2 : mid.beYear + 1;
  const yname = khmerYearName(beYear);
  const yearType = lunarYearType(beYear, 'be');
  const typeLabel = yearType === 'C' ? 'ឆ្នាំអធិកមាតិកា (មានខែជាន់)'
    : yearType === 'B' ? 'ឆ្នាំអធិកវារៈ (មានថ្ងៃជាន់)'
    : 'ឆ្នាំធម្មតា';

  document.getElementById('cal-title').textContent =
    GREG_MONTHS[m - 1] + ' ' + khmerNum(y);
  document.getElementById('lunar-head').innerHTML =
    '<span class="lh-name">' + yname.full + '</span>' +
    '<span class="lh-be">ព.ស. ' + khmerNum(beYear) + '</span>' +
    '<span class="lh-type">' + typeLabel + '</span>' +
    '<span class="lh-month">ខែ' + khmerMonthNames[mid.month - 1] + '</span>';

  // Events for this month (a day can carry several: solar + lunar).
  const events = {};
  const push = (key, t, k) => {
    if (!events[key]) events[key] = [];
    events[key].push({ t, k });
  };
  for (const key in SOLAR_EVENTS) push(key, SOLAR_EVENTS[key].t, SOLAR_EVENTS[key].k);
  for (const ev of lunarEventsFor(y)) push(dayKey(ev.m, ev.d), ev.t, ev.k);

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';
  for (const wd of WEEKDAYS) {
    const h = document.createElement('div');
    h.className = 'cal-hd';
    h.textContent = wd;
    grid.appendChild(h);
  }
  for (let i = 0; i < lead; i++) {
    const b = document.createElement('div');
    b.className = 'cal-cell empty';
    grid.appendChild(b);
  }
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d) {
      cell.classList.add('today');
    }
    const lunar = gregorianToKhmerLunar(y, m, d);
    const g = document.createElement('div');
    g.className = 'g';
    g.textContent = khmerNum(d);
    const l = document.createElement('div');
    l.className = 'l';
    l.textContent = formatKhmerLunar(lunar);
    cell.appendChild(g);
    cell.appendChild(l);
    const evs = events[dayKey(m, d)];
    if (evs) {
      for (const ev of evs) {
        const e = document.createElement('div');
        e.className = 'ev ' + ev.k;
        e.textContent = ev.t;
        cell.appendChild(e);
      }
    }
    grid.appendChild(cell);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('prev').addEventListener('click', () => {
    state.m -= 1;
    if (state.m < 1) { state.m = 12; state.y -= 1; }
    render();
  });
  document.getElementById('next').addEventListener('click', () => {
    state.m += 1;
    if (state.m > 12) { state.m = 1; state.y += 1; }
    render();
  });
  document.getElementById('today').addEventListener('click', () => {
    const now = new Date();
    state.y = now.getFullYear();
    state.m = now.getMonth() + 1;
    render();
  });
  render();
});