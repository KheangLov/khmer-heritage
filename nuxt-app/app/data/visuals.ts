// Shared visual mapping for eras, living heritage and the history timeline.
// Every image lives in public/images/ (1920px, served through @nuxt/image);
// licences and authors for the Wikimedia Commons photos are recorded in
// app/data/image-credits.json and listed on the /credits page.
import type { KhmerIconName } from '~/components/KhmerIcon.vue'

export interface Visual { img: string; icon: KhmerIconName; year: string }

// Keyed by content stem (era-N).
export const ERA_VISUALS: Record<string, Visual> = {
  'era-0': { img: '/images/kbal-spean.jpg', icon: 'stele', year: '~៦០០០ មុនគ.ស.' },
  'era-1': { img: '/images/angkor-borei.jpg', icon: 'naga', year: 'ស.វ. ទី១–៦' },
  'era-2': { img: '/images/sambor-prei-kuk.jpg', icon: 'kbach', year: 'ស.វ. ទី៦–៨' },
  'era-3': { img: '/images/phnom-kulen.jpg', icon: 'crown', year: '៨០២' },
  'era-4': { img: '/images/bakong.jpg', icon: 'temple', year: '៨៧៧–៩១០' },
  'era-5': { img: '/images/banteay-srei.jpg', icon: 'rumdul', year: '៩៦៧' },
  'era-6': { img: '/images/angkor-wat.jpg', icon: 'temple', year: '១១១៣–១១៥០' },
  'era-7': { img: '/images/bayon-faces.jpg', icon: 'bayon', year: '១១៨១–១២១៨' },
  'era-8': { img: '/images/angkor-thom-gate.jpg', icon: 'book', year: '១២៩៦' },
  'era-9': { img: '/images/ta-prohm.jpg', icon: 'leaf', year: '១៤៣១' },
  'era-10': { img: '/images/churning-ocean.jpg', icon: 'puppet', year: 'ស.វ. ទី១៦–១៧' },
  'era-11': { img: '/images/banteay-chhmar.jpg', icon: 'stupa', year: '១៨៦៣–១៩៥៣' },
  'era-12': { img: '/images/independence-monument.jpg', icon: 'apsara', year: '១៩៥៣' },
  'era-13': { img: '/images/tuol-sleng.jpg', icon: 'incense', year: '១៩៧៥–១៩៧៩' },
  'era-14': { img: '/images/angkor-reflection.jpg', icon: 'lotus', year: '១៩៩២–បច្ចុប្បន្ន' },
}

// Keyed by heritage slug.
export const HERITAGE_VISUALS: Record<string, Visual> = {
  amok: { img: '/images/amok.jpg', icon: 'bowl', year: 'ម្ហូប' },
  angkor: { img: '/images/angkor-wat.jpg', icon: 'temple', year: '១៩៩២' },
  apsara: { img: '/images/apsara-dance.jpg', icon: 'apsara', year: '២០០៨' },
  chapei: { img: '/images/chapei.jpg', icon: 'chapei', year: '២០១៦' },
  'koh-ker': { img: '/images/koh-ker.jpg', icon: 'stupa', year: '២០២៣' },
  krama: { img: '/images/krama.jpg', icon: 'krama', year: '២០២៤' },
  lbokator: { img: '/images/lbokator.jpg', icon: 'garuda', year: '២០២២' },
  'memorial-sites': { img: '/images/tuol-sleng.jpg', icon: 'incense', year: '២០២៥' },
  'preah-vihear': { img: '/images/preah-vihear.jpg', icon: 'parasol', year: '២០០៨' },
  'sambor-prei-kuk': { img: '/images/sambor-prei-kuk.jpg', icon: 'kbach', year: '២០១៧' },
  'sbek-thom': { img: '/images/sbek-thom.jpg', icon: 'puppet', year: '២០០៨' },
}

const FALLBACK: Visual = { img: '/images/angkor-sunrise.jpg', icon: 'lotus', year: '' }
export const eraVisual = (stem: string) => ERA_VISUALS[stem.replace(/^era\//, '')] ?? FALLBACK
export const heritageVisual = (stem: string) => HERITAGE_VISUALS[stem.replace(/^heritage\//, '')] ?? FALLBACK

// ---- History timeline -------------------------------------------------------
// Dated milestones of Khmer history, grouped into ages. `era` links to the
// matching long-form era article.
export interface TimelineEvent {
  year: string // Khmer-numeral display year
  sort: number // CE year for ordering (negative = BCE)
  title: string
  text: string
  icon: KhmerIconName
  img?: string
  era?: string
  place?: string // id in app/data/places.ts
}
export interface TimelineAge { id: string; name: string; en: string; span: string; events: TimelineEvent[] }

export const TIMELINE: TimelineAge[] = [
  {
    id: 'prehistory', name: 'បុរេប្រវត្តិ', en: 'Prehistory', span: '~៧០០០ – ៥០០ មុនគ.ស.',
    events: [
      { year: '~៦០០០ មុនគ.ស.', sort: -6000, icon: 'stele', era: 'era-0', title: 'រូងភ្នំល្អាងស្ពាន', place: 'laang-spean', text: 'ឧបករណ៍ថ្មហូប៊ីនៀននៅខេត្តបាត់ដំបង — ដាននៃការតាំងទីលំនៅចំណាស់បំផុតមួយនៅអាស៊ីអាគ្នេយ៍ដីគោក។' },
      { year: '~៤២០០ មុនគ.ស.', sort: -4200, icon: 'bowl', era: 'era-0', title: 'គ្រឿងស្មូនដំបូង', place: 'laang-spean', text: 'ដៃដែលធ្លាប់កាន់ថ្ម បានរៀនសូនដីឥដ្ឋ និងដុតភ្លើង — គ្រាប់ពូជនៃសិប្បកម្មខ្មែរ។' },
      { year: '~៥០០ មុនគ.ស.', sort: -500, icon: 'drum', title: 'យុគសំរិទ្ធ និងដែក', text: 'ភូមិរង្វង់ដី ស្រែស្រូវ និងការចាក់សំរិទ្ធ — សហគមន៍ដែលមានរបៀបរៀបរយ និងពិធីការ។' },
    ],
  },
  {
    id: 'funan-chenla', name: 'នគរភ្នំ និងចេនឡា', en: 'Funan & Chenla', span: 'ស.វ. ទី១ – ៨០២',
    events: [
      { year: 'ស.វ. ទី១', sort: 50, icon: 'naga', era: 'era-1', img: '/images/angkor-borei.jpg', title: 'កំណើតនគរភ្នំ', place: 'angkor-borei', text: 'រឿងព្រេងព្រះថោង–នាងនាគ ចងសម្ពន្ធភាពរវាងអ្នកមកពីសមុទ្រ និងកូនស្រីនាគរាជ — ដើមកំណើតនៃជាតិខ្មែរ។' },
      { year: 'ស.វ. ទី២–៤', sort: 250, icon: 'boat', era: 'era-1', img: '/images/mekong.jpg', title: 'កំពង់ផែអូរកែវ', place: 'oc-eo', text: 'ពាណិជ្ជកម្មតភ្ជាប់ឥណ្ឌា ចិន និងរ៉ូម — កាក់រ៉ូម៉ាំង និងត្បូងបានរកឃើញនៅដីសណ្តមេគង្គ។' },
      { year: '៦១១', sort: 611, icon: 'stele', era: 'era-2', title: 'សិលាចារឹកខ្មែរចាស់បំផុត', place: 'angkor-borei', text: 'សិលាចារឹក K.600 នៅអង្គរបុរី ជាអត្ថបទចុះកាលបរិច្ឆេទចាស់បំផុតដែលសរសេរជាភាសាខ្មែរ។' },
      { year: '~៦១៦–៦៣៥', sort: 616, icon: 'kbach', era: 'era-2', img: '/images/sambor-prei-kuk.jpg', title: 'ឦសានបុរៈ', place: 'sambor-prei-kuk', text: 'ព្រះបាទឦសានវរ្ម័នទី១ កសាងរាជធានីសម្បូរព្រៃគុក ជាមួយប្រាសាទឥដ្ឋរាងប្រាំបីជ្រុងដ៏ពិសេស។' },
    ],
  },
  {
    id: 'angkor', name: 'សម័យអង្គរ', en: 'Angkor', span: '៨០២ – ១៤៣១',
    events: [
      { year: '៨០២', sort: 802, icon: 'crown', era: 'era-3', img: '/images/phnom-kulen.jpg', title: 'ភ្នំគូលែន — ទេវរាជ', place: 'phnom-kulen', text: 'ព្រះបាទជ័យវរ្ម័នទី២ ប្រកាសឯករាជ្យ និងធ្វើអភិសេកជាចក្រពត្តិ — កំណើតនៃអាណាចក្រខ្មែរ។' },
      { year: '៨៨១', sort: 881, icon: 'temple', era: 'era-4', img: '/images/bakong.jpg', title: 'ប្រាសាទបាគង', place: 'bakong', text: 'ព្រះបាទឥន្ទ្រវរ្ម័នទី១ សាងប្រាសាទភ្នំដំបូងនៅហរិហរាល័យ — គំរូនៃភ្នំព្រះសុមេរុ។' },
      { year: '៨៩៣', sort: 893, icon: 'water', era: 'era-4', img: '/images/lolei-lintel.jpg', title: 'យសោធរបុរៈ', place: 'phnom-bakheng', text: 'ព្រះបាទយសោវរ្ម័នទី១ បង្កើតរាជធានីអង្គរដំបូង និងបារាយណ៍ខាងកើត — វិស្វកម្មទឹកដ៏អស្ចារ្យ។' },
      { year: '៩២៨', sort: 928, icon: 'stupa', img: '/images/koh-ker.jpg', title: 'កោះកេរ្តិ៍', place: 'koh-ker', text: 'ព្រះបាទជ័យវរ្ម័នទី៤ ផ្លាស់រាជធានីទៅលិង្គបុរៈ ជាមួយប្រាសាទធំប្រាំពីរជាន់។' },
      { year: '៩៦៧', sort: 967, icon: 'rumdul', era: 'era-5', img: '/images/banteay-srei.jpg', title: 'បន្ទាយស្រី', place: 'banteay-srei', text: 'ប្រាសាទថ្មភក់ពណ៌ផ្កាឈូក ដែលឆ្លាក់ដោយភាពល្អិតល្អន់បំផុត — «ត្បូងនៃសិល្បៈខ្មែរ»។' },
      { year: '~១០៦០', sort: 1060, icon: 'temple', img: '/images/baphuon.jpg', title: 'ប្រាសាទបាពួន', place: 'baphuon', text: 'ព្រះបាទឧទ័យាទិត្យវរ្ម័នទី២ សាងភ្នំប្រាសាទដ៏ធំ ដែលជីវ តាក្វាន់ ពណ៌នាថាជា «ប្រាសាទស្ពាន់»។' },
      { year: '១១១៣–១១៥០', sort: 1113, icon: 'temple', era: 'era-6', img: '/images/angkor-wat.jpg', title: 'អង្គរវត្ត', place: 'angkor-wat', text: 'ព្រះបាទសូរ្យវរ្ម័នទី២ សាងប្រាសាទសាសនាធំបំផុតលើលោក ឧទ្ទិសដល់ព្រះវិស្ណុ។' },
      { year: '១១៨១', sort: 1181, icon: 'bayon', era: 'era-7', img: '/images/bayon-faces.jpg', title: 'ព្រះបាទជ័យវរ្ម័នទី៧', place: 'bayon', text: 'អង្គរធំ ប្រាសាទបាយ័ន តាព្រហ្ម និងព្រះខ័ន — ព្រមទាំងមន្ទីរពេទ្យ ១០២ និងផ្ទះសំណាក់តាមផ្លូវ។' },
      { year: '១២៩៦', sort: 1296, icon: 'book', era: 'era-8', img: '/images/angkor-thom-gate.jpg', title: 'ជីវ តាក្វាន់', place: 'angkor-thom', text: 'បេសកជនចិនរស់នៅអង្គរមួយឆ្នាំ ហើយសរសេរកំណត់ត្រាតែមួយគត់អំពីជីវិតប្រចាំថ្ងៃនៃទីក្រុង។' },
      { year: '១៣០៩', sort: 1309, icon: 'stupa', img: '/images/monks.jpg', title: 'ព្រះពុទ្ធសាសនាថេរវាទ', text: 'សិលាចារឹកបាលីដំបូង — ថេរវាទក្លាយជាសាសនារបស់ប្រជាជន ហើយវត្តក្លាយជាបេះដូងនៃភូមិ។' },
      { year: '១៤៣១', sort: 1431, icon: 'leaf', era: 'era-9', img: '/images/ta-prohm.jpg', title: 'លាអង្គរ', place: 'angkor-thom', text: 'ក្រោយការវាយប្រហារពីអយុធ្យា រាជធានីផ្លាស់ទៅចតុមុខ — ព្រៃឈើចាប់ផ្តើមឱបប្រាសាទ។' },
    ],
  },
  {
    id: 'middle', name: 'សម័យកណ្តាល', en: 'Middle Period', span: '១៤៣១ – ១៨៦៣',
    events: [
      { year: '~១៥២៨', sort: 1528, icon: 'puppet', era: 'era-10', img: '/images/churning-ocean.jpg', title: 'លង្វែក និងរាមកេរ្តិ៍', place: 'longvek', text: 'ព្រះបាទអង្គចន្ទទី១ តាំងរាជធានីលង្វែក — សម័យនៃអក្សរសិល្ប៍ ល្ខោន និងមហាកាព្យរាមកេរ្តិ៍។' },
      { year: '១៦១៨', sort: 1618, icon: 'parasol', img: '/images/oudong.jpg', title: 'រាជធានីឧដុង្គ', place: 'oudong', text: 'ព្រះបាទជ័យជេដ្ឋាទី២ តាំងរាជធានីនៅឧដុង្គ ដែលស្ថិតស្ថេរជាងពីររយឆ្នាំ។' },
    ],
  },
  {
    id: 'modern', name: 'សម័យទំនើប', en: 'Modern Cambodia', span: '១៨៦៣ – បច្ចុប្បន្ន',
    events: [
      { year: '១៨៦៣', sort: 1863, icon: 'book', era: 'era-11', img: '/images/banteay-chhmar.jpg', title: 'អាណាព្យាបាលបារាំង', place: 'oudong', text: 'ព្រះបាទនរោត្តម ចុះសន្ធិសញ្ញា ហើយកំណត់ហេតុរបស់ម៉ូហូ ធ្វើឱ្យពិភពលោក «រកឃើញ» អង្គរឡើងវិញ។' },
      { year: '១៨៦៦', sort: 1866, icon: 'crown', img: '/images/royal-palace.jpg', title: 'ភ្នំពេញ រាជធានី', place: 'royal-palace', text: 'ព្រះរាជវាំងចតុមុខសិរីមង្គល ត្រូវបានកសាង នៅចំណុចប្រសព្វទន្លេទាំងបួន។' },
      { year: '១៩០៨', sort: 1908, icon: 'kbach', img: '/images/preah-khan.jpg', title: 'ការថែរក្សាអង្គរ', place: 'preah-khan', text: 'សាលាបារាំងចុងបូព៌ា ចាប់ផ្តើមការងារជួសជុលប្រាសាទ ក្រោយបាត់ដំបង និងសៀមរាប ត្រឡប់មកវិញ (១៩០៧)។' },
      { year: '១៩៥៣', sort: 1953, icon: 'star', era: 'era-12', img: '/images/independence-monument.jpg', title: 'ឯករាជ្យជាតិ', place: 'independence-monument', text: 'ថ្ងៃទី ៩ វិច្ឆិកា ព្រះបាទនរោត្តម សីហនុ ទទួលបានឯករាជ្យពេញលេញពីបារាំង។' },
      { year: '១៩៧៥–១៩៧៩', sort: 1975, icon: 'incense', era: 'era-13', img: '/images/tuol-sleng.jpg', title: 'របបកម្ពុជាប្រជាធិបតេយ្យ', place: 'tuol-sleng', text: 'ប្រជាជនជិតពីរលាននាក់បានបាត់បង់ជីវិត — សិល្បករ គ្រូ និងព្រះសង្ឃ ត្រូវបានកម្ទេច។' },
      { year: '១៩៩១', sort: 1991, icon: 'sampeah', title: 'កិច្ចព្រមព្រៀងសន្តិភាពប៉ារីស', text: 'ថ្ងៃទី ២៣ តុលា បញ្ចប់សង្គ្រាម និងបើកផ្លូវទៅការបោះឆ្នោតឆ្នាំ ១៩៩៣។' },
      { year: '១៩៩២', sort: 1992, icon: 'temple', era: 'era-14', img: '/images/angkor-reflection.jpg', title: 'អង្គរ — បេតិកភណ្ឌពិភពលោក', place: 'angkor-wat', text: 'យូណេស្កូ ចុះបញ្ជីរមណីយដ្ឋានអង្គរ ជាសញ្ញានៃការរស់ឡើងវិញនៃវប្បធម៌។' },
      { year: '១៩៩៣', sort: 1993, icon: 'parasol', title: 'រដ្ឋធម្មនុញ្ញ', text: 'ថ្ងៃទី ២៤ កញ្ញា ប្រកាសរដ្ឋធម្មនុញ្ញ និងស្តាររាជាធិបតេយ្យអាស្រ័យរដ្ឋធម្មនុញ្ញ។' },
      { year: '២០០៨', sort: 2008, icon: 'apsara', img: '/images/apsara-dance.jpg', title: 'របាំ និងស្បែកធំ', text: 'របាំព្រះរាជទ្រព្យ និងល្ខោនស្រមោលស្បែកធំ ចុះក្នុងបញ្ជីបេតិកភណ្ឌអរូបីរបស់មនុស្សជាតិ។ ប្រាសាទព្រះវិហារ ក្លាយជាបេតិកភណ្ឌពិភពលោក។' },
      { year: '២០១៦–២០២៤', sort: 2016, icon: 'chapei', img: '/images/chapei.jpg', title: 'បេតិកភណ្ឌរស់', text: 'ចាប៉ីដងវែង (២០១៦) គុនល្បុក្កតោ (២០២២) និងក្រមា (២០២៤) ត្រូវបានទទួលស្គាល់ដោយយូណេស្កូ។' },
      { year: '២០១៧–២០២៥', sort: 2017, icon: 'lotus', img: '/images/koh-ker.jpg', title: 'បេតិកភណ្ឌពិភពលោកថ្មី', place: 'koh-ker', text: 'សម្បូរព្រៃគុក (២០១៧) កោះកេរ្តិ៍ (២០២៣) និងទីតាំងអនុស្សាវរីយ៍ (២០២៥) — ខ្មែរមានបេតិកភណ្ឌពិភពលោកប្រាំ។' },
    ],
  },
]
