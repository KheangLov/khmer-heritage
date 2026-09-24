import type * as GeoJSON from 'geojson'

// Historic temples of Cambodia + the admin hierarchy they sit in.
// Data is built by scripts/build-temples.py into public/data/ and fetched lazily
// (index ~90 KB once per session; boundaries and per-province history on demand).

export interface TempleRow {
  id: string
  km: string
  en: string
  lat: number
  lng: number
  c: 'prasat' | 'wat'
  p: string // province code (HDX)
  d: string // district code
  m: string // commune code
  v?: string // village (Khmer), nearest matched village — approximate
  ve?: string
  y?: string // period label (Khmer)
  h?: 1 // has a Wikipedia history summary
}
export interface Label { km: string | null; en: string | null }
export interface TempleDetail {
  facts: {
    period?: string
    builder?: Label[]
    deity?: Label[]
    heritage?: Label[]
    descKm?: string
    descEn?: string
  }
  history: Partial<Record<'km' | 'en', { text: string; url: string }>>
  osm: string | null
  wikidata: string | null
  village: (Label & { approx: boolean }) | null
}
export interface AdminUnit { c: string; en: string; km: string }
type Geo = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, AdminUnit>

// Module-level caches: shared by every map on the page, fetched once.
let indexP: Promise<TempleRow[]> | null = null
let provincesP: Promise<Geo> | null = null
let districtsP: Promise<Geo> | null = null
const communesP = new Map<string, Promise<Geo>>()
const detailP = new Map<string, Promise<Record<string, TempleDetail>>>()

const getJson = <T>(url: string) => $fetch<T>(url, { responseType: 'json' })

export const loadTemples = () => (indexP ??= getJson<TempleRow[]>('/data/temples/index.json'))
export const loadProvinces = () => (provincesP ??= getJson<Geo>('/data/cambodia-admin/provinces.geojson'))
export const loadDistricts = () => (districtsP ??= getJson<Geo>('/data/cambodia-admin/districts.geojson'))
export function loadCommunes(districtCode: string) {
  if (!communesP.has(districtCode)) communesP.set(districtCode, getJson<Geo>(`/data/cambodia-admin/communes/${districtCode}.geojson`))
  return communesP.get(districtCode)!
}
export async function loadTempleDetail(row: TempleRow) {
  if (!detailP.has(row.p)) detailP.set(row.p, getJson(`/data/temples/detail/${row.p}.json`))
  return (await detailP.get(row.p)!)[row.id] ?? null
}

export const templeName = (t: Pick<TempleRow, 'km' | 'en'>) => t.km || t.en

/** Reactive filter state + cascading Province › District › Commune › Village
 *  options, each listing only units that contain temples (with counts). */
export function useTempleFilters() {
  const temples = shallowRef<TempleRow[]>([])
  const provinces = shallowRef<AdminUnit[]>([])
  const districts = shallowRef<AdminUnit[]>([])
  const communes = shallowRef<AdminUnit[]>([])
  const ready = ref(false)

  const q = ref('')
  // The search box drives the list, the map's clustering (re-run in its worker)
  // and the URL; settle typing first instead of doing all three per keystroke.
  const needle = ref('')
  let typing: ReturnType<typeof setTimeout> | undefined
  watch(q, (v) => {
    clearTimeout(typing)
    typing = setTimeout(() => { needle.value = v.trim().toLowerCase() }, v ? 140 : 0)
  })
  const kind = ref<'all' | 'prasat' | 'wat' | 'history'>('all')
  const province = ref('')
  const district = ref('')
  const commune = ref('')
  const village = ref('')

  onMounted(async () => {
    const [rows, prov, dist] = await Promise.all([loadTemples(), loadProvinces(), loadDistricts()])
    temples.value = rows
    provinces.value = prov.features.map((f) => f.properties)
    districts.value = dist.features.map((f) => f.properties)
    ready.value = true
  })
  watch(district, async (d) => {
    communes.value = d ? (await loadCommunes(d)).features.map((f) => f.properties) : []
  })
  // Changing a level clears the levels below it.
  watch(province, () => { district.value = ''; commune.value = ''; village.value = '' })
  watch(district, () => { commune.value = ''; village.value = '' })
  watch(commune, () => { village.value = '' })

  const byKind = computed(() => temples.value.filter((t) =>
    kind.value === 'all' || (kind.value === 'history' ? t.h : t.c === kind.value)))
  const count = (rows: TempleRow[], key: 'p' | 'd' | 'm') => rows.reduce<Record<string, number>>((acc, t) => {
    acc[t[key]] = (acc[t[key]] ?? 0) + 1
    return acc
  }, {})

  const provinceOptions = computed(() => {
    const n = count(byKind.value, 'p')
    return provinces.value.filter((u) => n[u.c]).map((u) => ({ ...u, n: n[u.c]! })).sort((a, b) => b.n - a.n)
  })
  const districtOptions = computed(() => {
    if (!province.value) return []
    const n = count(byKind.value.filter((t) => t.p === province.value), 'd')
    return districts.value.filter((u) => n[u.c]).map((u) => ({ ...u, n: n[u.c]! })).sort((a, b) => b.n - a.n)
  })
  const communeOptions = computed(() => {
    if (!district.value) return []
    const n = count(byKind.value.filter((t) => t.d === district.value), 'm')
    return communes.value.filter((u) => n[u.c]).map((u) => ({ ...u, n: n[u.c]! })).sort((a, b) => b.n - a.n)
  })
  const villageOptions = computed(() => {
    if (!commune.value) return []
    const n: Record<string, { km: string; en: string; n: number }> = {}
    for (const t of byKind.value) if (t.m === commune.value && t.v) {
      n[t.v] ??= { km: t.v, en: t.ve ?? '', n: 0 }
      n[t.v]!.n++
    }
    return Object.values(n).sort((a, b) => b.n - a.n)
  })

  const results = computed(() => {
    const n = needle.value
    return byKind.value.filter((t) =>
      (!province.value || t.p === province.value)
      && (!district.value || t.d === district.value)
      && (!commune.value || t.m === commune.value)
      && (!village.value || t.v === village.value)
      && (!n || t.km.toLowerCase().includes(n) || t.en.toLowerCase().includes(n)))
  })

  const unitName = (list: AdminUnit[], code: string) => list.find((u) => u.c === code)?.km ?? ''
  const pathOf = (t: TempleRow) => [
    unitName(provinces.value, t.p) && 'ខេត្ត' + unitName(provinces.value, t.p),
    unitName(districts.value, t.d),
  ].filter(Boolean).join(' › ')

  function reset() { province.value = ''; q.value = ''; kind.value = 'all' }

  return {
    ready, temples, q, kind, province, district, commune, village,
    provinceOptions, districtOptions, communeOptions, villageOptions,
    results, provinces, districts, communes, pathOf, reset,
  }
}
