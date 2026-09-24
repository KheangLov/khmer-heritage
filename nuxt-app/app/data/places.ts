// Historic places with verified coordinates.
// Source for every point: English Wikipedia geodata (prop=coordinates) or,
// where the article has none, its Wikidata item's P625 — fetched 2026-09-24,
// not typed from memory. `approx` marks points Wikidata only gives to ~1 km
// (rounded minutes), so the UI can say so.
import type { KhmerIconName } from '~/components/KhmerIcon.vue'

export interface Place {
  id: string
  name: string // Khmer
  en: string
  province: string // Khmer province (country noted when outside Cambodia)
  lat: number
  lng: number
  icon: KhmerIconName
  approx?: boolean
  img?: string // photo in public/images/ of this very place
}
// A place as shown on one page, with why it belongs there.
export interface PlaceView extends Place { note?: string }
export interface PlaceLink { id: string; note?: string }

export const PLACES: Record<string, Place> = {
  'laang-spean': { id: 'laang-spean', name: 'រូងភ្នំល្អាងស្ពាន', en: 'Laang Spean Cave', province: 'បាត់ដំបង', lat: 12.85, lng: 102.916667, icon: 'stele', approx: true },
  'angkor-borei': { id: 'angkor-borei', name: 'អង្គរបុរី និងភ្នំដា', en: 'Angkor Borei & Phnom Da', province: 'តាកែវ', lat: 10.964252, lng: 104.988755, icon: 'naga', img: '/images/angkor-borei.jpg' },
  'oc-eo': { id: 'oc-eo', name: 'អូរកែវ', en: 'Óc Eo', province: 'អានយ៉ាង (វៀតណាម)', lat: 10.232944, lng: 105.162994, icon: 'boat' },
  'sambor-prei-kuk': { id: 'sambor-prei-kuk', name: 'សំបូរព្រៃគុក', en: 'Sambor Prei Kuk', province: 'កំពង់ធំ', lat: 12.867283, lng: 105.040025, icon: 'kbach', img: '/images/sambor-prei-kuk.jpg' },
  'phnom-kulen': { id: 'phnom-kulen', name: 'ភ្នំគូលែន', en: 'Phnom Kulen', province: 'សៀមរាប', lat: 13.612778, lng: 104.1125, icon: 'crown', img: '/images/phnom-kulen.jpg' },
  bakong: { id: 'bakong', name: 'ប្រាសាទបាគង', en: 'Bakong', province: 'សៀមរាប', lat: 13.335987, lng: 103.974116, icon: 'temple', img: '/images/bakong.jpg' },
  lolei: { id: 'lolei', name: 'ប្រាសាទលលៃ', en: 'Lolei', province: 'សៀមរាប', lat: 13.35277778, lng: 103.97388889, icon: 'water', img: '/images/lolei-lintel.jpg' },
  'phnom-bakheng': { id: 'phnom-bakheng', name: 'ភ្នំបាខែង', en: 'Phnom Bakheng', province: 'សៀមរាប', lat: 13.42418, lng: 103.85601, icon: 'temple' },
  'koh-ker': { id: 'koh-ker', name: 'កោះកេរ្តិ៍', en: 'Koh Ker', province: 'ព្រះវិហារ', lat: 13.783333, lng: 104.533333, icon: 'stupa', approx: true, img: '/images/koh-ker.jpg' },
  'banteay-srei': { id: 'banteay-srei', name: 'ប្រាសាទបន្ទាយស្រី', en: 'Banteay Srei', province: 'សៀមរាប', lat: 13.59888889, lng: 103.96277778, icon: 'rumdul', img: '/images/banteay-srei.jpg' },
  baphuon: { id: 'baphuon', name: 'ប្រាសាទបាពួន', en: 'Baphuon', province: 'សៀមរាប', lat: 13.44361111, lng: 103.85583333, icon: 'temple', img: '/images/baphuon.jpg' },
  'angkor-wat': { id: 'angkor-wat', name: 'អង្គរវត្ត', en: 'Angkor Wat', province: 'សៀមរាប', lat: 13.4125, lng: 103.86666667, icon: 'temple', img: '/images/angkor-wat.jpg' },
  bayon: { id: 'bayon', name: 'ប្រាសាទបាយ័ន', en: 'Bayon', province: 'សៀមរាប', lat: 13.44111111, lng: 103.85861111, icon: 'bayon', img: '/images/bayon-faces.jpg' },
  'angkor-thom': { id: 'angkor-thom', name: 'អង្គរធំ', en: 'Angkor Thom', province: 'សៀមរាប', lat: 13.443302, lng: 103.859682, icon: 'bayon', img: '/images/angkor-thom-gate.jpg' },
  'ta-prohm': { id: 'ta-prohm', name: 'ប្រាសាទតាព្រហ្ម', en: 'Ta Prohm', province: 'សៀមរាប', lat: 13.435, lng: 103.88916667, icon: 'leaf', img: '/images/ta-prohm.jpg' },
  'preah-khan': { id: 'preah-khan', name: 'ប្រាសាទព្រះខ័ន', en: 'Preah Khan', province: 'សៀមរាប', lat: 13.4619594, lng: 103.8715911, icon: 'kbach', img: '/images/preah-khan.jpg' },
  longvek: { id: 'longvek', name: 'លង្វែក', en: 'Longvek', province: 'កំពង់ឆ្នាំង', lat: 11.86472222, lng: 104.75388889, icon: 'puppet' },
  oudong: { id: 'oudong', name: 'ឧដុង្គ', en: 'Oudong', province: 'កំពង់ស្ពឺ', lat: 11.816667, lng: 104.75, icon: 'parasol', approx: true, img: '/images/oudong.jpg' },
  'royal-palace': { id: 'royal-palace', name: 'ព្រះបរមរាជវាំង', en: 'Royal Palace', province: 'ភ្នំពេញ', lat: 11.563681, lng: 104.931119, icon: 'crown', img: '/images/royal-palace.jpg' },
  'independence-monument': { id: 'independence-monument', name: 'វិមានឯករាជ្យ', en: 'Independence Monument', province: 'ភ្នំពេញ', lat: 11.5564, lng: 104.9281, icon: 'star', img: '/images/independence-monument.jpg' },
  'tuol-sleng': { id: 'tuol-sleng', name: 'សារមន្ទីរឧក្រិដ្ឋកម្មប្រល័យពូជសាសន៍ទួលស្លែង', en: 'Tuol Sleng', province: 'ភ្នំពេញ', lat: 11.54944444, lng: 104.91777778, icon: 'incense', img: '/images/tuol-sleng.jpg' },
  'choeung-ek': { id: 'choeung-ek', name: 'ជើងឯក', en: 'Choeung Ek', province: 'ភ្នំពេញ', lat: 11.484389, lng: 104.901972, icon: 'incense' },
  // Wikipedia geodata: centre of the lake (it changes size with the seasons).
  'tonle-sap': { id: 'tonle-sap', name: 'បឹងទន្លេសាប', en: 'Tonle Sap Lake', province: 'សៀមរាប · បាត់ដំបង · ពោធិ៍សាត់ · កំពង់ឆ្នាំង · កំពង់ធំ', lat: 12.88333333, lng: 104.06666667, icon: 'water', approx: true, img: '/images/tonle-sap.jpg' },
  'preah-vihear': { id: 'preah-vihear', name: 'ប្រាសាទព្រះវិហារ', en: 'Preah Vihear', province: 'ព្រះវិហារ', lat: 14.39055556, lng: 104.68027778, icon: 'parasol', img: '/images/preah-vihear.jpg' },
}

// Places for each long-form article (first = primary).
export const ERA_PLACES: Record<string, string[]> = {
  'era-0': ['laang-spean'],
  'era-1': ['angkor-borei', 'oc-eo'],
  'era-2': ['sambor-prei-kuk', 'angkor-borei'],
  'era-3': ['phnom-kulen'],
  'era-4': ['bakong', 'lolei', 'phnom-bakheng'],
  'era-5': ['banteay-srei'],
  'era-6': ['angkor-wat'],
  'era-7': ['bayon', 'angkor-thom', 'ta-prohm', 'preah-khan'],
  'era-8': ['angkor-thom'],
  'era-9': ['angkor-thom', 'ta-prohm'],
  'era-10': ['longvek', 'oudong'],
  'era-11': ['angkor-wat', 'preah-khan'],
  'era-12': ['independence-monument', 'royal-palace'],
  'era-13': ['tuol-sleng', 'choeung-ek'],
  'era-14': ['angkor-wat', 'preah-vihear', 'sambor-prei-kuk', 'koh-ker'],
}
// Heritage pages: the places a source ties to each tradition, with the reason.
// Sources: the site's own articles; English Wikipedia (Bokator, Krama, Prahok,
// Tonlé Sap); UNESCO lists no single location for chapei, sbek thom or
// lbokator, so none is invented.
export const HERITAGE_PLACES: Record<string, PlaceLink[]> = {
  angkor: [
    { id: 'angkor-wat', note: 'ប្រាសាទសាសនាធំបំផុតលើលោក — ចុះបញ្ជីយូណេស្កូ ១៩៩២' },
    { id: 'angkor-thom', note: 'រាជធានីចុងក្រោយនៃអាណាចក្រ ដែលព្រះបាទជ័យវរ្ម័នទី៧ កសាង' },
    { id: 'bayon' }, { id: 'ta-prohm' }, { id: 'preah-khan' }, { id: 'banteay-srei' },
  ],
  'koh-ker': [{ id: 'koh-ker', note: 'រាជធានីលិង្គបុរៈ (៩២៨–៩៤៤) — ចុះបញ្ជីយូណេស្កូ ២០២៣' }],
  'preah-vihear': [{ id: 'preah-vihear', note: 'ប្រាសាទលើច្រាំងថ្មភ្នំដងរែក — ចុះបញ្ជីយូណេស្កូ ២០០៨' }],
  'sambor-prei-kuk': [{ id: 'sambor-prei-kuk', note: 'ឦសានបុរៈ រាជធានីចេនឡា — ចុះបញ្ជីយូណេស្កូ ២០១៧' }],
  'memorial-sites': [
    { id: 'tuol-sleng', note: 'អតីតមន្ទីរឃុំឃាំង S-21 — សព្វថ្ងៃជាសារមន្ទីរ' },
    { id: 'choeung-ek', note: 'វាលពិឃាតជើងឯក — ទីកន្លែងរំលឹកវិញ្ញាណក្ខន្ធ' },
  ],
  apsara: [
    { id: 'royal-palace', note: 'របាំព្រះរាជទ្រព្យ កើត និងរស់នៅក្នុងព្រះបរមរាជវាំង' },
    { id: 'angkor-wat', note: 'ក្បាច់អប្សរាត្រូវបានបង្កើតឡើងវិញ ពីចម្លាក់ទេវតា និងអប្សរានៃអង្គរវត្ត' },
  ],
  lbokator: [
    { id: 'angkor-wat', note: 'ចម្លាក់លៀនស្រាលនៃកងទ័ពអង្គរ — ក្បាច់ប្រយុទ្ធដៃទទេ និងអាវុធ' },
    { id: 'bayon', note: 'ចម្លាក់លៀនស្រាលនៅបាយ័ន បង្ហាញក្បាច់គុនសម័យអង្គរ' },
    { id: 'royal-palace', note: 'ឆ្នាំ ១៩៣០ ក្បាច់គុនបុរាណ ត្រូវបានសម្តែងថ្វាយនៅព្រះបរមរាជវាំង ក្នុងពិធីចូលឆ្នាំ' },
  ],
  krama: [
    { id: 'angkor-borei', note: 'រូបចម្លាក់ព្រះនៅអង្គរបុរី ស្លៀកក្បិន — ទម្រង់ដើមនៃក្រមា (សតវត្សទី ១–៥)' },
    { id: 'angkor-thom', note: 'ជីវ តាក្វាន់ (១២៩៦) កត់ត្រាថា ក្រណាត់ល្អៗត្រូវបានត្បាញនៅទីនេះ' },
  ],
  'sbek-thom': [
    { id: 'angkor-wat', note: 'ចម្លាក់សង្គ្រាមលង្កា (រាមកេរ្តិ៍) នៅថែវខាងលិច — រឿងដែលស្បែកធំសម្តែង' },
  ],
  amok: [
    { id: 'tonle-sap', note: 'ត្រីទឹកសាប និងប្រហុក — ធាតុផ្សំសំខាន់នៃអាម៉ុក — ភាគច្រើនមកពីបឹងទន្លេសាប' },
  ],
}
// Traditions practised nationwide with no single site: the map shows the
// whole of Cambodia instead of an invented pin.
export const HERITAGE_COUNTRY: Record<string, string> = {
  chapei: 'ចាប៉ីដងវែង រស់នៅក្នុងសហគមន៍ទូទាំងប្រទេសកម្ពុជា — យូណេស្កូមិនកំណត់ទីតាំងតែមួយទេ។',
}
export const CAMBODIA_BOUNDS: [[number, number], [number, number]] = [[102.3, 10.4], [107.65, 14.7]]

export const placesFor = (links: Array<string | PlaceLink> | undefined): PlaceView[] =>
  (links ?? []).flatMap((l) => {
    const link = typeof l === 'string' ? { id: l } : l
    const p = PLACES[link.id]
    return p ? [{ ...p, note: link.note }] : []
  })

// ---- Geometry: great-circle distance and initial bearing ----
const rad = (d: number) => (d * Math.PI) / 180
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dLat = rad(bLat - aLat)
  const dLng = rad(bLng - aLng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}
export function bearingDeg(aLat: number, aLng: number, bLat: number, bLng: number) {
  const y = Math.sin(rad(bLng - aLng)) * Math.cos(rad(bLat))
  const x = Math.cos(rad(aLat)) * Math.sin(rad(bLat)) - Math.sin(rad(aLat)) * Math.cos(rad(bLat)) * Math.cos(rad(bLng - aLng))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}
// Traditional Khmer eight directions (ទិសទាំងប្រាំបី).
const KHMER_DIRS = ['ខាងជើង', 'ឦសាន', 'ខាងកើត', 'អាគ្នេយ៍', 'ខាងត្បូង', 'និរតី', 'ខាងលិច', 'ពាយព្យ']
export const khmerDirection = (deg: number) => KHMER_DIRS[Math.round(deg / 45) % 8]
