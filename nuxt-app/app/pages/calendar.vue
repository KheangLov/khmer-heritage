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

// The page is prerendered, so the server's "now" is the build date. Hydrate
// with those same values (useState carries them in the payload), then move to
// the reader's real today once mounted — no stale "today" left from the build.
const now = new Date()
const y = useState('cal-y', () => now.getFullYear())
const m = useState('cal-m', () => now.getMonth() + 1)
const today = ref<Date | null>(null)

interface Cell {
  day: number
  lunar: string
  short: string // "៨កើត" — for small screens
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

  const t = today.value
  const out: Cell[] = []
  for (let i = 0; i < lead; i++) out.push({ day: 0, lunar: '', short: '', events: [], isToday: false, isEmpty: true, moon: '', sel: false })
  for (let d = 1; d <= daysInMonth; d++) {
    const lunar = gregorianToKhmerLunar(y.value, m.value, d)
    // Waning days run to 14 in a 29-day month and 15 in a 30-day month.
    const lastWaning = lunar.monthLengthDays - 15
    const isNew = lunar.phase === 'waning' && lunar.day === lastWaning
    out.push({
      day: d,
      lunar: formatKhmerLunar(lunar),
      short: khmerNum(lunar.day) + (lunar.phase === 'waxing' ? 'កើត' : 'រោច'),
      events: events[dayKey(m.value, d)] || [],
      isToday: !!t && t.getFullYear() === y.value && t.getMonth() + 1 === m.value && t.getDate() === d,
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

// ---------- selected day (tap a day: its full details show below the grid) ----------
const selDay = useState('cal-d', () => now.getDate())
onMounted(() => {
  const t = new Date()
  today.value = t
  y.value = t.getFullYear()
  m.value = t.getMonth() + 1
  selDay.value = t.getDate()
})
const inThisMonth = () => { const t = new Date(); return t.getFullYear() === y.value && t.getMonth() + 1 === m.value }
const selCell = computed(() => cells.value.find((c) => !c.isEmpty && c.day === selDay.value) ?? null)
const selWeekday = computed(() => WEEKDAYS[(new Date(Date.UTC(y.value, m.value - 1, selDay.value)).getUTCDay() + 6) % 7])
// the next event on or after the selected day, for a day with none of its own
const nextEvent = computed(() => agenda.value.find((a) => a.day > selDay.value) ?? null)

// ---------- month navigation: arrows, swipe, month picker ----------
const dir = ref(1) // slide direction of the month change
function shift(delta: number) {
  dir.value = delta
  m.value += delta
  if (m.value < 1) { m.value = 12; y.value -= 1 }
  if (m.value > 12) { m.value = 1; y.value += 1 }
  selDay.value = inThisMonth() ? new Date().getDate() : 1
}
function goToday() {
  const t = new Date()
  dir.value = t.getFullYear() * 12 + t.getMonth() + 1 >= y.value * 12 + m.value ? 1 : -1
  y.value = t.getFullYear()
  m.value = t.getMonth() + 1
  selDay.value = t.getDate()
}
const monthInput = ref<HTMLInputElement | null>(null)
const monthValue = computed(() => `${y.value}-${String(m.value).padStart(2, '0')}`)
function pickMonth() {
  const el = monthInput.value
  if (!el) return
  try { el.showPicker() } catch { el.focus() }
}
function onMonthPicked(e: Event) {
  const [yy, mm] = (e.target as HTMLInputElement).value.split('-').map(Number)
  if (!yy || !mm) return
  dir.value = yy * 12 + mm >= y.value * 12 + m.value ? 1 : -1
  y.value = yy
  m.value = mm
  selDay.value = inThisMonth() ? new Date().getDate() : 1
}
// swipe left / right on the grid changes month (a mostly-horizontal flick)
let touch: { x: number; y: number } | null = null
function onTouchStart(e: TouchEvent) { const t = e.touches[0]; touch = t ? { x: t.clientX, y: t.clientY } : null }
function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!touch || !t) return
  const dx = t.clientX - touch.x
  const dy = t.clientY - touch.y
  touch = null
  if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.5) shift(dx < 0 ? 1 : -1)
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
          <button class="nav" aria-label="ខែមុន" @click="shift(-1)"><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6" /></svg></button>
          <div class="cal-title-wrap">
            <button class="cal-title" title="ជ្រើសខែ" @click="pickMonth">
              {{ title }}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <input ref="monthInput" type="month" class="month-input" :value="monthValue" tabindex="-1" aria-hidden="true" @change="onMonthPicked">
            <div class="lunar-head">
              <span v-for="item in lunarHead" :key="item.cls" :class="item.cls">{{ item.text }}</span>
            </div>
          </div>
          <button class="nav" aria-label="ខែបន្ទាប់" @click="shift(1)"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg></button>
          <button class="today-btn" @click="goToday">ថ្ងៃនេះ</button>
        </div>

        <div class="cal-hds" aria-hidden="true"><div v-for="wd in WEEKDAYS" :key="wd" class="cal-hd">{{ wd }}</div></div>
        <div class="cal-swipe" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
          <Transition :name="dir > 0 ? 'cal-next' : 'cal-prev'" mode="out-in">
            <div :key="monthValue" class="cal-grid">
              <template v-for="(cell, i) in cells" :key="i">
                <div v-if="cell.isEmpty" class="cal-cell empty" />
                <button
                  v-else class="cal-cell" :class="{ today: cell.isToday, picked: cell.day === selDay }"
                  :aria-pressed="cell.day === selDay" :aria-label="`${khmerNum(cell.day)} ${GREG_MONTHS[m - 1]} · ${cell.lunar}${cell.events.length ? ' · ' + cell.events.map((e) => e.t).join(', ') : ''}`"
                  @click="selDay = cell.day"
                >
                  <span class="g">
                    <span class="num">{{ khmerNum(cell.day) }}</span>
                    <span v-if="cell.moon" class="moon" :class="cell.moon" :title="cell.moon === 'full' ? 'ពេញបូណ៌មី' : 'ងងឹតខែ'" />
                    <span v-if="cell.sel" class="sel" title="ថ្ងៃសីល">សីល</span>
                  </span>
                  <span class="l">{{ cell.lunar }}</span>
                  <span class="ls">{{ cell.short }}</span>
                  <span v-for="(ev, j) in cell.events" :key="j" class="ev" :class="ev.k">{{ ev.t }}</span>
                  <span v-if="cell.events.length" class="dots"><i v-for="(ev, j) in cell.events" :key="j" :class="ev.k" /></span>
                </button>
              </template>
            </div>
          </Transition>
        </div>

        <!-- the tapped day -->
        <section v-if="selCell" class="day-card" aria-live="polite">
          <div class="d-num" :class="{ today: selCell.isToday }">{{ khmerNum(selCell.day) }}</div>
          <div class="d-body">
            <div class="d-date">ថ្ងៃ{{ selWeekday }} · {{ khmerNum(selCell.day) }} {{ GREG_MONTHS[m - 1] }} {{ khmerNum(y) }}<span v-if="selCell.isToday" class="d-today">ថ្ងៃនេះ</span></div>
            <div class="d-lunar">
              <span v-if="selCell.moon" class="moon" :class="selCell.moon" />{{ selCell.lunar }}
              <span v-if="selCell.sel" class="sel">ថ្ងៃសីល</span>
            </div>
            <ul v-if="selCell.events.length" class="d-events">
              <li v-for="(ev, j) in selCell.events" :key="j" :class="ev.k">{{ ev.t }}</li>
            </ul>
            <p v-else-if="nextEvent" class="d-next">
              គ្មានបុណ្យថ្ងៃនេះ · បន្ទាប់៖ <button @click="selDay = nextEvent.day">{{ nextEvent.t }} ({{ khmerNum(nextEvent.day) }} {{ GREG_MONTHS[m - 1] }})</button>
            </p>
          </div>
        </section>

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
.cal-toolbar{display:flex;align-items:center;gap:14px;margin-bottom:22px;flex-wrap:wrap}
.cal-toolbar button{background:transparent;border:1px solid rgba(212,175,55,.35);color:var(--gold-2);font-family:var(--khmer);cursor:pointer;transition:background .25s,color .25s}
.cal-toolbar .nav{display:grid;place-items:center;width:44px;height:44px;border-radius:var(--r-sm)}
.cal-toolbar .nav svg,.cal-title svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.cal-toolbar .nav:hover,.cal-toolbar .today-btn:hover{background:var(--gold);color:var(--night)}
.cal-toolbar .today-btn{height:44px;padding:0 18px;font-size:.85rem;border-radius:var(--r-pill)}
.cal-title-wrap{flex:1;min-width:240px;position:relative}
.cal-title{display:inline-flex;align-items:center;gap:6px;border:0!important;padding:0;background:none!important;font-family:var(--display)!important;font-size:1.6rem;line-height:var(--lh-display);color:var(--ivory)!important}
.cal-title svg{color:var(--gold-2);opacity:.8}
.month-input{position:absolute;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none}
.lunar-head{display:flex;gap:6px 14px;align-items:baseline;flex-wrap:wrap;margin-top:4px}
.lunar-head .lh-name{font-family:var(--khmer);color:var(--gold-2);font-size:1rem}
.lunar-head .lh-be{font-family:var(--khmer);color:var(--ivory-dim);font-size:.85rem}
.lunar-head .lh-type{font-family:var(--khmer);color:var(--stone-3);font-size:.75rem}
.lunar-head .lh-month{font-family:var(--khmer);color:var(--stone);font-size:.85rem}

.cal-hds,.cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.cal-hds{margin-bottom:8px}
.cal-hd{font-family:var(--khmer);font-size:.78rem;letter-spacing:.04em;color:var(--stone-3);text-align:center;padding:6px 0;border-bottom:1px solid rgba(212,175,55,.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cal-swipe{margin-bottom:18px;touch-action:pan-y}
.cal-cell{min-height:112px;min-width:0;text-align:left;font:inherit;color:inherit;cursor:pointer;background:linear-gradient(180deg,rgba(30,51,38,.55),rgba(20,36,27,.55));border:1px solid rgba(201,168,124,.14);border-radius:var(--r-sm);padding:8px 10px;display:flex;flex-direction:column;gap:4px;transition:border-color .25s,background .25s}
.cal-cell:hover{border-color:var(--gold-dim)}
.cal-cell:focus-visible{outline:2px solid var(--gold-2);outline-offset:2px}
.cal-cell.empty{background:transparent;border-color:transparent;cursor:default}
.cal-cell.picked{border-color:var(--gold-2);background:linear-gradient(180deg,rgba(212,175,55,.16),rgba(30,51,38,.6))}
.cal-cell.today{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold),0 0 18px var(--gold-dim)}
.cal-cell .g{display:flex;align-items:center;gap:6px;font-family:var(--title);font-size:1.05rem;line-height:1.9;color:var(--ivory)}
.cal-cell .sel,.lg .sel,.d-lunar .sel{font-family:var(--khmer);font-size:.6rem;line-height:1.7;padding:0 5px;border-radius:var(--r-xs);border:1px solid var(--gold-dim);color:var(--gold-2);margin-left:auto}
.lg .sel{margin-left:0}
.moon{display:inline-block;width:11px;height:11px;border-radius:50%;flex:none}
.moon.full{background:radial-gradient(circle at 35% 35%,#fff8e0,var(--gold-2));box-shadow:0 0 10px rgba(232,201,106,.8)}
.moon.new{background:var(--night);border:1px solid var(--stone)}
.cal-cell .l{font-family:var(--khmer);font-size:.7rem;color:var(--stone);line-height:1.9}
.cal-cell .ls,.cal-cell .dots{display:none}
.cal-cell .ev{font-family:var(--khmer);font-size:.68rem;line-height:1.85;color:var(--night);border-radius:var(--r-xs);padding:1px 6px}
.cal-cell .ev:first-of-type{margin-top:auto}
.cal-cell .ev.festival,.dots .festival,.d-events .festival::before{background:var(--gold-2)}
.cal-cell .ev.holiday,.dots .holiday,.d-events .holiday::before{background:var(--water)}
.cal-cell .ev.heritage,.dots .heritage,.d-events .heritage::before{background:var(--stone-2)}

/* month change: the grid slides in the direction you moved */
.cal-next-enter-active,.cal-next-leave-active,.cal-prev-enter-active,.cal-prev-leave-active{transition:opacity .18s var(--ease),transform .18s var(--ease)}
.cal-next-enter-from,.cal-prev-leave-to{opacity:0;transform:translateX(24px)}
.cal-next-leave-to,.cal-prev-enter-from{opacity:0;transform:translateX(-24px)}

/* the tapped day */
.day-card{display:flex;gap:16px;align-items:flex-start;padding:16px 18px;margin-bottom:30px;border-radius:var(--r-lg);border:1px solid rgba(212,175,55,.28);background:linear-gradient(135deg,rgba(212,175,55,.1),rgba(30,51,38,.55))}
.d-num{flex:none;width:58px;height:58px;display:grid;place-items:center;border-radius:var(--r-md);font-family:var(--title);font-size:1.6rem;line-height:1;color:var(--gold-2);border:1px solid var(--gold-dim);background:rgba(10,17,13,.5)}
.d-num.today{background:linear-gradient(180deg,var(--gold-2),var(--gold));color:var(--night);border-color:transparent}
.d-body{min-width:0;display:flex;flex-direction:column;gap:4px}
.d-date{font-family:var(--title);font-size:1.05rem;line-height:1.9;color:var(--ivory)}
.d-today{margin-left:8px;font-family:var(--khmer);font-size:.7rem;padding:1px 8px;border-radius:var(--r-pill);background:var(--gold-2);color:var(--night);vertical-align:middle}
.d-lunar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:var(--khmer);font-size:.9rem;line-height:1.9;color:var(--gold-2)}
.d-lunar .sel{margin-left:0}
.d-events{list-style:none;display:flex;flex-direction:column;gap:4px;margin-top:4px}
.d-events li{display:flex;align-items:center;gap:8px;font-family:var(--khmer);font-size:.92rem;line-height:1.9;color:var(--ivory)}
.d-events li::before{content:"";flex:none;width:10px;height:10px;border-radius:var(--r-xs)}
.d-next{font-family:var(--khmer);font-size:.84rem;line-height:1.9;color:var(--stone)}
.d-next button{font:inherit;color:var(--gold-2);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}

/* ---- phones: compact grid, details live in the day card ---- */
@media (max-width:760px){
  .cal-body{padding:28px 0 72px}
  .cal-body .wrap{padding:0 12px}
  .cal-toolbar{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;gap:8px;margin-bottom:14px}
  .cal-title-wrap{min-width:0;text-align:center}
  .cal-title{font-size:1.25rem;justify-content:center}
  .lunar-head{justify-content:center;gap:2px 10px}
  .lunar-head .lh-name{font-size:.86rem}
  .lunar-head .lh-be,.lunar-head .lh-month{font-size:.76rem}
  .lunar-head .lh-type{font-size:.68rem;flex-basis:100%;text-align:center}
  .cal-toolbar .today-btn{grid-column:1 / -1;justify-self:center;height:36px;font-size:.8rem}
  .cal-hds,.cal-grid{gap:4px}
  .cal-hd{font-size:.62rem;letter-spacing:0;padding:4px 0}
  .cal-cell{min-height:62px;padding:4px 3px 5px;gap:1px;align-items:center;text-align:center;border-radius:var(--r-xs)}
  .cal-cell .g{flex-direction:column;gap:0;font-size:1rem;line-height:1.5}
  .cal-cell .g .moon{position:absolute;margin:2px 0 0 26px;width:7px;height:7px;box-shadow:none}
  .cal-cell{position:relative}
  .cal-cell .l,.cal-cell .sel,.cal-cell .ev{display:none}
  .cal-cell .ls{display:block;font-family:var(--khmer);font-size:.56rem;line-height:1.7;color:var(--stone);white-space:nowrap}
  .cal-cell .dots{display:flex;gap:3px;margin-top:auto}
  .cal-cell .dots i{width:6px;height:6px;border-radius:50%}
  .cal-cell.today .num{color:var(--gold-2)}
  .day-card{padding:12px 14px;gap:12px;margin-bottom:22px}
  .d-num{width:48px;height:48px;font-size:1.35rem}
  .d-date{font-size:.95rem}
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