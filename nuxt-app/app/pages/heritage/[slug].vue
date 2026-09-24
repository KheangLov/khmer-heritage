<script setup lang="ts">
import { heritageVisual } from '~/data/visuals'
import { HERITAGE_PLACES, HERITAGE_COUNTRY, placesFor } from '~/data/places'

// Heritage detail — one of the 11 living-heritage articles.
const route = useRoute()
const slug = String(route.params.slug)

const { data: item } = await useAsyncData(`heritage-${slug}`, () =>
  queryCollection('heritage').where('stem', '=', `heritage/${slug}`).first()
)
if (!item.value) {
  throw createError({ statusCode: 404, statusMessage: 'ខ្លឹមសារនេះរកមិនឃើញទេ' })
}
const page = item.value

useHead({
  title: page.h1 || page.title,
  meta: [{ name: 'description', content: page.sub }],
})
</script>

<template>
  <ArticleDetail :page="page" :visual="heritageVisual(slug)" :places="placesFor(HERITAGE_PLACES[slug])" :country="HERITAGE_COUNTRY[slug]" />
</template>
