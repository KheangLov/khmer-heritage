<script setup lang="ts">
import { heritageVisual } from '~/data/visuals'

const { data: heritage } = await useAsyncData('heritage-index', () =>
  queryCollection('heritage').order('stem', 'ASC').all()
)

useHead({
  title: 'បេតិកភណ្ឌរស់ទាំង ១១',
  meta: [
    { name: 'description', content: 'របាំ តន្ត្រី ម្ហូប ក្រមា អាម៉ុក ស្បែកធំ អប្សរា — មរតកវប្បធម៌ដែលនៅតែរស់ និងដកដង្ហើមនៅខ្មែរ។' },
  ],
})
</script>

<template>
  <div class="heritage-page">
    <PageHero
      img="/images/apsara-dance.jpg"
      icon="apsara"
      kicker="បេតិកភណ្ឌរស់ · មរតកវប្បធម៌"
      title="បេតិកភណ្ឌរស់ទាំង ១១"
      en="Living heritage"
      sub="ពីរសជាតិអាម៉ុក ដល់ចង្វាក់រាំអប្សរា ដល់ខ្សែក្រមា — មរតកដែលមិនមែនកប់ក្នុងសារមន្ទីរ តែរស់នៅក្នុងដៃ ក្នុងពាក្យសំដី និងក្នុងជីវិតប្រចាំថ្ងៃរបស់ខ្មែរ។"
    />

    <section class="cards">
      <div class="wrap card-grid">
        <StoryCard
          v-for="h in heritage || []"
          :key="h.stem"
          :to="`/heritage/${h.stem.replace(/^heritage\//, '')}`"
          :img="heritageVisual(h.stem).img"
          :icon="heritageVisual(h.stem).icon"
          :tag="h.kicker"
          :title="h.h1 || h.title"
          :sub="h.sub"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.heritage-page{min-height:100vh}
.cards{padding:70px 0 110px}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:26px}
</style>
