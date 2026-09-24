<script setup lang="ts">
import { PLACES, HERITAGE_PLACES, type PlaceView } from '~/data/places'
import { khmerNum } from '~/utils/khmer-calendar'
import type * as GeoJSON from 'geojson'
import { useTempleFilters, loadTemples, loadProvinces, loadDistricts, loadCommunes, templeName, type TempleRow } from '~/composables/useTemples'

useHead({
  title: 'ផែនទីប្រាសាទ និងប្រវត្តិសាស្ត្រ',
  meta: [{ name: 'description', content: 'ប្រាសាទប្រវត្តិសាស្ត្រទូទាំងប្រទេសកម្ពុជា លើផែនទីតែមួយ — ស្វែងរកតាមខេត្ត ស្រុក ឃុំ ភូមិ មើលប្រវត្តិ ចម្ងាយ និងទិសដៅ។' }],
})

// Curated places (with photos, notes and timeline links) stay pinned on top.
const featured: PlaceView[] = Object.values(PLACES).map((p) => ({
  ...p, note: Object.values(HERITAGE_PLACES).flat().find((l) => l.id === p.id && l.note)?.note,
}))

const f = useTempleFilters()
const { q, kind, province, district, commune, village, provinceOptions, districtOptions, communeOptions, villageOptions, results, ready } = f
const filtered = computed(() => !!(province.value || q.value.trim() || kind.value !== 'all'))

// Featured places are hidden while an admin/type filter is on (they carry no admin codes).
const shownPlaces = computed(() => filtered.value ? [] : featured)

// Long result lists render in pages of 40 — cheap to scroll, instant to filter.
const PAGE = 40
const shown = ref(PAGE)
watch(results, () => { shown.value = PAGE })
const visibleRows = computed(() => results.value.slice(0, shown.value))

// ---------- selected admin unit → boundary outline on the map ----------
const boundary = shallowRef<GeoJSON.Feature | null>(null)
watch([province, district, commune], async ([p, d, m]) => {
  if (m && d) boundary.value = (await loadCommunes(d)).features.find((x) => x.properties.c === m) ?? null
  else if (d) boundary.value = (await loadDistricts()).features.find((x) => x.properties.c === d) ?? null
  else if (p) boundary.value = (await loadProvinces()).features.find((x) => x.properties.c === p) ?? null
  else boundary.value = null
})

// ---------- selection & URL sync ----------
const router = useRouter()
const focus = ref('')
const hoverId = ref('')
const mapRef = ref<{ select: (id: string) => void } | null>(null)

// Restore a shared link once the app is hydrated. /map is prerendered, and a
// prerendered page hydrates at the route it was rendered at — while mounting,
// both useRoute().query and window.location lack the query string; Nuxt puts
// the real URL back afterwards.
onNuxtReady(async () => {
  const qy = Object.fromEntries(new URLSearchParams(window.location.search))
  if (qy.q) q.value = qy.q
  if (qy.kind && ['prasat', 'wat', 'history'].includes(qy.kind)) kind.value = qy.kind as typeof kind.value
  // Level by level: each level's watcher clears the ones below it.
  for (const [r, key] of [[province, 'province'], [district, 'district'], [commune, 'commune'], [village, 'village']] as const) {
    if (!qy[key]) break
    await nextTick()
    r.value = qy[key]
  }
  if (qy.place) {
    // a temple id resolves only once the index is in
    await loadTemples().catch(() => {})
    await nextTick()
    focus.value = qy.place
  }
})
// Mirror filters into the URL (shareable links) — debounced, so typing does
// not push a router navigation per keystroke.
let urlTimer: ReturnType<typeof setTimeout> | undefined
watch([q, kind, province, district, commune, village, focus], () => {
  clearTimeout(urlTimer)
  urlTimer = setTimeout(syncUrl, 300)
})
onBeforeUnmount(() => clearTimeout(urlTimer))
function syncUrl() {
  const query: Record<string, string> = {}
  if (q.value.trim()) query.q = q.value.trim()
  if (kind.value !== 'all') query.kind = kind.value
  if (province.value) query.province = province.value
  if (district.value) query.district = district.value
  if (commune.value) query.commune = commune.value
  if (village.value) query.village = village.value
  if (focus.value) query.place = focus.value
  router.replace({ query })
}

// ---------- fullscreen: panel + map together ----------
// The map's fullscreen button enlarges this whole section, so search and the
// list stay usable. The panel floats over the map (desktop) or becomes a bottom
// sheet (phone), and folds away to a tab to give the map the whole screen.
const appEl = ref<HTMLElement | null>(null)
const fs = ref(false)
const panelOpen = ref(true)
const wide = ref(true)
let mq: MediaQueryList | null = null
const onMq = (e: MediaQueryListEvent) => { wide.value = e.matches }
onMounted(() => {
  mq = matchMedia('(min-width: 901px)')
  wide.value = mq.matches
  mq.addEventListener('change', onMq)
})
onBeforeUnmount(() => mq?.removeEventListener('change', onMq))
// Desktop opens with the panel beside the map; a phone opens on the map, with
// the list one tap away.
watch(fs, (on) => { panelOpen.value = !on || wide.value })
// What the panel (or its tab) covers on the map's left, for the map's own UI.
const mapInset = computed(() => !fs.value ? 0 : wide.value ? (panelOpen.value ? 398 : 76) : 64)

function pick(id: string) {
  focus.value = id
  mapRef.value?.select(id)
  if (fs.value) {
    // on a phone the sheet would cover the temple's card
    if (!wide.value) panelOpen.value = false
    return
  }
  if (window.innerWidth < 900) document.querySelector('.stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
// Keep the chosen row visible — scrolling the list only (desktop), never the page.
function onMapSelect(id: string) {
  focus.value = id
  const i = results.value.findIndex((r) => r.id === id)
  if (i >= shown.value) shown.value = i + 10
  nextTick(() => {
    const list = document.querySelector<HTMLElement>('.list')
    const item = document.querySelector<HTMLElement>(`[data-place="${CSS.escape(id)}"]`)
    if (window.innerWidth < 900 || !list || !item) return
    list.scrollTo({ top: item.offsetTop - list.offsetTop - list.clientHeight / 3, behavior: 'smooth' })
  })
}
function clearAll() { f.reset(); focus.value = '' }

const kinds = [
  { id: 'all', name: 'ទាំងអស់' },
  { id: 'prasat', name: 'ប្រាសាទបុរាណ' },
  { id: 'wat', name: 'វត្តប្រវត្តិសាស្ត្រ' },
  { id: 'history', name: 'មានអត្ថបទលម្អិត' },
] as const
const rowSub = (t: TempleRow) => [t.en && t.en !== t.km ? t.en : '', t.y].filter(Boolean).join(' · ')
</script>

<template>
  <div class="map-page">
    <header class="head wrap">
      <div>
        <div class="kicker"><KhmerIcon name="pin" :size="18" />ទីតាំង · ប្រវត្តិ · ទិសដៅ</div>
        <h1 data-ink>ផែនទីប្រាសាទកម្ពុជា</h1>
      </div>
      <p class="lead">ប្រាសាទប្រវត្តិសាស្ត្រ {{ ready ? khmerNum(f.temples.value.length) : '…' }} កន្លែង ទូទាំងប្រទេស — ស្វែងរកតាមខេត្ត ស្រុក ឃុំ ភូមិ ហើយចុចលើប្រាសាទនីមួយៗ ដើម្បីមើលទីតាំង និងអានប្រវត្តិ។</p>
    </header>

    <section ref="appEl" class="app wrap" :class="{ fs, 'panel-closed': fs && !panelOpen }">
      <button v-if="fs && !panelOpen" class="panel-tab" aria-controls="map-panel" aria-expanded="false" title="បង្ហាញបញ្ជីប្រាសាទ" @click="panelOpen = true">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
        <span class="n">{{ khmerNum(results.length) }}</span>
      </button>
      <aside id="map-panel" class="side" :inert="fs && !panelOpen ? true : undefined">
        <div v-if="fs" class="side-head">
          <span class="grip" aria-hidden="true" />
          <span class="side-title"><KhmerIcon name="temple" :size="20" />ស្វែងរកប្រាសាទ</span>
          <button class="side-x" :title="wide ? 'បង្រួមបញ្ជី' : 'បិទបញ្ជី'" :aria-label="wide ? 'បង្រួមបញ្ជី' : 'បិទបញ្ជី'" aria-controls="map-panel" aria-expanded="true" @click="panelOpen = false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path v-if="wide" d="m15 6-6 6 6 6" /><path v-else d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>
        <label class="search">
          <KhmerIcon name="compass" :size="18" />
          <input v-model="q" type="search" placeholder="ស្វែងរកប្រាសាទ… (ខ្មែរ ឬ English)" aria-label="ស្វែងរកប្រាសាទ">
        </label>

        <div class="kinds" role="radiogroup" aria-label="ប្រភេទ">
          <button v-for="k in kinds" :key="k.id" role="radio" :aria-checked="kind === k.id" :class="{ on: kind === k.id }" @click="kind = k.id">{{ k.name }}</button>
        </div>

        <div class="cascade">
          <label>
            <span>ខេត្ត / រាជធានី</span>
            <select v-model="province">
              <option value="">ទាំងអស់</option>
              <option v-for="o in provinceOptions" :key="o.c" :value="o.c">{{ o.km }} ({{ khmerNum(o.n) }})</option>
            </select>
          </label>
          <label>
            <span>ស្រុក / ខណ្ឌ</span>
            <select v-model="district" :disabled="!province">
              <option value="">ទាំងអស់</option>
              <option v-for="o in districtOptions" :key="o.c" :value="o.c">{{ o.km }} ({{ khmerNum(o.n) }})</option>
            </select>
          </label>
          <label>
            <span>ឃុំ / សង្កាត់</span>
            <select v-model="commune" :disabled="!district">
              <option value="">ទាំងអស់</option>
              <option v-for="o in communeOptions" :key="o.c" :value="o.c">{{ o.km }} ({{ khmerNum(o.n) }})</option>
            </select>
          </label>
          <label>
            <span>ភូមិ <em>(ប្រហែល)</em></span>
            <select v-model="village" :disabled="!commune || !villageOptions.length">
              <option value="">{{ commune && !villageOptions.length ? 'គ្មានទិន្នន័យភូមិ' : 'ទាំងអស់' }}</option>
              <option v-for="o in villageOptions" :key="o.km" :value="o.km">{{ o.km }} ({{ khmerNum(o.n) }})</option>
            </select>
          </label>
        </div>

        <div class="count">
          <span>{{ khmerNum(results.length) }} ប្រាសាទ<template v-if="!filtered"> · {{ khmerNum(featured.length) }} ទីតាំងសំខាន់</template></span>
          <button v-if="filtered" class="clear" @click="clearAll">សម្អាតតម្រង ×</button>
        </div>

        <ul class="list">
          <template v-if="!filtered">
            <li class="group">ទីតាំងសំខាន់</li>
            <li v-for="p in featured" :key="p.id">
              <button :data-place="p.id" :class="{ on: p.id === focus }" @click="pick(p.id)">
                <span class="thumb">
                  <NuxtImg v-if="p.img" :src="p.img" alt="" width="104" height="104" format="webp" loading="lazy" />
                  <KhmerIcon v-else :name="p.icon" :size="26" />
                </span>
                <span class="txt">
                  <span class="nm">{{ p.name }}</span>
                  <span class="sub">{{ p.en }} · {{ p.province }}</span>
                </span>
                <KhmerIcon :name="p.icon" :size="20" class="ic" />
              </button>
            </li>
            <li class="group">ប្រាសាទទូទាំងប្រទេស</li>
          </template>
          <li v-for="t in visibleRows" :key="t.id" @mouseenter="hoverId = t.id" @mouseleave="hoverId = ''">
            <button :data-place="t.id" :class="{ on: t.id === focus }" @click="pick(t.id)">
              <span class="thumb"><KhmerIcon :name="t.c === 'wat' ? 'stupa' : 'temple'" :size="28" /></span>
              <span class="txt">
                <span class="nm">{{ templeName(t) }}</span>
                <span class="sub">{{ rowSub(t) || (t.c === 'wat' ? 'វត្តប្រវត្តិសាស្ត្រ' : 'ប្រាសាទបុរាណ') }}</span>
              </span>
              <span v-if="t.h" class="badge" title="មានអត្ថបទប្រវត្តិលម្អិតពីវិគីភីឌា">អត្ថបទ</span>
            </button>
          </li>
          <li v-if="shown < results.length" class="more">
            <button @click="shown += PAGE">បង្ហាញបន្ថែម ({{ khmerNum(results.length - shown) }})</button>
          </li>
          <li v-if="ready && !results.length" class="empty">
            <KhmerIcon name="compass" :size="34" />
            រកមិនឃើញប្រាសាទក្នុងតំបន់នេះទេ — សូមជ្រើសតំបន់ធំជាងនេះ។
          </li>
        </ul>
        <p class="src">ទិន្នន័យ៖ OpenStreetMap · Wikidata · Wikipedia · ព្រំដែនរដ្ឋបាល HDX · ភូមិ «ប្រហែល» = ភូមិជិតបំផុតដែលឈ្មោះត្រូវនឹងបញ្ជីផ្លូវការ។</p>
      </aside>

      <div class="stage">
        <ClientOnly>
          <PlaceMap ref="mapRef" :places="shownPlaces" :temples="results" :focus="focus" :boundary="boundary" :hover-id="hoverId" :fs-target="appEl" :inset="mapInset" full @select="onMapSelect" @fullscreen="fs = $event" />
          <template #fallback><div class="map-fallback" /></template>
        </ClientOnly>
      </div>
    </section>
  </div>
</template>

<style scoped>
.map-page{padding-top:92px;min-height:100vh}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;padding-top:14px;padding-bottom:16px}
.kicker{display:flex;align-items:center;gap:8px;font-family:var(--khmer);font-size:.85rem;color:var(--gold-2);line-height:1.9}
h1{font-family:var(--display);font-size:clamp(1.7rem,3.6vw,2.5rem);color:var(--ivory);line-height:var(--lh-display)}
.lead{font-family:var(--khmer);color:var(--ivory-dim);font-size:.92rem;line-height:2;max-width:560px}

.app{display:grid;grid-template-columns:370px minmax(0,1fr);gap:18px;height:calc(100vh - 116px);min-height:620px;max-width:1560px;padding-bottom:36px}
.stage{min-width:0;height:100%}
.map-fallback{height:100%;border-radius:var(--r-xl);background:var(--moss-3)}

.side{display:flex;flex-direction:column;min-height:0;min-width:0;border:1px solid rgba(212,175,55,.18);border-radius:var(--r-xl);background:linear-gradient(180deg,rgba(30,51,38,.6),rgba(14,24,18,.75));padding:14px}
.search{display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:var(--r-md);border:1px solid rgba(212,175,55,.25);background:rgba(10,17,13,.6);color:var(--gold-2)}
.search input{flex:1;min-width:0;background:none;border:0;outline:0;color:var(--ivory);font-family:var(--khmer);font-size:.9rem;line-height:1.9}
.search input::placeholder{color:var(--stone-3)}
.search:focus-within{border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,175,55,.15)}

.kinds{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.kinds button{font-family:var(--khmer);font-size:.78rem;line-height:1.8;padding:2px 12px;border-radius:var(--r-pill);border:1px solid rgba(212,175,55,.22);background:none;color:var(--ivory-dim);cursor:pointer;transition:all .2s}
.kinds button.on,.kinds button:hover{background:rgba(212,175,55,.16);border-color:var(--gold);color:var(--gold-2)}

.cascade{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cascade label{display:flex;flex-direction:column;gap:2px;min-width:0}
.cascade span{font-family:var(--khmer);font-size:.7rem;line-height:1.8;color:var(--stone)}
.cascade em{font-style:normal;color:var(--stone-3)}
.cascade select{width:100%;min-width:0;font-family:var(--khmer);font-size:.82rem;line-height:1.9;color:var(--ivory);background:rgba(10,17,13,.6) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23E8C96A' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center/14px;border:1px solid rgba(212,175,55,.22);border-radius:var(--r-sm);padding:4px 30px 4px 10px;appearance:none;cursor:pointer;text-overflow:ellipsis}
.cascade select:disabled{opacity:.45;cursor:not-allowed}
.cascade select:focus{outline:0;border-color:var(--gold)}
.cascade option{background:#0F1A14}

.count{display:flex;justify-content:space-between;align-items:center;font-family:var(--khmer);font-size:.78rem;color:var(--stone);line-height:1.9;margin:10px 2px 6px}
.clear{font-family:var(--khmer);font-size:.76rem;color:var(--gold-2);background:none;border:0;cursor:pointer}

.list{list-style:none;flex:1;overflow:auto;display:flex;flex-direction:column;gap:6px;padding-right:4px;scrollbar-width:thin;overscroll-behavior:contain}
.list > li{content-visibility:auto;contain-intrinsic-size:auto 72px}
.group{font-family:var(--khmer);font-size:.74rem;line-height:1.9;color:var(--gold-2);letter-spacing:.04em;margin:6px 4px 0}
.list button{width:100%;display:flex;gap:12px;align-items:center;text-align:left;padding:8px;border-radius:var(--r-md);border:1px solid transparent;background:rgba(10,17,13,.35);color:inherit;cursor:pointer;transition:background .2s,border-color .2s}
.list button:hover{background:rgba(46,74,53,.55)}
.list button.on{border-color:var(--gold);background:rgba(46,74,53,.75)}
.thumb{flex:none;width:52px;height:52px;border-radius:var(--r-sm);overflow:hidden;display:grid;place-items:center;background:var(--moss-3);color:var(--gold-2);border:1px solid rgba(212,175,55,.2)}
.thumb img{width:100%;height:100%;object-fit:cover}
.txt{flex:1;min-width:0;display:flex;flex-direction:column}
.nm{font-family:var(--title);font-size:.98rem;line-height:1.8;color:var(--ivory);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sub{font-family:var(--khmer);font-size:.72rem;line-height:1.8;color:var(--stone);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ic{flex:none;color:var(--gold-dim)}
.badge{flex:none;font-family:var(--khmer);font-size:.66rem;line-height:1.7;color:var(--night);background:var(--gold-2);border-radius:var(--r-pill);padding:0 8px}
.more button{justify-content:center;font-family:var(--khmer);font-size:.84rem;color:var(--gold-2);border:1px dashed rgba(212,175,55,.35)}
.empty{display:flex;flex-direction:column;align-items:center;gap:8px;font-family:var(--khmer);color:var(--stone);text-align:center;padding:30px 16px;line-height:2}
.src{font-family:var(--khmer);font-size:.68rem;color:var(--stone-3);line-height:1.8;margin-top:8px}

@media (max-width:900px){
  .app{grid-template-columns:minmax(0,1fr);height:auto;padding-left:16px;padding-right:16px}
  .stage{order:-1;height:70vh;min-height:440px}
  .list{overflow:visible}
}

/* ---- Fullscreen: the whole section (panel + map) fills the screen ---- */
.app.fs{position:relative;display:block;width:100%;max-width:none;height:100dvh;min-height:0;margin:0;padding:0;background:var(--night)}
.app.fs .stage{position:absolute;inset:0;height:auto;min-height:0}
.app.fs .side{position:absolute;z-index:6;top:calc(14px + env(safe-area-inset-top));left:14px;bottom:14px;width:370px;background:rgba(10,17,13,.94);box-shadow:0 18px 50px rgba(0,0,0,.55);transition:transform .4s var(--ease),opacity .3s var(--ease)}
.app.fs.panel-closed .side{transform:translateX(calc(-100% - 24px));opacity:0;pointer-events:none}
.side-head{display:flex;align-items:center;gap:8px;margin:-2px 0 10px}
.grip{display:none}
.side-title{flex:1;display:flex;align-items:center;gap:8px;font-family:var(--title);font-size:.95rem;line-height:1.8;color:var(--gold-2)}
.side-x,.panel-tab{display:grid;place-items:center;border:1px solid rgba(212,175,55,.3);background:rgba(10,17,13,.88);color:var(--gold-2);cursor:pointer;transition:background .2s,border-color .2s}
.side-x{width:34px;height:34px;border-radius:var(--r-sm)}
.side-x:hover,.panel-tab:hover{background:rgba(212,175,55,.16);border-color:var(--gold)}
.side-x svg,.panel-tab svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.panel-tab{position:absolute;z-index:6;top:calc(14px + env(safe-area-inset-top));left:14px;width:48px;height:48px;border-radius:var(--r-md);box-shadow:0 12px 30px rgba(0,0,0,.45)}
.panel-tab .n{position:absolute;top:-8px;right:-10px;min-width:22px;padding:0 6px;border-radius:var(--r-pill);background:var(--gold-2);color:var(--night);font-family:var(--khmer);font-size:.66rem;line-height:1.75;text-align:center}

/* phone: the panel is a bottom sheet over the map */
@media (max-width:900px){
  .app.fs .side{top:auto;left:0;right:0;bottom:0;width:auto;max-height:80dvh;border-radius:var(--r-xl) var(--r-xl) 0 0;border-width:1px 0 0;padding:8px 14px max(14px,env(safe-area-inset-bottom))}
  .app.fs.panel-closed .side{transform:translateY(calc(100% + 24px))}
  .app.fs .list{overflow:auto}
  .app.fs .grip{display:block;position:absolute;top:6px;left:50%;width:40px;height:4px;margin-left:-20px;border-radius:var(--r-pill);background:rgba(212,175,55,.35)}
  .app.fs .side-head{margin-top:8px}
  .panel-tab{top:calc(10px + env(safe-area-inset-top));left:10px;width:44px;height:44px}
}
</style>
