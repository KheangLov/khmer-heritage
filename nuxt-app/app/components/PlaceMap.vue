<script setup lang="ts">
import type { Map as MLMap, Marker, GeoJSONSource, MapLayerMouseEvent, Popup } from 'maplibre-gl'
import type * as GeoJSON from 'geojson'
import { KHMER_ICONS, type KhmerIconName } from '~/components/KhmerIcon.vue'
import { type PlaceView, PLACES, CAMBODIA_BOUNDS, distanceKm, bearingDeg, khmerDirection } from '~/data/places'
import { TIMELINE } from '~/data/visuals'
import { khmerNum } from '~/utils/khmer-calendar'
import { periodOf, heritageLabel } from '~/utils/temple-history'
import { khmerNightStyle, SATELLITE_LAYER, VECTOR_FILL_LAYERS } from '~/utils/map-style'
import {
  type TempleRow, type TempleDetail, loadTemples, loadTempleDetail, loadProvinces, loadDistricts, loadCommunes, templeName,
} from '~/composables/useTemples'

// Vector map of Cambodia's heritage (MapLibre GL + OpenFreeMap).
// Everything on the map is drawn by the GPU from GeoJSON sources — no DOM
// markers — so hundreds of temples pan and zoom smoothly:
//   featured   the site's curated places (large gold pins)
//   temples    every historic temple from the open-data build (clustered,
//              cluster counts in Khmer numerals)
//   boundary   the selected province / district / commune outline
// Modes: embed (article pages; lazy-initialised when scrolled near, cooperative
// gestures), full (/map page), country (a tradition with no single site).
const props = withDefaults(defineProps<{
  places: PlaceView[]
  temples?: TempleRow[] | null
  withTemples?: boolean
  focus?: string
  full?: boolean
  country?: string
  boundary?: GeoJSON.Feature | null
  hoverId?: string
}>(), { temples: null, withTemples: false, focus: '', full: false, country: '', boundary: null, hoverId: '' })
const emit = defineEmits<{ select: [id: string] }>()

const root = ref<HTMLElement | null>(null)
const mapEl = ref<HTMLElement | null>(null)
const ready = ref(false)
const failed = ref(false)
const satellite = ref(false)
const terrain3d = ref(false)
const fullscreen = ref(false)
const bearing = ref(0)
const copied = ref(false)

// ---------- selection (a curated place or a temple) ----------
const allTemples = shallowRef<TempleRow[]>([])
const templeList = computed(() => props.temples ?? allTemples.value)
const selectedId = ref(props.full ? props.focus : props.focus || props.places[0]?.id || '')
const selectedPlace = computed<PlaceView | null>(() => props.places.find((p) => p.id === selectedId.value) ?? PLACES[selectedId.value] ?? null)
const selectedTemple = computed(() => selectedPlace.value ? null : templeList.value.find((t) => t.id === selectedId.value)
  ?? allTemples.value.find((t) => t.id === selectedId.value) ?? null)
const sel = computed(() => {
  if (selectedPlace.value) return { ...selectedPlace.value, kind: 'place' as const }
  const t = selectedTemple.value
  return t ? { id: t.id, name: templeName(t), en: t.en, lat: t.lat, lng: t.lng, icon: (t.c === 'wat' ? 'stupa' : 'temple') as KhmerIconName, approx: false, kind: 'temple' as const, t } : null
})
const detail = shallowRef<TempleDetail | null>(null)
const adminPath = ref('')
watch(selectedTemple, async (t) => {
  detail.value = null
  adminPath.value = ''
  if (!t) return
  const [d, prov, dist, comm] = await Promise.all([loadTempleDetail(t), loadProvinces(), loadDistricts(), loadCommunes(t.d).catch(() => null)])
  if (selectedTemple.value?.id !== t.id) return
  detail.value = d
  const nm = (fc: { features: Array<{ properties: { c: string; km: string } }> } | null, c: string) => fc?.features.find((f) => f.properties.c === c)?.properties.km
  adminPath.value = [
    nm(prov, t.p) && 'ខេត្ត' + nm(prov, t.p), nm(dist, t.d), nm(comm, t.m), t.v && `ភូមិ${t.v}`,
  ].filter(Boolean).join(' › ')
}, { immediate: true })

const events = computed(() => selectedPlace.value
  ? TIMELINE.flatMap((a) => a.events).filter((e) => e.place === selectedPlace.value!.id) : [])
const eraLink = computed(() => events.value.find((e) => e.era)?.era)
const histLang = computed<'km' | 'en' | null>(() => detail.value?.history.km ? 'km' : detail.value?.history.en ? 'en' : null)
const labelOf = (l: { km: string | null; en: string | null }) => l.km || l.en || ''
// Every temple gets its period's history (or, undated, the general context);
// see app/utils/temple-history.ts.
const period = computed(() => selectedTemple.value ? periodOf(selectedTemple.value) : null)
// Nearest curated landmark (skipping one at the same spot), for orientation.
const nearby = computed(() => {
  const t = selectedTemple.value
  if (!t) return null
  let best: { id: string; name: string; km: number } | null = null
  for (const p of Object.values(PLACES)) {
    const km = distanceKm(t.lat, t.lng, p.lat, p.lng)
    if (km > 0.3 && (!best || km < best.km)) best = { id: p.id, name: p.name, km }
  }
  return best && best.km < 60 ? { ...best, label: khmerNum(best.km < 10 ? best.km.toFixed(1) : Math.round(best.km)) } : null
})

// ---------- my location ----------
const me = ref<{ lat: number; lng: number } | null>(null)
const locating = ref(false)
const geoError = ref('')
const heading = ref<number | null>(null)
const canCompass = ref(false)
const route = computed(() => {
  if (!me.value || !sel.value) return null
  const km = distanceKm(me.value.lat, me.value.lng, sel.value.lat, sel.value.lng)
  const deg = bearingDeg(me.value.lat, me.value.lng, sel.value.lat, sel.value.lng)
  return {
    km: km < 10 ? khmerNum(km.toFixed(1)) : khmerNum(Math.round(km).toLocaleString('en-US')),
    deg, degLabel: khmerNum(Math.round(deg)) + '°', dir: khmerDirection(deg),
  }
})
const needle = computed(() => (route.value ? route.value.deg - (heading.value ?? 0) : 0))
const fmt = (v: number, pos: string, neg: string) => `${khmerNum(Math.abs(v).toFixed(4))}° ${v >= 0 ? pos : neg}`
const coords = computed(() => sel.value ? `${fmt(sel.value.lat, 'ជ', 'ត')} · ${fmt(sel.value.lng, 'ក', 'ល')}` : '')
const directionsUrl = computed(() => sel.value
  ? `https://www.google.com/maps/dir/?api=1&destination=${sel.value.lat},${sel.value.lng}` : '#')

let map: MLMap | null = null
let ml: typeof import('maplibre-gl') | null = null
let meMarker: Marker | null = null
let hoverPopup: Popup | null = null
let watchId: number | null = null
let resizeObs: ResizeObserver | null = null
let io: IntersectionObserver | null = null

// ---------- marker images (SVG → bitmap, registered once per map) ----------
const GOLD = '#E8C96A'
const MOSS = '#14241B'
const NIGHT = '#0C1410'
const iconSvg = (name: KhmerIconName, color: string, x: number, y: number, s: number) =>
  `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" color="${color}">${KHMER_ICONS[name]}</svg>`
const STYLE = '<style>.f{fill:currentColor;fill-opacity:.25}.kh-aw *{stroke-width:10px}.kh-aw g[fill="none"] *{fill:none}</style>'
function pinSvg(icon: KhmerIconName, active: boolean) {
  const fill = active ? GOLD : MOSS
  const fg = active ? NIGHT : GOLD
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="116" viewBox="0 0 48 58">${STYLE}
    <path d="M24 56S6 37 6 23.5a18 18 0 1 1 36 0C42 37 24 56 24 56Z" fill="${fill}" stroke="${GOLD}" stroke-width="2"/>
    ${iconSvg(icon, fg, 11, 10.5, 26)}</svg>`
}
function dotSvg(icon: KhmerIconName, active: boolean) {
  const fill = active ? GOLD : MOSS
  const fg = active ? NIGHT : GOLD
  return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 36 36">${STYLE}
    <rect x="2" y="2" width="32" height="32" rx="11" fill="${fill}" stroke="${GOLD}" stroke-width="1.8"/>
    ${iconSvg(icon, fg, 7, 7, 22)}</svg>`
}
async function addSvgImage(name: string, svg: string) {
  if (!map || map.hasImage(name)) return
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  await img.decode()
  if (map && !map.hasImage(name)) map.addImage(name, img, { pixelRatio: 2 })
}
async function registerImages() {
  const icons = new Set<KhmerIconName>(['temple', 'stupa', ...props.places.map((p) => p.icon), ...Object.values(PLACES).map((p) => p.icon)])
  await Promise.all([...icons].flatMap((i) => [
    addSvgImage(`pin-${i}`, pinSvg(i, false)), addSvgImage(`pin-on-${i}`, pinSvg(i, true)),
  ]).concat([
    addSvgImage('dot-prasat', dotSvg('temple', false)), addSvgImage('dot-wat', dotSvg('stupa', false)),
    addSvgImage('dot-on-prasat', dotSvg('temple', true)), addSvgImage('dot-on-wat', dotSvg('stupa', true)),
  ]))
}

// ---------- GeoJSON ----------
// A temple within 300 m of a curated place is the same monument: show the pin only.
const near = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => distanceKm(a.lat, a.lng, b.lat, b.lng) < 0.3
function templeGeo(): GeoJSON.FeatureCollection {
  const featured = props.places
  return {
    type: 'FeatureCollection',
    features: templeList.value.filter((t) => !featured.some((p) => near(p, t))).map((t) => ({
      type: 'Feature', properties: { id: t.id, name: templeName(t), c: t.c, h: t.h ?? 0 },
      geometry: { type: 'Point', coordinates: [t.lng, t.lat] },
    })),
  }
}
function placeGeo(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: props.places.map((p) => ({
      type: 'Feature', properties: { id: p.id, name: p.name, icon: p.icon },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }
}
function selectionGeo(): GeoJSON.FeatureCollection {
  const s = sel.value
  return {
    type: 'FeatureCollection',
    features: s ? [{
      type: 'Feature', properties: { img: s.kind === 'place' ? `pin-on-${s.icon}` : `dot-on-${s.t.c}`, kind: s.kind, name: s.name },
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
    }] : [],
  }
}
const setData = (id: string, data: GeoJSON.GeoJSON) => (map?.getSource(id) as GeoJSONSource | undefined)?.setData(data)

function addLayers() {
  if (!map) return
  const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
  map.addSource('boundary', { type: 'geojson', data: props.boundary ?? empty })
  map.addSource('route', { type: 'geojson', data: empty })
  map.addSource('temples', { type: 'geojson', data: templeGeo(), cluster: true, clusterRadius: 46, clusterMaxZoom: 12 })
  map.addSource('featured', { type: 'geojson', data: placeGeo() })
  map.addSource('selection', { type: 'geojson', data: selectionGeo() })
  const labelFont = ['Noto Sans Bold']
  map.addLayer({ id: 'boundary-fill', type: 'fill', source: 'boundary', paint: { 'fill-color': '#D4AF37', 'fill-opacity': 0.07 } })
  map.addLayer({ id: 'boundary-glow', type: 'line', source: 'boundary', paint: { 'line-color': '#E8C96A', 'line-width': 9, 'line-opacity': 0.15, 'line-blur': 5 } })
  map.addLayer({ id: 'boundary-line', type: 'line', source: 'boundary', paint: { 'line-color': '#E8C96A', 'line-width': 2.2 } })
  map.addLayer({ id: 'route-glow', type: 'line', source: 'route', paint: { 'line-color': GOLD, 'line-width': 8, 'line-opacity': 0.18, 'line-blur': 4 } })
  map.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round' }, paint: { 'line-color': GOLD, 'line-width': 2.4, 'line-dasharray': [1, 2] } })
  map.addLayer({
    id: 'cluster-halo', type: 'circle', source: 'temples', filter: ['has', 'point_count'],
    paint: { 'circle-color': '#D4AF37', 'circle-opacity': 0.18, 'circle-radius': ['step', ['get', 'point_count'], 24, 10, 30, 50, 38] },
  })
  map.addLayer({
    id: 'clusters', type: 'circle', source: 'temples', filter: ['has', 'point_count'],
    paint: { 'circle-color': '#D4AF37', 'circle-radius': ['step', ['get', 'point_count'], 15, 10, 19, 50, 24], 'circle-stroke-color': NIGHT, 'circle-stroke-width': 2 },
  })
  map.addLayer({
    id: 'cluster-count', type: 'symbol', source: 'temples', filter: ['has', 'point_count'],
    // Khmer numerals: Intl's `khmr` numbering system inside MapLibre's number-format
    layout: { 'text-field': ['number-format', ['get', 'point_count'], { locale: 'en-u-nu-khmr' }], 'text-font': labelFont, 'text-size': 14, 'text-allow-overlap': true },
    paint: { 'text-color': NIGHT },
  })
  map.addLayer({
    id: 'temples', type: 'symbol', source: 'temples', filter: ['!', ['has', 'point_count']],
    layout: {
      'icon-image': ['match', ['get', 'c'], 'wat', 'dot-wat', 'dot-prasat'],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 7, 0.6, 14, 0.95],
      'icon-allow-overlap': true,
      'text-field': ['step', ['zoom'], '', 12, ['get', 'name']],
      'text-font': labelFont, 'text-size': 12, 'text-offset': [0, 1.5], 'text-anchor': 'top', 'text-optional': true, 'text-max-width': 10,
    },
    paint: { 'text-color': '#F2E8D5', 'text-halo-color': NIGHT, 'text-halo-width': 1.6 },
  })
  map.addLayer({
    id: 'featured', type: 'symbol', source: 'featured',
    layout: {
      'icon-image': ['concat', 'pin-', ['get', 'icon']], 'icon-anchor': 'bottom', 'icon-allow-overlap': true,
      'icon-size': ['interpolate', ['linear'], ['zoom'], 6, 0.7, 13, 1],
      'text-field': ['step', ['zoom'], '', 9, ['get', 'name']],
      'text-font': labelFont, 'text-size': 13, 'text-anchor': 'bottom', 'text-offset': [0, -3.9], 'text-optional': true,
    },
    paint: { 'text-color': '#F4DC8A', 'text-halo-color': NIGHT, 'text-halo-width': 1.8 },
  })
  map.addLayer({ id: 'hover', type: 'circle', source: 'temples', filter: ['==', ['get', 'id'], props.hoverId || ''], paint: { 'circle-radius': 22, 'circle-color': '#E8C96A', 'circle-opacity': 0.22, 'circle-stroke-color': '#E8C96A', 'circle-stroke-width': 1.5 } })
  map.addLayer({ id: 'selection-ring', type: 'circle', source: 'selection', filter: ['==', ['get', 'kind'], 'temple'], paint: { 'circle-radius': 26, 'circle-color': '#E8C96A', 'circle-opacity': 0.18, 'circle-stroke-color': '#E8C96A', 'circle-stroke-width': 1.5 } })
  map.addLayer({
    id: 'selection', type: 'symbol', source: 'selection',
    layout: { 'icon-image': ['get', 'img'], 'icon-anchor': ['match', ['get', 'kind'], 'place', 'bottom', 'center'], 'icon-allow-overlap': true, 'icon-size': 1.15 },
  })

  // interactions
  map.on('click', 'clusters', async (e) => {
    const f = e.features?.[0]
    if (!f) return
    const zoom = await (map!.getSource('temples') as GeoJSONSource).getClusterExpansionZoom(f.properties!.cluster_id)
    map!.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 0.2, duration: 600 })
  })
  const pick = (e: MapLayerMouseEvent) => {
    const id = e.features?.[0]?.properties?.id
    if (id) select(String(id), true)
  }
  map.on('click', 'temples', pick)
  map.on('click', 'featured', pick)
  for (const layer of ['clusters', 'temples', 'featured']) {
    map.on('mouseenter', layer, (e) => {
      map!.getCanvas().style.cursor = 'pointer'
      const name = e.features?.[0]?.properties?.name
      if (name && layer !== 'clusters' && ml && matchMedia('(hover: hover)').matches) {
        hoverPopup ??= new ml.Popup({ closeButton: false, closeOnClick: false, className: 'kh-tip', offset: layer === 'featured' ? 52 : 18 })
        hoverPopup.setLngLat((e.features![0]!.geometry as GeoJSON.Point).coordinates as [number, number]).setText(name).addTo(map!)
      }
    })
    map.on('mouseleave', layer, () => { map!.getCanvas().style.cursor = ''; hoverPopup?.remove() })
  }
}

// ---------- selection ----------
function select(id: string, fly = true) {
  selectedId.value = id
  emit('select', id)
  const s = sel.value
  if (map && s && fly) {
    const wide = (root.value?.clientWidth ?? 800) >= 700
    map.flyTo({ center: [s.lng, s.lat], zoom: Math.max(map.getZoom(), s.approx ? 11 : 14.5), duration: 1300, essential: true, offset: wide ? [170, 0] : [0, 0] })
  }
}
function closeCard() { selectedId.value = '' }
// Keyed on the id: `sel` is recomputed whenever the filtered list changes, but
// the marker only needs re-uploading when the selection itself changes.
watch(() => sel.value?.id, () => { setData('selection', selectionGeo()); drawRoute() })
watch(() => props.focus, (id) => { if (id && id !== selectedId.value) select(id) })
watch(templeList, () => setData('temples', templeGeo()))
// The /map page hides the featured pins while a filter is on.
watch(() => props.places, () => { setData('featured', placeGeo()); setData('temples', templeGeo()) })
watch(() => props.hoverId, (id) => { if (map?.getLayer('hover')) map.setFilter('hover', ['==', ['get', 'id'], id || '']) })
watch(() => props.boundary, (f) => {
  setData('boundary', f ?? { type: 'FeatureCollection', features: [] })
  if (!f || !map || !ml) return
  const b = new ml.LngLatBounds()
  const walk = (c: unknown): void => { if (typeof (c as number[])[0] === 'number') b.extend(c as [number, number]); else (c as unknown[]).forEach(walk) }
  walk((f.geometry as GeoJSON.Polygon).coordinates)
  const wide = (root.value?.clientWidth ?? 800) >= 700
  map.fitBounds(b, { padding: { top: 60, bottom: 60, right: 70, left: wide && sel.value ? 420 : 60 }, maxZoom: 13, duration: 900 })
})

function fitAll() {
  if (!map || !ml) return
  if (props.country || (!props.places.length && !props.temples)) { map.fitBounds(CAMBODIA_BOUNDS, { padding: 40, duration: 800 }); return }
  const pts: Array<{ lat: number; lng: number; approx?: boolean }> = [...props.places, ...(props.temples ?? [])]
  const wide = (root.value?.clientWidth ?? 800) >= 700
  if (pts.length === 1) {
    const p = pts[0]!
    map.flyTo({ center: [p.lng, p.lat], zoom: p.approx ? 11 : 14.5, offset: wide ? [170, 0] : [0, 0], duration: 800 })
    return
  }
  const b = new ml.LngLatBounds()
  pts.forEach((p) => b.extend([p.lng, p.lat]))
  map.fitBounds(b, { padding: { top: 70, bottom: 70, left: wide && sel.value ? 420 : 70, right: 80 }, maxZoom: 14, duration: 800 })
}
defineExpose({ select, fitAll })

// ---------- controls ----------
const zoomBy = (d: number) => map?.easeTo({ zoom: map.getZoom() + d, duration: 250 })
const resetNorth = () => map?.easeTo({ bearing: 0, pitch: terrain3d.value ? 60 : 0, duration: 450 })
function toggleSatellite() {
  satellite.value = !satellite.value
  if (!map) return
  map.setLayoutProperty(SATELLITE_LAYER, 'visibility', satellite.value ? 'visible' : 'none')
  for (const id of VECTOR_FILL_LAYERS) map.setLayoutProperty(id, 'visibility', satellite.value ? 'none' : 'visible')
}
function toggle3d() {
  terrain3d.value = !terrain3d.value
  if (!map) return
  map.setTerrain(terrain3d.value ? { source: 'terrain-dem', exaggeration: 1.6 } : null)
  map.easeTo({ pitch: terrain3d.value ? 62 : 0, bearing: terrain3d.value ? -18 : 0, duration: 1000 })
}
async function toggleFullscreen() {
  if (!document.fullscreenElement) await root.value?.requestFullscreen?.()
  else await document.exitFullscreen()
}
const onFsChange = () => { fullscreen.value = document.fullscreenElement === root.value }
async function copyCoords() {
  if (!sel.value) return
  await navigator.clipboard?.writeText(`${sel.value.lat}, ${sel.value.lng}`)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1600)
}

// ---------- my location + route ----------
function drawRoute() {
  if (!me.value || !sel.value) return
  setData('route', { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[me.value.lng, me.value.lat], [sel.value.lng, sel.value.lat]] } })
}
function locate() {
  geoError.value = ''
  if (!('geolocation' in navigator)) { geoError.value = 'កម្មវិធីរុករកនេះមិនគាំទ្រទីតាំងទេ។'; return }
  locating.value = true
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  let first = true
  watchId = navigator.geolocation.watchPosition((pos) => {
    locating.value = false
    me.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    if (!map || !ml) return
    const ll: [number, number] = [me.value.lng, me.value.lat]
    if (!meMarker) {
      const el = document.createElement('div')
      el.className = 'kh-me'
      el.title = 'ទីតាំងរបស់អ្នក'
      meMarker = new ml.Marker({ element: el }).setLngLat(ll).addTo(map)
    } else meMarker.setLngLat(ll)
    drawRoute()
    if (first) {
      first = false
      const wide = (root.value?.clientWidth ?? 800) >= 700
      if (sel.value) map.fitBounds(new ml.LngLatBounds(ll, ll).extend([sel.value.lng, sel.value.lat]), { padding: { top: 90, bottom: 90, right: 90, left: wide ? 440 : 90 }, maxZoom: 14, duration: 1100 })
      else map.flyTo({ center: ll, zoom: 12 })
    }
  }, (err) => {
    locating.value = false
    geoError.value = err.code === err.PERMISSION_DENIED
      ? 'សូមអនុញ្ញាតឱ្យប្រើទីតាំង ដើម្បីមើលចម្ងាយ និងទិសដៅ។'
      : 'រកទីតាំងមិនបានទេ — សូមព្យាយាមម្តងទៀត។'
  }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 })
}
function onOrientation(e: DeviceOrientationEvent & { webkitCompassHeading?: number }) {
  if (typeof e.webkitCompassHeading === 'number') heading.value = e.webkitCompassHeading
  else if (e.absolute && e.alpha !== null) heading.value = (360 - e.alpha) % 360
}
async function startCompass() {
  const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
  if (DOE?.requestPermission && (await DOE.requestPermission()) !== 'granted') return
  window.addEventListener('deviceorientationabsolute', onOrientation as EventListener)
  window.addEventListener('deviceorientation', onOrientation as EventListener)
}

// ---------- lifecycle ----------
async function init() {
  if (map || !mapEl.value) return
  try {
    const [mod, worker] = await Promise.all([
      import('maplibre-gl'),
      // MapLibre locates its worker relative to its own module URL, which a
      // bundler rewrites; hand it the bundled worker's URL explicitly.
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ])
    mod.setWorkerUrl(worker.default)
    ml = mod
    if (props.withTemples && !props.temples) loadTemples().then((rows) => { allTemples.value = rows }).catch(() => {})
    const mobile = matchMedia('(pointer: coarse)').matches
    map = new ml.Map({
      container: mapEl.value,
      style: khmerNightStyle(window.location.origin),
      bounds: CAMBODIA_BOUNDS,
      fitBoundsOptions: { padding: 30 },
      attributionControl: { compact: true },
      cooperativeGestures: !props.full,
      // Performance: cap the backing-store resolution, keep to the region,
      // no world copies, quick fades.
      pixelRatio: Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2),
      maxBounds: [[98.5, 7.5], [111.5, 17.5]],
      minZoom: 5,
      renderWorldCopies: false,
      fadeDuration: 120,
      maxPitch: 75,
      locale: {
        'CooperativeGesturesHandler.WindowsHelpText': 'ចុច Ctrl ហើយរមូរ ដើម្បីពង្រីកផែនទី',
        'CooperativeGesturesHandler.MacHelpText': 'ចុច ⌘ ហើយរមូរ ដើម្បីពង្រីកផែនទី',
        'CooperativeGesturesHandler.MobileHelpText': 'ប្រើម្រាមដៃពីរ ដើម្បីរំកិលផែនទី',
      },
    })
    map.on('rotate', () => { bearing.value = map!.getBearing() })
    map.on('click', (e) => {
      if (!props.full || !map!.getLayer('temples')) return
      const hit = map!.queryRenderedFeatures(e.point, { layers: ['temples', 'featured', 'clusters'] })
      if (!hit.length) closeCard()
    })
    map.once('style.load', async () => {
      ready.value = true
      // Keep the attribution collapsed to its ⓘ button (MapLibre opens it once,
      // when the first credits arrive); the OpenStreetMap credit stays one tap away.
      const collapse = () => {
        const el = mapEl.value?.querySelector('.maplibregl-ctrl-attrib')
        if (!el?.classList.contains('maplibregl-compact')) return
        el.classList.remove('maplibregl-compact-show')
        el.setAttribute('open', '')
        map?.off('sourcedata', collapse)
      }
      map!.on('sourcedata', collapse)
      await registerImages()
      addLayers()
      if (props.full && sel.value) select(sel.value.id)
      else fitAll()
    })
    resizeObs = new ResizeObserver(() => map?.resize())
    resizeObs.observe(mapEl.value)
  } catch (e) {
    failed.value = true
    console.warn('[map] failed to start', e)
  }
}

onMounted(() => {
  canCompass.value = 'DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches
  document.addEventListener('fullscreenchange', onFsChange)
  // Embedded maps start only when scrolled near, so article pages load light.
  if (props.full || !('IntersectionObserver' in window)) { init(); return }
  io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io?.disconnect(); init() }
  }, { rootMargin: '400px 0px' })
  if (root.value) io.observe(root.value)
})
onBeforeUnmount(() => {
  io?.disconnect()
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  window.removeEventListener('deviceorientationabsolute', onOrientation as EventListener)
  window.removeEventListener('deviceorientation', onOrientation as EventListener)
  document.removeEventListener('fullscreenchange', onFsChange)
  resizeObs?.disconnect()
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="root" class="pm" :class="{ full, fs: fullscreen }">
    <div class="pm-stage">
      <div ref="mapEl" class="pm-map" data-lenis-prevent role="application" aria-label="ផែនទីទីតាំងប្រវត្តិសាស្ត្រ" />

      <div v-if="!ready" class="pm-loading" aria-hidden="true">
        <KhmerIcon name="compass" :size="44" class="spin" />
        <span>{{ failed ? 'មិនអាចបើកផែនទីបានទេ' : 'កំពុងផ្ទុកផែនទី…' }}</span>
      </div>

      <div class="pm-seg" role="group" aria-label="ប្រភេទផែនទី">
        <button :class="{ on: !satellite }" @click="satellite && toggleSatellite()">ផែនទី</button>
        <button :class="{ on: satellite }" @click="!satellite && toggleSatellite()">ផ្កាយរណប</button>
      </div>

      <div class="pm-ctrl" role="toolbar" aria-label="ឧបករណ៍ផែនទី">
        <button title="ពង្រីក" aria-label="ពង្រីក" @click="zoomBy(1)"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></button>
        <button title="បង្រួម" aria-label="បង្រួម" @click="zoomBy(-1)"><svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg></button>
        <button title="ត្រឡប់ទិសខាងជើង" aria-label="ត្រឡប់ទិសខាងជើង" class="north" @click="resetNorth">
          <svg viewBox="0 0 24 24" :style="{ transform: `rotate(${-bearing}deg)` }"><path d="m12 3 4 9h-8z" class="fill" /><path d="m12 21-4-9h8z" /></svg>
        </button>
        <span class="sep" />
        <button title="មើលទីតាំងទាំងអស់" aria-label="មើលទីតាំងទាំងអស់" @click="fitAll"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /><circle cx="12" cy="12" r="2" /></svg></button>
        <button title="ទីតាំងរបស់ខ្ញុំ" aria-label="ទីតាំងរបស់ខ្ញុំ" :class="{ on: !!me }" @click="locate"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg></button>
        <button title="ភូមិសាស្ត្រ ៣ វិមាត្រ" aria-label="ភូមិសាស្ត្រ ៣ វិមាត្រ" :class="{ on: terrain3d }" @click="toggle3d"><svg viewBox="0 0 24 24"><path d="m3 19 6-10 4 6 3-4 5 8z" /></svg></button>
        <button :title="fullscreen ? 'ចេញពីពេញអេក្រង់' : 'ពេញអេក្រង់'" :aria-label="fullscreen ? 'ចេញពីពេញអេក្រង់' : 'ពេញអេក្រង់'" @click="toggleFullscreen">
          <svg viewBox="0 0 24 24"><path v-if="!fullscreen" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /><path v-else d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
        </button>
      </div>

      <div v-if="country" class="pm-country">
        <KhmerIcon name="compass" :size="30" />
        <p>{{ country }}</p>
      </div>

      <Transition name="card">
        <aside v-if="sel && !country" :key="sel.id" class="pm-card" aria-live="polite">
          <button v-if="full" class="x" aria-label="បិទ" @click="closeCard">×</button>
          <div v-if="sel.kind === 'place' && sel.img" class="c-img">
            <NuxtImg :src="sel.img" :alt="sel.name" width="420" height="220" format="webp" loading="lazy" />
          </div>
          <div class="c-body">
            <div class="c-head">
              <span class="c-ic"><KhmerIcon :name="sel.icon" :size="30" /></span>
              <div>
                <div class="c-name">{{ sel.name }}</div>
                <div class="c-sub">
                  <template v-if="sel.kind === 'place'">{{ sel.en }} · {{ sel.province }}</template>
                  <template v-else>{{ sel.en && sel.en !== sel.name ? sel.en + ' · ' : '' }}{{ sel.t.c === 'wat' ? 'វត្តប្រវត្តិសាស្ត្រ' : 'ប្រាសាទបុរាណ' }}</template>
                </div>
              </div>
            </div>

            <!-- curated place -->
            <template v-if="sel.kind === 'place'">
              <p v-if="sel.note" class="c-note">{{ sel.note }}</p>
              <div v-if="events.length" class="c-events">
                <span v-for="e in events.slice(0, 3)" :key="e.title"><b>{{ e.year }}</b> {{ e.title }}</span>
              </div>
            </template>

            <!-- temple from the open-data build -->
            <template v-else>
              <p v-if="adminPath" class="c-path"><KhmerIcon name="pin" :size="14" />{{ adminPath }}<span v-if="sel.t.v"> (ប្រហែល)</span></p>
              <dl v-if="detail" class="c-facts">
                <div v-if="detail.facts.period"><dt>សម័យ</dt><dd>{{ detail.facts.period }}</dd></div>
                <div v-if="detail.facts.builder?.length"><dt>អ្នកកសាង</dt><dd>{{ detail.facts.builder.map(labelOf).join(' · ') }}</dd></div>
                <div v-if="detail.facts.deity?.length"><dt>ឧទ្ទិសដល់</dt><dd>{{ detail.facts.deity.map(labelOf).join(' · ') }}</dd></div>
                <div v-if="detail.facts.heritage?.length"><dt>ឋានៈ</dt><dd>{{ detail.facts.heritage.map(heritageLabel).join(' · ') }}</dd></div>
              </dl>
              <p v-if="detail?.facts.descKm || detail?.facts.descEn" class="c-note">{{ detail.facts.descKm || detail.facts.descEn }}</p>
              <div v-if="histLang" class="c-hist" :lang="histLang">
                <p>{{ detail!.history[histLang]!.text }}</p>
                <a :href="detail!.history[histLang]!.url" target="_blank" rel="noopener">{{ histLang === 'km' ? 'វិគីភីឌា' : 'Wikipedia (English)' }} ↗</a>
              </div>
              <section v-if="period" class="c-era" :class="{ undated: !period.dated }">
                <h4><KhmerIcon name="book" :size="16" />{{ period.dated ? 'បរិបទប្រវត្តិសាស្ត្រ' : 'ប្រវត្តិ' }} · <b>{{ period.name }}</b><span>{{ period.range }}</span></h4>
                <p>{{ period.text }}</p>
                <NuxtLink :to="period.to">{{ period.to === '/timeline' ? 'មើលខ្សែប្រវត្តិសាស្ត្រ →' : 'អានសម័យកាលនេះ →' }}</NuxtLink>
              </section>
              <button v-if="nearby" class="c-near" @click="select(nearby.id)">
                <KhmerIcon name="compass" :size="15" />ជិត <b>{{ nearby.name }}</b> · {{ nearby.label }} គ.ម
              </button>
              <div v-if="detail" class="c-src">
                <a v-if="detail.wikidata" :href="detail.wikidata" target="_blank" rel="noopener">Wikidata</a>
                <a v-if="detail.osm" :href="detail.osm" target="_blank" rel="noopener">OpenStreetMap</a>
              </div>
            </template>

            <button class="c-coord" title="ចម្លងកូអរដោនេ" @click="copyCoords">
              <KhmerIcon name="pin" :size="15" />{{ coords }}<span v-if="sel.approx"> · ប្រហែល</span>
              <em>{{ copied ? 'បានចម្លង ✓' : 'ចម្លង' }}</em>
            </button>

            <div v-if="route" class="c-route">
              <div class="needle" :style="{ transform: `rotate(${needle}deg)` }" aria-hidden="true">
                <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-opacity=".3" /><path d="M24 5 30 26H18z" fill="currentColor" /><path d="M24 43 18 26h12z" fill="currentColor" fill-opacity=".25" /></svg>
              </div>
              <div>
                <div class="r-km">{{ route.km }} <small>គីឡូម៉ែត្រ</small></div>
                <div class="r-dir">ទិស{{ route.dir }} · {{ route.degLabel }}<span v-if="heading !== null"> · តាមទូរស័ព្ទ</span></div>
              </div>
            </div>
            <p v-if="geoError" class="c-err">{{ geoError }}</p>

            <div class="c-actions">
              <button class="act" :disabled="locating" @click="locate">
                <KhmerIcon name="pin" :size="16" />{{ locating ? 'កំពុងរក…' : me ? 'ធ្វើបច្ចុប្បន្នភាព' : 'ចម្ងាយពីខ្ញុំ' }}
              </button>
              <a class="act primary" :href="directionsUrl" target="_blank" rel="noopener"><KhmerIcon name="compass" :size="16" />ផ្លូវទៅ ↗</a>
              <button v-if="canCompass && me" class="act" @click="startCompass"><KhmerIcon name="compass" :size="16" />ត្រីវិស័យ</button>
              <NuxtLink v-if="full && eraLink" :to="`/era/${eraLink}`" class="act">អានប្រវត្តិ →</NuxtLink>
            </div>
          </div>
        </aside>
      </Transition>
    </div>

    <div v-if="!full && !country && places.length > 1" class="pm-rail">
      <button v-for="p in places" :key="p.id" :class="{ on: p.id === selectedId }" @click="select(p.id)">
        <KhmerIcon :name="p.icon" :size="16" />{{ p.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pm{--glass:rgba(10,17,13,.84);border:1px solid rgba(212,175,55,.22);border-radius:var(--r-xl);overflow:hidden;background:var(--moss-3);box-shadow:0 30px 70px rgba(0,0,0,.35);contain:layout paint}
.pm-stage{position:relative}
.pm-map{height:480px;background:#0B1310}
.full,.full .pm-stage,.full .pm-map{height:100%}
.fs .pm-stage,.fs .pm-map{height:100vh}

.pm-loading{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:10px;font-family:var(--khmer);line-height:1.9;color:var(--stone);background:radial-gradient(60% 60% at 50% 50%,rgba(46,74,53,.5),#0B1310)}
.spin{color:var(--gold-2);animation:pm-spin 2.4s linear infinite}
@keyframes pm-spin{to{transform:rotate(360deg)}}

/* glass surfaces — near-solid backgrounds instead of heavy backdrop blur keep panning smooth */
.pm-seg,.pm-ctrl,.pm-card,.pm-country{background:var(--glass);border:1px solid rgba(212,175,55,.22);box-shadow:0 12px 30px rgba(0,0,0,.4)}

.pm-seg{position:absolute;top:14px;left:14px;display:flex;padding:3px;border-radius:var(--r-pill);z-index:3}
.pm-seg button{font-family:var(--khmer);font-size:.82rem;line-height:1.8;padding:2px 14px;border-radius:var(--r-pill);border:0;background:none;color:var(--ivory-dim);cursor:pointer;transition:background .25s,color .25s}
.pm-seg button.on{background:linear-gradient(180deg,var(--gold-2),var(--gold));color:var(--night)}

.pm-ctrl{position:absolute;top:14px;right:14px;display:flex;flex-direction:column;padding:4px;border-radius:var(--r-md);z-index:3}
.pm-ctrl button{width:36px;height:36px;display:grid;place-items:center;border:0;background:none;border-radius:var(--r-sm);color:var(--gold-2);cursor:pointer;transition:background .2s}
.pm-ctrl button:hover{background:rgba(212,175,55,.14)}
.pm-ctrl button.on{background:rgba(212,175,55,.22);color:#FFF1C4}
.pm-ctrl svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:transform .3s}
.pm-ctrl .north .fill{fill:currentColor}
.pm-ctrl .sep{height:1px;margin:4px 6px;background:rgba(212,175,55,.2)}

.pm-country{position:absolute;left:14px;bottom:14px;max-width:440px;display:flex;gap:12px;align-items:center;padding:14px 18px;border-radius:var(--r-lg);color:var(--gold-2);z-index:3}
.pm-country p{font-family:var(--khmer);font-size:.92rem;line-height:1.95;color:var(--ivory)}

.pm-card{position:absolute;left:14px;top:62px;width:min(380px,calc(100% - 90px));max-height:calc(100% - 76px);overflow:auto;border-radius:var(--r-xl);z-index:4;scrollbar-width:thin;overscroll-behavior:contain}
.x{position:absolute;top:8px;right:8px;z-index:2;width:30px;height:30px;border-radius:var(--r-sm);border:1px solid rgba(212,175,55,.3);background:rgba(10,17,13,.8);color:var(--gold-2);font-size:1.1rem;line-height:1;cursor:pointer}
.c-img{height:128px;overflow:hidden;position:relative}
.c-img img{width:100%;height:100%;object-fit:cover}
.c-img::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(10,17,13,.95))}
.c-body{padding:14px 18px 18px;display:flex;flex-direction:column;gap:10px}
.c-img + .c-body{margin-top:-34px;position:relative}
.c-head{display:flex;gap:12px;align-items:center;padding-right:28px}
.c-ic{flex:none;width:46px;height:46px;border-radius:var(--r-md);display:grid;place-items:center;background:var(--moss-3);border:1px solid var(--gold);color:var(--gold-2)}
.c-name{font-family:var(--title);font-size:1.2rem;line-height:1.8;color:var(--ivory)}
.c-sub{font-family:var(--khmer);font-size:.78rem;line-height:1.8;color:var(--stone)}
.c-path{display:flex;align-items:flex-start;gap:6px;font-family:var(--khmer);font-size:.8rem;line-height:1.9;color:var(--gold-2)}
.c-path :deep(.kh-icon){flex:none;margin-top:6px}
.c-facts{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;margin:0}
.c-facts div{display:contents}
.c-facts dt{font-family:var(--khmer);font-size:.76rem;line-height:1.9;color:var(--stone)}
.c-facts dd{font-family:var(--khmer);font-size:.82rem;line-height:1.9;color:var(--ivory);margin:0}
.c-note{font-family:var(--khmer);font-size:.86rem;line-height:1.95;color:var(--ivory);padding-left:12px;border-left:2px solid var(--gold)}
.c-hist{background:rgba(46,74,53,.35);border:1px solid rgba(212,175,55,.14);border-radius:var(--r-md);padding:10px 12px}
.c-hist p{font-family:var(--khmer);font-size:.84rem;line-height:2;color:var(--ivory-dim)}
.c-hist[lang="en"] p{font-family:Georgia,serif;font-size:.9rem;line-height:1.65}
.c-hist a,.c-src a{font-family:var(--khmer);font-size:.76rem;color:var(--gold-2)}
.c-era{border-radius:var(--r-md);padding:10px 12px;background:linear-gradient(135deg,rgba(212,175,55,.1),rgba(46,74,53,.35));border:1px solid rgba(212,175,55,.2)}
.c-era h4{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;font-family:var(--khmer);font-weight:400;font-size:.76rem;line-height:1.9;color:var(--stone)}
.c-era h4 b{font-family:var(--title);font-weight:400;font-size:.9rem;color:var(--gold-2)}
.c-era h4 span{font-size:.72rem;color:var(--stone);margin-left:auto}
.c-era p{font-family:var(--khmer);font-size:.82rem;line-height:2;color:var(--ivory-dim);margin-top:2px}
.c-era a{font-family:var(--khmer);font-size:.76rem;color:var(--gold-2)}
.c-near{display:flex;align-items:center;gap:6px;text-align:left;font-family:var(--khmer);font-size:.78rem;line-height:1.8;color:var(--ivory-dim);background:none;border:0;padding:0;cursor:pointer}
.c-near b{font-weight:400;color:var(--gold-2)}
.c-near:hover b{text-decoration:underline}
.c-src{display:flex;gap:12px}
.c-events{display:flex;flex-direction:column;gap:2px}
.c-events span{font-family:var(--khmer);font-size:.8rem;line-height:1.85;color:var(--ivory-dim)}
.c-events b{font-family:var(--title);font-weight:400;color:var(--gold-2);margin-right:6px}
.c-coord{display:flex;align-items:center;gap:6px;flex-wrap:wrap;text-align:left;font-family:var(--khmer);font-size:.76rem;line-height:1.8;color:var(--ivory-dim);background:rgba(46,74,53,.35);border:1px solid rgba(212,175,55,.14);border-radius:var(--r-sm);padding:4px 10px;cursor:pointer}
.c-coord em{margin-left:auto;font-style:normal;color:var(--gold-2)}
.c-route{display:flex;gap:14px;align-items:center;padding:10px 14px;border-radius:var(--r-md);background:linear-gradient(135deg,rgba(212,175,55,.14),rgba(46,74,53,.4));border:1px solid rgba(212,175,55,.25)}
.needle{width:50px;height:50px;color:var(--gold-2);flex:none;transition:transform .4s var(--ease)}
.r-km{font-family:var(--title);font-size:1.45rem;line-height:1.7;color:var(--ivory)}
.r-km small{font-family:var(--khmer);font-size:.75rem;color:var(--stone)}
.r-dir{font-family:var(--khmer);font-size:.82rem;line-height:1.8;color:var(--gold-2)}
.c-err{font-family:var(--khmer);font-size:.8rem;line-height:1.8;color:#E7A38D}
.c-actions{display:flex;flex-wrap:wrap;gap:8px}
.act{display:inline-flex;align-items:center;gap:6px;font-family:var(--khmer);font-size:.84rem;line-height:1.8;padding:5px 14px;border-radius:var(--r-pill);border:1px solid var(--gold-dim);color:var(--gold-2);background:rgba(10,17,13,.5);cursor:pointer;transition:background .25s}
.act:hover{background:rgba(212,175,55,.14)}
.act.primary{background:linear-gradient(180deg,var(--gold-2),var(--gold));color:var(--night);border-color:transparent}
.act:disabled{opacity:.6}

.card-enter-active,.card-leave-active{transition:opacity .3s var(--ease),transform .3s var(--ease)}
.card-enter-from,.card-leave-to{opacity:0;transform:translateX(-12px)}

.pm-rail{display:flex;gap:8px;padding:12px 14px;overflow-x:auto;border-top:1px solid rgba(212,175,55,.14);scrollbar-width:thin}
.pm-rail button{flex:none;display:inline-flex;align-items:center;gap:6px;font-family:var(--khmer);font-size:.82rem;line-height:1.9;padding:3px 14px;border-radius:var(--r-pill);border:1px solid rgba(212,175,55,.25);background:transparent;color:var(--ivory-dim);cursor:pointer;transition:all .25s}
.pm-rail button.on,.pm-rail button:hover{border-color:var(--gold);color:var(--gold-2);background:rgba(212,175,55,.1)}

@media (max-width:700px){
  .pm-map{height:380px}
  .full .pm-stage{display:flex;flex-direction:column}
  .full .pm-map{flex:1;min-height:300px}
  .pm-card{position:relative;top:auto;left:auto;width:auto;max-height:none;border-radius:0;border-width:1px 0 0;box-shadow:none;background:var(--moss-3)}
  .pm-seg{top:10px;left:10px}
  .pm-ctrl{top:10px;right:10px}
  .pm-country{left:10px;right:10px;bottom:10px;max-width:none}
}
</style>

<style>
/* MapLibre chrome (global: MapLibre builds this DOM). */
.pm .maplibregl-ctrl-attrib{background:rgba(10,17,13,.8)!important;color:var(--stone);font-size:10px;line-height:1.6}
.pm .maplibregl-ctrl-attrib a{color:var(--gold-2)}
.pm .maplibregl-ctrl-attrib-button{background-color:rgba(232,201,106,.9);border-radius:50%}
.pm .maplibregl-ctrl-attrib.maplibregl-compact{border-radius:var(--r-sm);margin:0 8px 8px 0}
.pm .maplibregl-cooperative-gesture-screen{font-family:var(--khmer);background:rgba(10,17,13,.72);color:var(--ivory);font-size:1rem;line-height:2}
.kh-tip .maplibregl-popup-content{background:rgba(10,17,13,.92);color:var(--ivory);font-family:var(--khmer);font-size:.82rem;line-height:1.8;padding:2px 12px;border-radius:var(--r-pill);border:1px solid rgba(212,175,55,.35);box-shadow:0 6px 18px rgba(0,0,0,.5)}
.kh-tip .maplibregl-popup-tip{display:none}
.kh-me{width:18px;height:18px;border-radius:50%;background:#7FA8A0;border:3px solid #0B1310;box-shadow:0 0 0 0 rgba(127,168,160,.6);animation:kh-me 2s ease-out infinite}
@keyframes kh-me{to{box-shadow:0 0 0 18px rgba(127,168,160,0)}}
</style>
