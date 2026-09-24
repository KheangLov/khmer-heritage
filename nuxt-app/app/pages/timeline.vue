<script setup lang="ts">
import { TIMELINE } from '~/data/visuals'
import { PLACES } from '~/data/places'
import { khmerNum } from '~/utils/khmer-calendar'

useHead({
  title: 'ខ្សែប្រវត្តិសាស្ត្រ',
  meta: [
    { name: 'description', content: 'ខ្សែប្រវត្តិសាស្ត្រខ្មែរ — ពីរូងភ្នំល្អាងស្ពាន នគរភ្នំ ចេនឡា អង្គរ ដល់កម្ពុជាសម័យទំនើប។' },
  ],
})

const total = TIMELINE.reduce((n, a) => n + a.events.length, 0)

// Jump to an age. On desktop the track is translated horizontally inside a
// pinned section, so the target is "pin start + the header's x offset".
const nuxtApp = useNuxtApp()
async function goToAge(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  let top = el.getBoundingClientRect().top + window.scrollY - 90
  if (window.innerWidth >= 900) {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    const st = ScrollTrigger.getAll().find((s) => s.pin && (s.trigger as Element)?.hasAttribute?.('data-h-scroll'))
    if (st) top = st.start + el.offsetLeft - window.innerWidth * 0.08
  }
  const lenis = nuxtApp.$lenis as { scrollTo: (y: number, o?: object) => void } | undefined
  if (lenis) lenis.scrollTo(top, { duration: 1.6 })
  else window.scrollTo({ top, behavior: 'smooth' })
}
</script>

<template>
  <div class="tl-page">
    <section class="t-hero">
      <NuxtImg src="/images/bayon-faces.jpg" alt="" width="1920" height="1440" format="webp" densities="x1" loading="eager" class="t-hero-bg kenburns" />
      <div class="t-veil" aria-hidden="true" />
      <div class="t-mandala" aria-hidden="true"><KbachMandala :petals="16" reverse /></div>
      <GoldDust :count="40" />
      <div class="wrap t-inner">
        <div class="kicker" data-reveal><KhmerIcon name="book" :size="18" />ព្រឹត្តិការណ៍ {{ khmerNum(total) }} · ៥ យុគសម័យ</div>
        <h1 class="t-title shimmer" data-ink>ខ្សែប្រវត្តិសាស្ត្រខ្មែរ</h1>
        <p class="en" data-scramble>A TIMELINE OF KHMER HISTORY</p>
        <p class="sub" data-words>ប្រាំបីពាន់ឆ្នាំ ក្នុងមួយដង្ហើម — អូសចុះក្រោម ដើម្បីធ្វើដំណើរកាត់ពេលវេលា។</p>
        <nav class="age-nav" data-reveal>
          <a v-for="a in TIMELINE" :key="a.id" :href="`#${a.id}`" @click.prevent="goToAge(a.id)">{{ a.name }}</a>
        </nav>
      </div>
    </section>

    <!-- Pinned horizontal journey (desktop). On narrow screens the same
         markup stacks vertically and no pinning is applied. -->
    <section class="journey" data-h-scroll>
      <div class="progress" aria-hidden="true"><span data-h-fill /></div>
      <div class="track" data-h-track>
        <template v-for="age in TIMELINE" :key="age.id">
          <header :id="age.id" class="age">
            <span class="age-span">{{ age.span }}</span>
            <h2 class="age-name">{{ age.name }}</h2>
            <span class="age-en">{{ age.en }}</span>
          </header>
          <article v-for="ev in age.events" :key="ev.title" class="h-card" :class="{ 'no-img': !ev.img }">
            <span class="h-dot" aria-hidden="true" />
            <div class="h-year">{{ ev.year }}</div>
            <div v-if="ev.img" class="h-media">
              <NuxtImg :src="ev.img" :alt="ev.title" width="640" height="420" format="webp" loading="lazy" />
            </div>
            <div class="h-body">
              <KhmerIcon :name="ev.icon" :size="40" class="h-ic" draw />
              <h3>{{ ev.title }}</h3>
              <p>{{ ev.text }}</p>
              <div class="h-links">
                <NuxtLink v-if="ev.era" :to="`/era/${ev.era}`" class="h-go">អានសម័យកាលនេះ →</NuxtLink>
                <NuxtLink v-if="ev.place" :to="{ path: '/map', query: { place: ev.place } }" class="h-map"><KhmerIcon name="pin" :size="16" />{{ PLACES[ev.place]?.name }}</NuxtLink>
              </div>
            </div>
          </article>
        </template>
        <div class="h-end">
          <KhmerIcon name="lotus" :size="64" draw />
          <p>ប្រវត្តិសាស្ត្រនៅតែបន្តសរសេរ…</p>
          <NuxtLink to="/era" class="btn" data-magnetic>សម័យកាលទាំង ១៥ →</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tl-page{min-height:100vh}
.t-hero{position:relative;min-height:88vh;display:flex;align-items:center;text-align:center;overflow:hidden}
.t-hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.4}
.t-veil{position:absolute;inset:0;background:radial-gradient(80% 70% at 50% 45%,rgba(12,20,16,.4),rgba(12,20,16,.9) 75%),linear-gradient(180deg,transparent 60%,var(--night))}
.t-mandala{position:absolute;width:min(90vmin,760px);aspect-ratio:1;left:50%;top:50%;translate:-50% -50%;color:var(--gold);opacity:.18}
.t-inner{position:relative;z-index:3;padding-top:130px;padding-bottom:80px}
.kicker{display:inline-flex;align-items:center;gap:10px;font-family:var(--khmer);font-size:.9rem;letter-spacing:.12em;color:var(--gold-2)}
.t-title{font-family:var(--display);font-size:clamp(2.2rem,7vw,5.4rem);line-height:var(--lh-display)}
.en{font-family:var(--latin-display);letter-spacing:.4em;font-size:.85rem;color:var(--stone)}
.sub{font-family:var(--khmer);color:var(--ivory-dim);font-size:1.08rem;line-height:2.1;margin:22px auto 0;max-width:620px}
.age-nav{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:34px}
.age-nav a{font-family:var(--khmer);font-size:.88rem;line-height:1.9;padding:6px 18px;border:1px solid var(--gold-dim);border-radius:var(--r-pill);color:var(--gold-2);background:rgba(12,20,16,.5);transition:background .3s,color .3s}
.age-nav a:hover{background:var(--gold);color:var(--night)}

/* ---- journey ---- */
.journey{position:relative;border-top:1px solid rgba(212,175,55,.14);background:
  radial-gradient(60% 80% at 50% 100%,rgba(46,74,53,.35),transparent 70%),var(--night)}
.progress{position:absolute;left:0;right:0;top:50%;height:2px;background:rgba(212,175,55,.14);z-index:0}
.progress span{display:block;height:100%;background:linear-gradient(90deg,var(--stone-2),var(--gold-2));transform-origin:0 50%;transform:scaleX(0)}
.track{display:flex;align-items:center;gap:40px;padding:0 8vw;height:100vh;width:max-content;position:relative;z-index:1}
.age{flex:none;width:340px;padding:30px 10px}
.age-span{font-family:var(--khmer);font-size:.9rem;color:var(--stone);line-height:2}
.age-name{font-family:var(--display);font-size:2.6rem;line-height:var(--lh-display);color:var(--gold-2)}
.age-en{font-family:var(--latin-display);letter-spacing:.3em;font-size:.78rem;color:var(--stone-3);text-transform:uppercase}
.h-card{flex:none;width:380px;position:relative;border:1px solid rgba(201,168,124,.16);border-radius:var(--r-lg);background:linear-gradient(180deg,rgba(30,51,38,.8),rgba(14,24,18,.92));box-shadow:0 30px 60px rgba(0,0,0,.35);overflow:hidden}
.h-card:nth-of-type(even){translate:0 40px}
.h-card.no-img{width:320px}
.h-dot{position:absolute;top:18px;right:18px;width:12px;height:12px;border-radius:50%;background:var(--gold-2);z-index:2}
.h-year{position:absolute;top:10px;left:18px;z-index:2;font-family:var(--title);font-size:1.3rem;line-height:1.9;color:var(--gold-2);text-shadow:0 2px 14px rgba(0,0,0,.95)}
.h-media{aspect-ratio:16/10;overflow:hidden;position:relative}
.h-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,16,13,.7),transparent 40%,transparent 60%,rgba(14,24,18,.9))}
.h-media img{width:116%;max-width:none;height:100%;object-fit:cover;margin-left:-8%}
.no-img .h-body{padding-top:62px}
.h-body{padding:18px 24px 26px;display:flex;flex-direction:column;gap:6px}
.h-ic{color:var(--gold-2)}
.h-card h3{font-family:var(--title);font-size:1.3rem;color:var(--ivory)}
.h-card p{font-family:var(--khmer);font-size:.93rem;line-height:2;color:var(--ivory-dim)}
.h-links{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin-top:4px}
.h-go{font-family:var(--khmer);color:var(--gold-2);font-size:.88rem;line-height:1.9}
.h-map{display:inline-flex;align-items:center;gap:5px;font-family:var(--khmer);font-size:.8rem;line-height:1.9;color:var(--water);padding:1px 10px;border:1px solid rgba(127,168,160,.4);border-radius:var(--r-pill)}
.h-map:hover{background:rgba(127,168,160,.12)}
.h-end{flex:none;width:360px;text-align:center;color:var(--gold-2);display:flex;flex-direction:column;align-items:center;gap:14px}
.h-end p{font-family:var(--script);font-size:1.5rem;line-height:2;color:var(--stone)}
.btn{font-family:var(--khmer);line-height:1.9;padding:10px 26px;border-radius:var(--r-pill);border:1px solid var(--gold-dim);color:var(--gold-2)}
.btn:hover{background:rgba(212,175,55,.1)}

/* ---- narrow screens: vertical river ---- */
@media (max-width:899px){
  .progress{top:0;bottom:0;left:22px;right:auto;width:2px;height:auto}
  .progress span{transform:none;height:100%}
  .track{flex-direction:column;align-items:stretch;height:auto;width:auto;padding:40px 16px 80px 48px;gap:26px}
  .age,.h-card,.h-card.no-img,.h-end{width:100%}
  .h-card:nth-of-type(even){translate:none}
  .h-media img{width:100%;margin:0}
  .age{padding:30px 0 0}
}
</style>
