<script setup lang="ts">
import {
  GREG_MONTHS, WEEKDAYS, SOLAR_EVENTS, dayKey, khmerNum, khmerYearName,
  khmerMonthNames, lunarYearType, gregorianToKhmerLunar, formatKhmerLunar,
  lunarEventsFor, type CalendarEvent,
} from '~/utils/khmer-calendar'

useHead({
  title: 'ប្រតិទិនខ្មែរ',
  meta: [
    { name: 'description', content: 'ប្រតិទិនខ្មែរ — ថ្ងៃខែតាមចន្ទគតិ បុណ្យទាន និងពិធីបុណ្យជាតិ។' },
  ],
})

const now = new Date()
const y = ref(now.getFullYear())
const m = ref(now.getMonth() + 1)

interface Cell {
  day: number
  lunar: string
  events: CalendarEvent[]
  isToday: boolean
  isEmpty: boolean
  moon: '' | 'full' | 'new'
  sel: boolean // ថ្ងៃសីល — Buddhist precept day
}

const title = computed(() => GREG_MONTHS[m.value - 1] + ' ' + khmerNum(y.value))

const lunarHead = computed(() => {
  const mid = gregorianToKhmerLunar(y.value, m.value, 15)
  const beYear = mid.isYearEndWrap ? mid.beYear + 2 : mid.beYear + 1
  const yname = khmerYearName(beYear)
  const yearType = lunarYearType(beYear, 'be')
  const typeLabel = yearType === 'C' ? 'ឆ្នាំអធិកមាតិកា (មានខែជាន់)'
    : yearType === 'B' ? 'ឆ្នាំអធិកវារៈ (មានថ្ងៃជាន់)'
    : 'ឆ្នាំធម្មតា'
  return [
    { text: yname.full, cls: 'lh-name' },
    { text: 'ព.ស. ' + khmerNum(beYear), cls: 'lh-be' },
    { text: typeLabel, cls: 'lh-type' },
    { text: 'ខែ' + khmerMonthNames[mid.month - 1], cls: 'lh-month' },
  ]
})

const cells = computed<Cell[]>(() => {
  const first = new Date(Date.UTC(y.value, m.value - 1, 1))
  const daysInMonth = new Date(Date.UTC(y.value, m.value, 0)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7 // Monday-first offset

  const events: Record<string, CalendarEvent[]> = {}
  const push = (key: string, ev: CalendarEvent) => {
    if (!events[key]) events[key] = []
    events[key].push(ev)
  }
  for (const key in SOLAR_EVENTS) push(key, SOLAR_EVENTS[key])
  for (const ev of lunarEventsFor(y.value)) push(dayKey(ev.m, ev.d), { t: ev.t, k: ev.k })

  const today = new Date()
  const out: Cell[] = []
  for (let i = 0; i < lead; i++) out.push({ day: 0, lunar: '', events: [], isToday: false, isEmpty: true, moon: '', sel: false })
  for (let d = 1; d <= daysInMonth; d++) {
    const lunar = gregorianToKhmerLunar(y.value, m.value, d)
    // Waning days run to 14 in a 29-day month and 15 in a 30-day month.
    const lastWaning = lunar.monthLengthDays - 15
    const isNew = lunar.phase === 'waning' && lunar.day === lastWaning
    out.push({
      day: d,
      lunar: formatKhmerLunar(lunar),
      events: events[dayKey(m.value, d)] || [],
      isToday: today.getFullYear() === y.value && today.getMonth() + 1 === m.value && today.getDate() === d,
      isEmpty: false,
      moon: lunar.isFullMoon ? 'full' : isNew ? 'new' : '',
      sel: lunar.day === 8 || lunar.isFullMoon || isNew,
    })
  }
  return out
})

// Flat, de-duplicated list of this month's events for the agenda below the grid.
const agenda = computed(() => cells.value
  .filter((c) => c.events.length)
  .flatMap((c) => c.events.map((ev) => ({ day: c.day, lunar: c.lunar, ...ev }))))

function shift(delta: number) {
  m.value += delta
  if (m.value < 1) { m.value = 12; y.value -= 1 }
  if (m.value > 12) { m.value = 1; y.value += 1 }
}
function goToday() {
  const t = new Date()
  y.value = t.getFullYear()
  m.value = t.getMonth() + 1
}
</script>

<template>
  <div class="cal-page">
    <PageHero
      img="/images/monks.jpg"
      icon="calendar"
      kicker="វដ្តនៃឆ្នាំ · ចន្ទគតិ និងសុរិយគតិ"
      title="ប្រតិទិនខ្មែរ"
      en="The Khmer lunisolar calendar"
      sub="ថ្ងៃខែតាមចន្ទគតិ ថ្ងៃសីល បុណ្យទាន និងថ្ងៃឈប់សម្រាកផ្លូវការ — គណនាតាមប្រព័ន្ធសុរិយយាត្រ ដូចដែលខ្មែរបានប្រើអស់ជាច្រើនសតវត្ស។"
    />

    <section class="cal-body">
      <div class="wrap">
        <div class="cal-toolbar">
          <button aria-label="ខែមុន" @click="shift(-1)">‹</button>
          <div class="cal-title-wrap">
            <div class="cal-title">{{ title }}</div>
            <div class="lunar-head">
              <span v-for="item in lunarHead" :key="item.cls" :class="item.cls">{{ item.text }}</span>
            </div>
          </div>
          <button aria-label="ខែបន្ទាប់" @click="shift(1)">›</button>
          <button class="today-btn" @click="goToday">ថ្ងៃនេះ</button>
        </div>

        <div class="cal-grid" data-reveal>
          <div v-for="wd in WEEKDAYS" :key="wd" class="cal-hd">{{ wd }}</div>
          <div v-for="(cell, i) in cells" :key="i" class="cal-cell" :class="{ empty: cell.isEmpty, today: cell.isToday }">
            <template v-if="!cell.isEmpty">
              <div class="g">
                {{ khmerNum(cell.day) }}
                <span v-if="cell.moon" class="moon" :class="cell.moon" :title="cell.moon === 'full' ? 'ពេញបូណ៌មី' : 'ងងឹតខែ'" />
                <span v-if="cell.sel" class="sel" title="ថ្ងៃសីល">សីល</span>
              </div>
              <div class="l">{{ cell.lunar }}</div>
              <div v-for="(ev, j) in cell.events" :key="j" class="ev" :class="ev.k">{{ ev.t }}</div>
            </template>
          </div>
        </div>

        <div class="cal-legend">
          <div class="lg"><span class="dot festival"/>បុណ្យទាន និងពិធីបុណ្យ</div>
          <div class="lg"><span class="dot holiday"/>ថ្ងៃឈប់សម្រាក និងពិធីជាតិ</div>
          <div class="lg"><span class="dot heritage"/>ទិវាបេតិកភណ្ឌ និងវប្បធម៌</div>
          <div class="lg"><span class="dot today"/>ថ្ងៃនេះ</div>
          <div class="lg"><span class="moon full"/>ពេញបូណ៌មី</div>
          <div class="lg"><span class="moon new"/>ងងឹតខែ</div>
          <div class="lg"><span class="sel">សីល</span>ថ្ងៃសីល</div>
        </div>

        <div v-if="agenda.length" class="agenda">
          <h2>ព្រឹត្តិការណ៍ក្នុងខែ{{ GREG_MONTHS[m - 1] }}</h2>
          <ul>
            <li v-for="(a, i) in agenda" :key="i" :class="a.k">
              <span class="a-day">{{ khmerNum(a.day) }}</span>
              <span class="a-t">{{ a.t }}</span>
              <span class="a-l">{{ a.lunar }}</span>
            </li>
          </ul>
        </div>

        <div class="cal-notes">
          <h2>កំណត់សម្គាល់</h2>
          <p>ថ្ងៃខែតាមចន្ទគតិ គណនាតាមប្រព័ន្ធសុរិយយាត្រ (Suriyayatra) ដែលផ្អែកលើការគណនារបស់ J.C. Eade ក្នុងសៀវភៅ «The Calendrical Systems of Mainland South-East Asia» (Brill, 1995)។ ឆ្នាំចន្ទគតិខ្មែរ ចាប់ផ្តើមនៅខែចេត្រ (ប្រហែលខែមេសា) — ដូច្នេះ ព.ស. ដែលបង្ហាញ ជាឆ្នាំចន្ទគតិដែលកំពុងរស់នៅក្នុងខែនោះ។</p>
          <p>ឆ្នាំអធិកមាតិកា ជាឆ្នាំដែលមានខែអាសាឍជាន់ (ខែទី ៨ ពីរដង) — ប្រហែលរៀងរាល់ ៣ ឆ្នាំម្តង។ ឆ្នាំអធិកវារៈ ជាឆ្នាំដែលមានថ្ងៃជាន់មួយថ្ងៃ។ កាលបរិច្ឆេទបុណ្យទាន អាចប្រែប្រួលមួយថ្ងៃ អាស្រ័យលើការប្រកាសផ្លូវការរបស់ព្រះសង្ឃរាជ និងរាជរដ្ឋាភិបាល។</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cal-page{min-height:100vh}
.cal-body{padding:56px 0 96px}
.cal-toolbar{display:flex;align-items:center;gap:18px;margin-bottom:26px;flex-wrap:wrap}
.cal-toolbar button{background:transparent;border:1px solid rgba(212,175,55,.35);color:var(--gold-2);font-family:var(--khmer);font-size:1.1rem;width:44px;height:44px;border-radius:var(--r-sm);cursor:pointer;transition:background .3s,color .3s}
.cal-toolbar button:hover{background:var(--gold);color:var(--night)}
.cal-toolbar .today-btn{width:auto;padding:0 18px;font-size:.85rem}
.cal-title-wrap{flex:1;min-width:260px}
.cal-title{font-family:var(--display);font-size:1.6rem;line-height:var(--lh-display);color:var(--ivory)}
.lunar-head{display:flex;gap:14px;align-items:baseline;flex-wrap:wrap;margin-top:8px}
.lunar-head .lh-name{font-family:var(--khmer);color:var(--gold-2);font-size:1rem}
.lunar-head .lh-be{font-family:var(--khmer);color:var(--ivory-dim);font-size:.85rem}
.lunar-head .lh-type{font-family:var(--khmer);color:var(--stone-3);font-size:.75rem}
.lunar-head .lh-month{font-family:var(--khmer);color:var(--stone);font-size:.85rem}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:34px}
.cal-hd{font-family:var(--khmer);font-size:.78rem;letter-spacing:.08em;color:var(--stone-3);text-align:center;padding:8px 0;border-bottom:1px solid rgba(212,175,55,.18)}
.cal-cell{min-height:112px;background:linear-gradient(180deg,rgba(30,51,38,.55),rgba(20,36,27,.55));border:1px solid rgba(201,168,124,.14);border-radius:var(--r-sm);padding:8px 10px;display:flex;flex-direction:column;gap:4px;transition:border-color .3s}
.cal-cell:hover{border-color:var(--gold-dim)}
.cal-cell.empty{background:transparent;border-color:transparent}
.cal-cell.today{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold),0 0 18px var(--gold-dim)}
.cal-cell .g{display:flex;align-items:center;gap:6px;font-family:var(--title);font-size:1.05rem;line-height:1.9;color:var(--ivory)}
.cal-cell .sel,.lg .sel{font-family:var(--khmer);font-size:.6rem;line-height:1.7;padding:0 5px;border-radius:var(--r-xs);border:1px solid var(--gold-dim);color:var(--gold-2);margin-left:auto}
.lg .sel{margin-left:0}
.moon{display:inline-block;width:11px;height:11px;border-radius:50%;flex:none}
.moon.full{background:radial-gradient(circle at 35% 35%,#fff8e0,var(--gold-2));box-shadow:0 0 10px rgba(232,201,106,.8)}
.moon.new{background:var(--night);border:1px solid var(--stone)}
.cal-cell .l{font-family:var(--khmer);font-size:.7rem;color:var(--stone);line-height:1.9}
.cal-cell .ev{font-family:var(--khmer);font-size:.68rem;line-height:1.85;color:var(--night);border-radius:var(--r-xs);padding:1px 6px}
.cal-cell .ev:first-of-type{margin-top:auto}
.cal-cell .ev.festival{background:var(--gold-2)}
.cal-cell .ev.holiday{background:var(--water)}
.cal-cell .ev.heritage{background:var(--stone-2)}
@media(max-width:760px){
  .cal-grid{grid-template-columns:repeat(7,1fr);gap:4px}
  .cal-cell{min-height:64px;padding:4px 5px}
  .cal-cell .l,.cal-cell .sel{display:none}
  .cal-cell .ev{font-size:0;height:6px;padding:0;border-radius:var(--r-xs)}
  .cal-hd{font-size:.62rem}
}
.cal-legend{display:flex;gap:26px;flex-wrap:wrap;padding:18px 0;border-top:1px solid rgba(212,175,55,.14);border-bottom:1px solid rgba(212,175,55,.14);margin-bottom:44px}
.cal-legend .lg{display:flex;align-items:center;gap:9px;font-family:var(--khmer);font-size:.8rem;color:var(--ivory-dim)}
.cal-legend .dot{width:12px;height:12px;border-radius:var(--r-xs);display:inline-block}
.cal-legend .dot.festival{background:var(--gold-2)}
.cal-legend .dot.holiday{background:var(--water)}
.cal-legend .dot.heritage{background:var(--stone-2)}
.cal-legend .dot.today{background:transparent;border:2px solid var(--gold)}
.agenda{margin-bottom:48px}
.agenda h2{font-family:var(--display);font-size:1.25rem;line-height:var(--lh-display);color:var(--gold-2);margin-bottom:12px}
.agenda ul{list-style:none;display:grid;gap:8px}
.agenda li{display:grid;grid-template-columns:52px 1fr auto;align-items:center;gap:14px;padding:8px 16px;border-radius:var(--r-sm);background:rgba(30,51,38,.4);border-left:3px solid var(--gold-2)}
.agenda li.holiday{border-left-color:var(--water)}
.agenda li.heritage{border-left-color:var(--stone-2)}
.a-day{font-family:var(--title);font-size:1.2rem;line-height:1.9;color:var(--gold-2)}
.a-t{font-family:var(--khmer);color:var(--ivory);line-height:1.9}
.a-l{font-family:var(--khmer);font-size:.8rem;color:var(--stone);line-height:1.9}
@media(max-width:600px){.agenda li{grid-template-columns:40px 1fr}.a-l{grid-column:2}}
.cal-notes h2{font-family:var(--display);font-size:1.2rem;line-height:var(--lh-display);color:var(--gold-2);margin-bottom:14px;letter-spacing:.03em}
.cal-notes p{font-family:var(--khmer);color:var(--ivory-dim);font-size:.92rem;line-height:2;margin-bottom:12px;max-width:860px}
</style>