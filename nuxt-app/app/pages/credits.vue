<script setup lang="ts">
import credits from '~/data/image-credits.json'

useHead({
  title: 'ប្រភពរូបភាព',
  meta: [{ name: 'description', content: 'ប្រភព និងអាជ្ញាប័ណ្ណនៃរូបថត ផែនទី ទិន្នន័យ និងពុម្ពអក្សរ ដែលប្រើក្នុងគេហទំព័របេតិកភណ្ឌខ្មែរ — Image and data credits.' }],
})

// Non-photo sources: the brand mark, map data and fonts.
const sources = [
  { name: 'Flag of Cambodia (Wikimedia Commons)', use: 'រូបសញ្ញាអង្គរវត្ត និងរូបតំណាងផ្ទាំង — ដកស្រង់ពីទង់ជាតិ', license: 'Public domain', url: 'https://commons.wikimedia.org/wiki/File:Flag_of_Cambodia.svg' },
  { name: 'OpenStreetMap contributors · OpenFreeMap · OpenMapTiles', use: 'ផែនទីវ៉ិចទ័រ', license: 'ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { name: 'Natural Earth 1:50m', use: 'ព្រំដែនប្រទេសកម្ពុជា', license: 'Public domain', url: 'https://www.naturalearthdata.com/' },
  { name: 'Terrain Tiles (Mapzen / AWS Open Data)', use: 'ភូមិសាស្ត្រ និងម្លប់ភ្នំ', license: 'Open data (various)', url: 'https://registry.opendata.aws/terrain-tiles/' },
  { name: 'Esri World Imagery', use: 'រូបថតផ្កាយរណប', license: 'Esri terms of use', url: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9' },
  { name: 'Wikipedia / Wikidata', use: 'កូអរដោនេទីតាំងប្រវត្តិសាស្ត្រ', license: 'CC BY-SA / CC0', url: 'https://www.wikidata.org/' },
  { name: 'Battambang, Moul, Moulpali, Taprom (Google Fonts)', use: 'ពុម្ពអក្សរ', license: 'SIL Open Font License', url: 'https://fonts.google.com/' },
]

const rows = Object.entries(credits as Record<string, { title: string; author: string; license: string; source: string }>)
  .map(([slug, c]) => ({ slug, ...c, title: c.title.replace(/^File:/, '') }))
  .sort((a, b) => a.slug.localeCompare(b.slug))
</script>

<template>
  <div class="credits">
    <div class="wrap">
      <div class="kicker" data-reveal><KhmerIcon name="book" :size="18" />ប្រភពរូបភាព · Image credits</div>
      <h1 data-hero-ink>ប្រភពរូបភាព</h1>
      <p class="lead" data-reveal>រូបថតខាងក្រោមមកពី Wikimedia Commons ក្រោមអាជ្ញាប័ណ្ណសេរី។ សូមអរគុណដល់អ្នកថតរូបទាំងអស់។</p>
      <h2 class="h2" data-reveal>រូបសញ្ញា ផែនទី និងពុម្ពអក្សរ</h2>
      <ul class="list src-list">
        <li v-for="x in sources" :key="x.name" data-reveal>
          <div>
            <a :href="x.url" target="_blank" rel="noopener">{{ x.name }}</a>
            <span>{{ x.use }} · {{ x.license }}</span>
          </div>
        </li>
      </ul>
      <h2 class="h2" data-reveal>រូបថត</h2>
      <ul class="list">
        <li v-for="r in rows" :key="r.slug" data-reveal>
          <NuxtImg :src="`/images/${r.slug}.jpg`" :alt="r.title" width="160" height="100" format="webp" loading="lazy" />
          <div>
            <a :href="r.source" target="_blank" rel="noopener">{{ r.title }}</a>
            <span>{{ r.author || '—' }} · {{ r.license }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.credits{padding:140px 0 100px;min-height:100vh}
.kicker{display:flex;align-items:center;gap:10px;font-family:var(--khmer);color:var(--gold-2);font-size:.9rem}
h1{font-family:var(--display);font-size:clamp(2rem,5vw,3.2rem);color:var(--ivory);line-height:var(--lh-display)}
.lead{font-family:var(--khmer);color:var(--ivory-dim);line-height:2.1;margin-bottom:36px;max-width:700px}
.h2{font-family:var(--display);font-size:1.3rem;line-height:var(--lh-display);color:var(--gold-2);margin:10px 0 14px}
.src-list{margin-bottom:40px}
.list{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}
.list li{display:flex;gap:14px;align-items:center;padding:10px;border:1px solid rgba(212,175,55,.14);border-radius:var(--r-sm);background:rgba(30,51,38,.35)}
.list img{width:110px;height:70px;object-fit:cover;border-radius:var(--r-sm);flex:none}
.list a{display:block;font-family:var(--sans);font-size:.85rem;color:var(--gold-2);line-height:1.7;word-break:break-word}
.list span{font-size:.75rem;color:var(--ivory-dim);line-height:1.7}
</style>
