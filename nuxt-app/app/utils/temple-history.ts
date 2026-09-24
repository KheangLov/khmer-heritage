// Historical context for every temple on the map.
//
// About 80 temples have a Wikipedia article; the rest have at most a period
// label from Wikidata/OSM ("គ.ស. ៨៨១", "សតវត្សទី ១២", "សម័យអង្គរ") or nothing.
// This maps that label onto the established periods of Khmer history, each
// with a short summary and a link to the closest era page on this site, so
// every temple card can place the temple in its history. The summaries are
// about the period, never claims about the individual temple; undated temples
// say so and get the general context for an ancient prasat or a historic wat.

export interface HistoryPeriod {
  id: string
  name: string
  range: string
  text: string
  /** where "read more" goes: an era page or the timeline */
  to: string
  dated: boolean
}

interface Span { id: string; from: number; to: number; name: string; range: string; text: string; era: string }

// Years are CE; `to` is inclusive.
const SPANS: Span[] = [
  {
    id: 'funan', from: -Infinity, to: 549, era: 'era-1',
    name: 'សម័យនគរភ្នំ (ហ្វូណន)', range: 'សតវត្សទី ១–៦',
    text: 'នគរភ្នំជារដ្ឋពាណិជ្ជកម្មតាមសមុទ្រ នៅតំបន់ដីសណ្ដទន្លេមេគង្គ ដែលទទួលឥទ្ធិពលសាសនាព្រាហ្មណ៍ និងព្រះពុទ្ធសាសនាពីឥណ្ឌា។ អង្គរបុរី នៅខេត្តតាកែវ ជាទីក្រុងសំខាន់មួយនៃសម័យនេះ។',
  },
  {
    id: 'chenla', from: 550, to: 801, era: 'era-2',
    name: 'សម័យចេនឡា', range: 'សតវត្សទី ៦–៨',
    text: 'អំណាចផ្លាស់ទីមកតំបន់ខាងក្នុងទ្វីប។ ប្រាសាទឥដ្ឋដំបូងៗ ដូចជាក្រុមប្រាសាទសំបូរព្រៃគុក (ឦសានបុរៈ) កសាងឡើងក្នុងរជ្ជកាលព្រះបាទឦសានវរ្ម័នទី ១ ហើយសិលាចារឹកភាសាខ្មែរចាស់ដំបូងៗ ក៏កើតមាននៅសម័យនេះដែរ។',
  },
  {
    id: 'founding', from: 802, to: 876, era: 'era-3',
    name: 'កំណើតអាណាចក្រអង្គរ', range: 'គ.ស. ៨០២–៨៧៦',
    text: 'ក្នុងឆ្នាំ ៨០២ ព្រះបាទជ័យវរ្ម័នទី ២ រាជាភិសេកជាស្តេចចក្រពត្តិ នៅភ្នំគូលែន — ជាចំណុចចាប់ផ្ដើមនៃសម័យអង្គរ។ ប្រាសាទនៃសម័យនេះភាគច្រើនធ្វើពីឥដ្ឋ ហើយលទ្ធិទេវរាជក្លាយជាមូលដ្ឋាននៃរាជ្យ។',
  },
  {
    id: 'temple-mountains', from: 877, to: 966, era: 'era-4',
    name: 'សម័យភ្នំប្រាសាទដំបូង', range: 'គ.ស. ៨៧៧–៩៦៦',
    text: 'ព្រះបាទឥន្ទ្រវរ្ម័នទី ១ កសាងប្រាសាទបាគង (៨៨១) — ភ្នំប្រាសាទធំដំបូងដែលធ្វើពីថ្មភក់ — នៅហរិហរាល័យ (រលួស)។ ព្រះបាទយសោវរ្ម័នទី ១ បង្កើតរាជធានីយសោធរបុរៈ ជុំវិញភ្នំបាខែង ហើយព្រះបាទជ័យវរ្ម័នទី ៤ ផ្លាស់រាជធានីទៅកោះកេរ (៩២៨–៩៤៤)។',
  },
  {
    id: 'classic', from: 967, to: 1112, era: 'era-5',
    name: 'សម័យអង្គរកណ្ដាល', range: 'គ.ស. ៩៦៧–១១១២',
    text: 'ព្រះបាទរាជេន្ទ្រវរ្ម័ន នាំរាជធានីត្រឡប់មកអង្គរវិញ ហើយប្រាសាទបន្ទាយស្រី (៩៦៧) ត្រូវបានកសាងដោយព្រាហ្មណ៍យជ្ញវរាហៈ។ ក្រោយមក ព្រះបាទសូរ្យវរ្ម័នទី ១ ពង្រីកអាណាចក្រ និងប្រាសាទព្រះវិហារ ហើយព្រះបាទឧទយាទិត្យវរ្ម័នទី ២ កសាងប្រាសាទបាពួន (ប្រហែល ១០៦០)។',
  },
  {
    id: 'angkor-wat', from: 1113, to: 1180, era: 'era-6',
    name: 'សម័យអង្គរវត្ត', range: 'គ.ស. ១១១៣–១១៨០',
    text: 'ព្រះបាទសូរ្យវរ្ម័នទី ២ កសាងប្រាសាទអង្គរវត្ត ឧទ្ទិសដល់ព្រះវិស្ណុ — ជាកំពូលនៃស្ថាបត្យកម្មខ្មែរ។ ប្រាសាទបឹងមាលា បន្ទាយសំរែ និងធម្មនន្ទ ក៏ជាស្នាដៃនៃរចនាប័ទ្មអង្គរវត្តដែរ។',
  },
  {
    id: 'bayon', from: 1181, to: 1243, era: 'era-7',
    name: 'សម័យបាយ័ន', range: 'គ.ស. ១១៨១–១២៤៣',
    text: 'ព្រះបាទជ័យវរ្ម័នទី ៧ រំដោះអាណាចក្រពីចម្ប៉ា ហើយកសាងរាជធានីអង្គរធំ ជាមួយប្រាសាទបាយ័ន តាព្រហ្ម ព្រះខ័ន និងបន្ទាយឆ្មារ ព្រមទាំងមន្ទីរពេទ្យ និងផ្ទះសំណាក់តាមផ្លូវថ្នល់ — ជាសម័យដែលព្រះពុទ្ធសាសនាមហាយានរីកចម្រើនខ្លាំង។',
  },
  {
    id: 'late-angkor', from: 1244, to: 1430, era: 'era-8',
    name: 'សម័យចុងអង្គរ', range: 'គ.ស. ១២៤៤–១៤៣០',
    text: 'ព្រះពុទ្ធសាសនាថេរវាទរីករាលដាលក្នុងចំណោមប្រជាជន ហើយការកសាងប្រាសាទថ្មធំៗបានថយចុះ។ ក្នុងឆ្នាំ ១២៩៦–១២៩៧ ទូតចិន ចូវដាក្វាន់ បានកត់ត្រាជីវិតប្រចាំថ្ងៃនៅអង្គរ។',
  },
  {
    id: 'post-angkor', from: 1431, to: 1862, era: 'era-9',
    name: 'សម័យក្រោយអង្គរ', range: 'គ.ស. ១៤៣១–១៨៦២',
    text: 'បន្ទាប់ពីអយុធ្យាវាយលុកអង្គរ (១៤៣១) រាជធានីខ្មែរបានផ្លាស់ទៅទិសខាងត្បូង — ស្រីសន្ធរ ភ្នំពេញ លង្វែក និងឧដុង្គ។ វត្តអារាមព្រះពុទ្ធសាសនាថេរវាទ ចេតិយ និងព្រះពុទ្ធរូបធំៗ ក្លាយជាសំណង់សាសនាចម្បង ហើយប្រាសាទចាស់ៗខ្លះត្រូវបានកែប្រែជាទីសក្ការៈព្រះពុទ្ធ។',
  },
  {
    id: 'protectorate', from: 1863, to: 1952, era: 'era-11',
    name: 'សម័យអាណាព្យាបាលបារាំង', range: 'គ.ស. ១៨៦៣–១៩៥៣',
    text: 'កម្ពុជាស្ថិតក្រោមអាណាព្យាបាលបារាំង។ សាលាបារាំងចុងបូព៌ា (EFEO) បានសិក្សា ចុះបញ្ជី និងជួសជុលប្រាសាទបុរាណ ខណៈដែលវត្តថ្មីៗជាច្រើនត្រូវបានកសាងឡើង។',
  },
  {
    id: 'independence', from: 1953, to: 1974, era: 'era-12',
    name: 'សម័យក្រោយឯករាជ្យ', range: 'គ.ស. ១៩៥៣–១៩៧៤',
    text: 'បន្ទាប់ពីឯករាជ្យ (១៩៥៣) សំណង់សាសនា និងវប្បធម៌ជាច្រើនត្រូវបានកសាង និងជួសជុល ក្នុងចលនារស់ឡើងវិញនៃវប្បធម៌ជាតិ។',
  },
  {
    id: 'khmer-rouge', from: 1975, to: 1979, era: 'era-13',
    name: 'របបខ្មែរក្រហម', range: 'គ.ស. ១៩៧៥–១៩៧៩',
    text: 'របបខ្មែរក្រហមបានហាមឃាត់សាសនា — វត្តអារាមជាច្រើនត្រូវបានបំផ្លាញ ឬប្រើជាឃ្លាំង និងមន្ទីរឃុំឃាំង ហើយព្រះសង្ឃត្រូវបានបង្ខំឲ្យសឹក។',
  },
  {
    id: 'revival', from: 1980, to: Infinity, era: 'era-14',
    name: 'សម័យស្ដារឡើងវិញ', range: 'គ.ស. ១៩៨០–បច្ចុប្បន្ន',
    text: 'ចាប់ពីទសវត្សរ៍ ១៩៨០ វត្តអារាមត្រូវបានស្ដារឡើងវិញ ហើយក្នុងឆ្នាំ ១៩៩២ អង្គរត្រូវបានចុះក្នុងបញ្ជីបេតិកភណ្ឌពិភពលោក UNESCO — ការអភិរក្សប្រាសាទទូទាំងប្រទេសបន្តរហូតដល់សព្វថ្ងៃ។',
  },
]

const ANGKOR: HistoryPeriod = {
  id: 'angkor', name: 'សម័យអង្គរ', range: 'គ.ស. ៨០២–១៤៣១', to: '/timeline', dated: true,
  text: 'សម័យអង្គរជាយុគមាសនៃអាណាចក្រខ្មែរ ដែលគ្រងលើភាគច្រើននៃឧបទ្វីបឥណ្ឌូចិន។ ស្តេចខ្មែរបានកសាងប្រាសាទថ្ម និងឥដ្ឋរាប់ពាន់ ភ្ជាប់ដោយផ្លូវថ្នល់ ស្ពាន និងប្រព័ន្ធបារាយណ៍ធារាសាស្ត្រដ៏ធំ។',
}
const UNDATED: Record<'prasat' | 'wat', HistoryPeriod> = {
  prasat: {
    id: 'undated-prasat', name: 'ប្រាសាទបុរាណខ្មែរ', range: 'មិនទាន់មានកាលបរិច្ឆេទ', to: '/timeline', dated: false,
    text: 'ប្រាសាទនេះមិនទាន់មានកាលបរិច្ឆេទក្នុងទិន្នន័យបើកចំហនៅឡើយទេ។ ប្រាសាទបុរាណខ្មែរភាគច្រើន កសាងឡើងចន្លោះសតវត្សទី ៧ និងទី ១៣ ជាទីសក្ការៈព្រះសិវៈ ព្រះវិស្ណុ ឬព្រះពុទ្ធ — ជាទូទៅបែរមុខទៅទិសខាងកើត ធ្វើពីឥដ្ឋ ថ្មបាយក្រៀម ឬថ្មភក់ ហើយច្រើនហ៊ុំព័ទ្ធដោយគូទឹក និងមានត្រពាំង ឬបារាយណ៍នៅក្បែរ។',
  },
  wat: {
    id: 'undated-wat', name: 'វត្តប្រវត្តិសាស្ត្រ', range: 'មិនទាន់មានកាលបរិច្ឆេទ', to: '/era/era-10', dated: false,
    text: 'វត្តនេះមិនទាន់មានកាលបរិច្ឆេទក្នុងទិន្នន័យបើកចំហនៅឡើយទេ។ តាំងពីព្រះពុទ្ធសាសនាថេរវាទរីករាលដាល ក្រោយសម័យអង្គរ វត្តអារាមជាមជ្ឈមណ្ឌលនៃជីវិតភូមិខ្មែរ — ជាទីសិក្សា ទីធ្វើបុណ្យ និងជាកន្លែងរក្សាទុកសាស្ត្រាស្លឹករឹត។ វត្តខ្លះកសាងលើ ឬក្បែរប្រាសាទបុរាណ។',
  },
}

const KM_DIGIT = /[០-៩]/g
const toLatin = (s: string) => s.replace(KM_DIGIT, (d) => String(d.charCodeAt(0) - 0x17e0))

/** CE year (century → its middle) from a period label written by
 *  scripts/build-temples.py, or null for undated / "Angkor period". */
export function yearOf(label?: string | null): number | null {
  if (!label) return null
  const s = toLatin(label)
  let m = s.match(/^(\d+)\s*មុនគ\.ស\./)
  if (m) return -Number(m[1])
  m = s.match(/សតវត្សទី\s*(\d+)/)
  if (m) return (Number(m[1]) - 1) * 100 + 50
  m = s.match(/(\d{3,4})/) // "គ.ស. ៨៨១", "ទសវត្សរ៍ ១៩៦០"
  return m ? Number(m[1]) : null
}

/** The historical period a temple belongs to, from its period label. */
export function periodOf(t: { y?: string; c: 'prasat' | 'wat' }): HistoryPeriod {
  if (t.y === 'សម័យអង្គរ') return ANGKOR
  const year = yearOf(t.y)
  if (year === null) return UNDATED[t.c]
  const s = SPANS.find((p) => year >= p.from && year <= p.to)!
  // 1431–1499 is the fall itself (era-9); the 16th c. onwards is the Reamker era.
  const era = s.id === 'post-angkor' && year >= 1500 ? 'era-10' : s.era
  return { id: s.id, name: s.name, range: s.range, text: s.text, to: `/era/${era}`, dated: true }
}

// Wikidata heritage designations arrive in English only.
const HERITAGE_KM: Record<string, string> = {
  'World Heritage Site': 'បេតិកភណ្ឌពិភពលោក UNESCO',
  'part of UNESCO World Heritage Site': 'ផ្នែកនៃបេតិកភណ្ឌពិភពលោក UNESCO',
  'Tentative World Heritage Site': 'បញ្ជីបណ្ដោះអាសន្ន បេតិកភណ្ឌពិភពលោក UNESCO',
  'registered Thai historic site': 'ទីតាំងប្រវត្តិសាស្ត្រចុះបញ្ជីនៅថៃ',
}
export const heritageLabel = (l: { km: string | null; en: string | null }) =>
  l.km || (l.en && HERITAGE_KM[l.en]) || l.en || ''
