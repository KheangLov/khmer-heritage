<script setup lang="ts">
import { eraVisual } from '~/data/visuals'

// Stems are era-0 … era-14; sort numerically (a string sort puts era-10 after era-1).
const eraNum = (stem: string) => Number(stem.match(/(\d+)$/)?.[1] ?? 0)
const { data: eras } = await useAsyncData('era-index', async () =>
  (await queryCollection('era').all()).sort((a, b) => eraNum(a.stem) - eraNum(b.stem))
)

useHead({
  title: 'សម័យកាលទាំង ១៥',
  meta: [
    { name: 'description', content: 'សម័យកាលទាំង ១៥ នៃប្រវត្តិសាស្ត្រខ្មែរ — ពីព្រឹកព្រលឹម ដល់សម័យអង្គរ ដល់ការរស់ឡើងវិញ។' },
  ],
})
</script>

<template>
  <div class="era-page">
    <PageHero
      img="/images/angkor-thom-gate.jpg"
      icon="bayon"
      kicker="បេតិកភណ្ឌរស់ · សម័យកាល"
      title="សម័យកាលទាំង ១៥"
      en="Fifteen eras of Khmer history"
      sub="ពីព្រឹកព្រលឹមនៃដែនដី ដល់សម័យអង្គរ ដល់ការស្លេកស្លាំង និងការរស់ឡើងវិញ — ដំណើរកាត់តាមពេលវេលារបស់ខ្មែរ។"
    >
      <NuxtLink to="/timeline" class="pill" data-reveal data-magnetic>មើលជាខ្សែប្រវត្តិសាស្ត្រ →</NuxtLink>
    </PageHero>

    <section class="cards">
      <div class="wrap card-grid">
        <StoryCard
          v-for="e in eras || []"
          :key="e.stem"
          :to="`/era/${e.stem.replace(/^era\//, '')}`"
          :img="eraVisual(e.stem).img"
          :icon="eraVisual(e.stem).icon"
          :badge="eraVisual(e.stem).year"
          :tag="e.kicker"
          :title="e.h1 || e.title"
          :sub="e.sub"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.era-page{min-height:100vh}
.pill{display:inline-block;margin-top:28px;font-family:var(--khmer);line-height:1.9;padding:10px 26px;border-radius:var(--r-pill);border:1px solid var(--gold-dim);color:var(--gold-2);background:rgba(12,20,16,.4)}
.pill:hover{background:rgba(212,175,55,.1)}
.cards{padding:70px 0 110px}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:26px}
</style>
