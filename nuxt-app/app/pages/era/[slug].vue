<script setup lang="ts">
import { eraVisual } from '~/data/visuals'
import { ERA_PLACES, placesFor } from '~/data/places'

// Era detail — renders era-<N> pages from the content collection.
const route = useRoute()
const slug = String(route.params.slug)

const { data: era } = await useAsyncData(`era-${slug}`, () =>
  queryCollection('era').where('stem', '=', `era/${slug}`).first()
)
if (!era.value) {
  throw createError({ statusCode: 404, statusMessage: 'សម័យកាលនេះរកមិនឃើញទេ' })
}
const page = era.value

// Previous / next era for walking the timeline in order.
const n = Number(slug.replace('era-', ''))
const { data: neighbours } = await useAsyncData(`era-nb-${slug}`, () =>
  queryCollection('era').where('stem', 'IN', [`era/era-${n - 1}`, `era/era-${n + 1}`]).select('stem', 'h1').all()
)
const nb = (k: number) => {
  const e = neighbours.value?.find((x) => x.stem === `era/era-${k}`)
  return e ? { to: `/era/era-${k}`, label: e.h1 } : null
}

useHead({
  title: page.h1 || page.title,
  meta: [{ name: 'description', content: page.sub }],
})
</script>

<template>
  <ArticleDetail :page="page" :visual="eraVisual(slug)" :places="placesFor(ERA_PLACES[slug])" :prev="nb(n - 1)" :next="nb(n + 1)" />
</template>
