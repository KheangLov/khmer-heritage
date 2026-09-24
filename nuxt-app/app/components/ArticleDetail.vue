<script setup lang="ts">
import { eraVisual, heritageVisual, type Visual } from '~/data/visuals'
import type { PlaceView } from '~/data/places'
import type { KhmerIconName } from '~/components/KhmerIcon.vue'
import type { EraCollectionItem, HeritageCollectionItem } from '@nuxt/content'

// Long-form article layout shared by /era/[slug] and /heritage/[slug].
const props = defineProps<{
  page: EraCollectionItem | HeritageCollectionItem
  visual: Visual
  prev?: { to: string; label: string } | null
  next?: { to: string; label: string } | null
  places?: PlaceView[]
  country?: string
}>()

const factIcons: KhmerIconName[] = ['sun', 'water', 'stele', 'kbach', 'star', 'leaf']

function relatedVisual(to: string): { img?: string; icon: KhmerIconName } {
  if (to.startsWith('/era/')) return eraVisual(to.slice(5))
  if (to.startsWith('/heritage/')) return heritageVisual(to.slice(10))
  if (to.startsWith('/calendar')) return { img: '/images/monks.jpg', icon: 'calendar' }
  return { img: '/images/angkor-sunrise.jpg', icon: 'temple' }
}
const related = computed(() => props.page.related.map((r) => ({ ...r, v: relatedVisual(r.to) })))
</script>

<template>
  <article class="detail">
    <PageHero :img="visual.img" :icon="visual.icon" :kicker="page.kicker" :title="page.h1 || page.title" :en="page.en" :sub="page.sub" tall />

    <section v-if="page.facts?.length" class="facts">
      <div class="wrap">
        <dl class="fact-grid">
          <div v-for="(f, i) in page.facts" :key="f.t" class="fact" data-reveal>
            <KhmerIcon :name="factIcons[i % factIcons.length]" :size="30" draw />
            <dt>{{ f.t }}</dt>
            <dd>{{ f.d }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="body">
      <div class="wrap prose" data-reveal>
        <ContentRenderer :value="page" />
      </div>
    </section>

    <nav v-if="prev || next" class="pager wrap" aria-label="សម័យកាលមុន និងបន្ទាប់">
      <NuxtLink v-if="prev" :to="prev.to" class="pg prev" data-magnetic><small>← មុន</small>{{ prev.label }}</NuxtLink>
      <span v-else />
      <NuxtLink v-if="next" :to="next.to" class="pg next" data-magnetic><small>បន្ទាប់ →</small>{{ next.label }}</NuxtLink>
    </nav>

    <section v-if="places?.length || country" class="where">
      <div class="wrap">
        <h2 class="sec-label" data-reveal><KhmerIcon name="pin" :size="22" />ទីតាំង និងទិសដៅ</h2>
        <div data-reveal>
          <PlaceMap :places="places ?? []" :country="country" with-temples />
        </div>
      </div>
    </section>

    <section v-if="related.length" class="related">
      <div class="wrap">
        <h2 class="sec-label" data-reveal><KhmerIcon name="kbach" :size="20" />ស្វែងយល់បន្ថែម</h2>
        <div class="rel-grid">
          <NuxtLink v-for="r in related" :key="r.to" :to="r.to" class="rel" data-reveal data-tilt>
            <NuxtImg v-if="r.v.img" :src="r.v.img" alt="" width="480" height="300" format="webp" loading="lazy" />
            <span class="rel-body"><KhmerIcon :name="r.v.icon" :size="26" />{{ r.label }}<em>→</em></span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
.facts{padding:60px 0 20px}
.fact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}
.fact{border:1px solid rgba(212,175,55,.14);border-radius:var(--r-md);padding:20px 22px;background:radial-gradient(120% 100% at 0% 0%,rgba(46,74,53,.5),rgba(20,36,27,.35))}
.fact :deep(svg){color:var(--gold-2);margin-bottom:6px}
.fact dt{font-family:var(--khmer);font-size:.82rem;letter-spacing:.06em;color:var(--gold-2);line-height:1.9}
.fact dd{font-family:var(--khmer);color:var(--ivory);font-size:.95rem;line-height:2;margin:0}

.body{padding:40px 0 60px}
.prose{max-width:780px}
.prose :deep(h2){font-family:var(--display);font-size:clamp(1.4rem,3vw,1.9rem);color:var(--gold-2);line-height:var(--lh-display);margin:56px 0 14px;display:flex;align-items:center;gap:16px}
.prose :deep(h2)::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--gold-dim),transparent)}
.prose :deep(h3){font-family:var(--title);font-size:1.3rem;color:var(--ivory);margin:34px 0 10px}
.prose :deep(p){font-family:var(--khmer);color:var(--ivory-dim);font-size:1.06rem;line-height:2.25;margin-bottom:22px}
.prose :deep(blockquote){font-family:var(--script);font-size:1.4rem;line-height:2.1;color:var(--stone);border-left:2px solid var(--gold);padding:6px 0 6px 24px;margin:30px 0}
.prose :deep(ul),.prose :deep(ol){font-family:var(--khmer);color:var(--ivory-dim);line-height:2.1;padding-left:1.4em;margin-bottom:22px}
.prose :deep(p a),.prose :deep(li a){color:var(--gold-2);border-bottom:1px solid var(--gold-dim)}
.prose :deep(h2 a),.prose :deep(h3 a){color:inherit}

.pager{display:flex;justify-content:space-between;gap:16px;padding-bottom:50px}
.pg{display:flex;flex-direction:column;font-family:var(--title);font-size:1.1rem;line-height:1.9;color:var(--ivory);padding:16px 22px;border:1px solid rgba(212,175,55,.18);border-radius:var(--r-md);max-width:48%;transition:border-color .3s,background .3s}
.pg small{font-family:var(--khmer);font-size:.78rem;color:var(--gold-2)}
.pg.next{text-align:right;margin-left:auto}
.pg:hover{border-color:var(--gold-dim);background:rgba(212,175,55,.06)}

.where{padding:0 0 40px}
.where .sec-label{margin-top:10px}
.related{padding:20px 0 110px;border-top:1px solid rgba(212,175,55,.14)}
.sec-label{display:flex;align-items:center;gap:10px;font-family:var(--display);font-size:1.3rem;line-height:var(--lh-display);color:var(--gold-2);margin:48px 0 24px}
.rel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}
.rel{position:relative;display:block;border-radius:var(--r-md);overflow:hidden;border:1px solid rgba(212,175,55,.16);aspect-ratio:16/10;background:var(--moss-3)}
.rel img{width:100%;height:100%;object-fit:cover;opacity:.55;transition:transform 1s var(--ease),opacity .4s}
.rel:hover img{transform:scale(1.07);opacity:.7}
.rel-body{position:absolute;inset:auto 0 0 0;display:flex;align-items:center;gap:10px;padding:14px 18px;font-family:var(--title);font-size:1.1rem;line-height:1.9;color:var(--ivory);background:linear-gradient(180deg,transparent,rgba(10,16,13,.92))}
.rel-body :deep(svg){color:var(--gold-2);flex:none}
.rel-body em{margin-left:auto;font-style:normal;color:var(--gold-2)}
</style>
