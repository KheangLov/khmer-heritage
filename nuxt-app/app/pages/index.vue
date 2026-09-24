<script setup lang="ts">
import {
  gregorianToKhmerLunar, formatKhmerLunar, khmerYearName, khmerNum,
  lunarYearType, khmerMonthNames, GREG_MONTHS,
} from '~/utils/khmer-calendar'
import { eraVisual, heritageVisual } from '~/data/visuals'

useHead({
  title: 'ទំព័រដើម',
  meta: [
    { name: 'description', content: 'បេតិកភណ្ឌរស់រវើករបស់ខ្មែរ — ស្ថាបត្យកម្ម របាំ តន្ត្រី ម្ហូប និងប្រតិទិនចន្ទគតិ។' },
  ],
})

// Stems are era-0 … era-14; sort numerically (a string sort puts era-10 after era-1).
const eraNum = (stem: string) => Number(stem.match(/(\d+)$/)?.[1] ?? 0)
const { data: eras } = await useAsyncData('home-eras', async () =>
  (await queryCollection('era').all()).sort((a, b) => eraNum(a.stem) - eraNum(b.stem))
)
const { data: heritage } = await useAsyncData('home-heritage', () =>
  queryCollection('heritage').order('stem', 'ASC').all()
)
const slug = (stem: string) => stem.replace(/^(era|heritage)\//, '')

const now = new Date()
const lunar = gregorianToKhmerLunar(now.getFullYear(), now.getMonth() + 1, now.getDate())
const beYear = lunar.isYearEndWrap ? lunar.beYear + 2 : lunar.beYear + 1
const yearType = lunarYearType(beYear, 'be')
const today = {
  greg: `${khmerNum(now.getDate())} ${GREG_MONTHS[now.getMonth()]} ${khmerNum(now.getFullYear())}`,
  lunar: formatKhmerLunar(lunar),
  month: 'ខែ' + khmerMonthNames[lunar.month - 1],
  year: khmerYearName(beYear).full,
  be: 'ព.ស. ' + khmerNum(beYear),
  type: yearType === 'C' ? 'ឆ្នាំអធិកមាតិកា' : yearType === 'B' ? 'ឆ្នាំអធិកវារៈ' : 'ឆ្នាំធម្មតា',
}

const stats = [
  { n: 802, suffix: '', label: 'ឆ្នាំកំណើតអាណាចក្រខ្មែរ (គ.ស.)', icon: 'crown' as const },
  { n: 1000, suffix: '+', label: 'ប្រាសាទនៅតំបន់អង្គរ', icon: 'temple' as const },
  { n: 5, suffix: '', label: 'បេតិកភណ្ឌពិភពលោកយូណេស្កូ', icon: 'lotus' as const },
  { n: 15, suffix: '', label: 'សម័យកាលនៃប្រវត្តិសាស្ត្រ', icon: 'book' as const },
]
</script>

<template>
  <div class="home">
    <!-- ================= HERO ================= -->
    <section class="hero">
      <div class="hero-media" data-parallax="0.25">
        <NuxtImg
          src="/images/angkor-reflection.jpg"
          alt=""
          width="1920"
          height="1440"
         
          format="webp"
          loading="eager"
          fetchpriority="high" densities="x1"
          class="hero-bg kenburns"
        />
      </div>
      <div class="hero-veil" aria-hidden="true" />
      <div class="hero-mandala" aria-hidden="true">
        <KbachMandala />
      </div>
      <GoldDust :count="80" />
      <div class="hero-inner kh-hero">
        <div class="kicker"><KhmerIcon name="kbach" :size="18" />បេតិកភណ្ឌរស់រវើក · ២០០០ ឆ្នាំ</div>
        <h1 class="khmer-title shimmer" data-hero-ink>បេតិកភណ្ឌខ្មែរ</h1>
        <p class="en">THE LIVING HERITAGE OF CAMBODIA</p>
        <p class="sub">ពីថ្មប្រាសាទ ដល់ចង្វាក់រាំ ពីរសជាតិម្ហូប ដល់វដ្តនៃឆ្នាំ — ស្វែងយល់ពីមរតកដែលនៅរស់។</p>
        <div class="cta">
          <NuxtLink to="/timeline" class="btn primary" data-magnetic><KhmerIcon name="book" :size="18" />ខ្សែប្រវត្តិសាស្ត្រ</NuxtLink>
          <NuxtLink to="/calendar" class="btn ghost" data-magnetic><KhmerIcon name="calendar" :size="18" />ប្រតិទិនខ្មែរ</NuxtLink>
        </div>
      </div>
      <div class="scroll-cue" aria-hidden="true"><span /></div>
    </section>

    <!-- ================= TODAY ================= -->
    <section class="today-card">
      <div class="wrap tc-inner" data-reveal>
        <KhmerIcon name="calendar" :size="44" draw class="tc-ic" />
        <div>
          <div class="tc-label">ថ្ងៃនេះតាមចន្ទគតិ</div>
          <div class="tc-main">
            <span class="tc-lunar">{{ today.lunar }}</span>
            <span class="tc-greg">{{ today.greg }}</span>
          </div>
          <div class="tc-meta">
            <span>{{ today.year }}</span><span>{{ today.be }}</span><span>{{ today.type }}</span>
          </div>
        </div>
        <NuxtLink to="/calendar" class="tc-go">មើលប្រតិទិន →</NuxtLink>
      </div>
    </section>

    <!-- ================= STATS ================= -->
    <section class="stats">
      <div class="wrap stat-grid">
        <div v-for="s in stats" :key="s.label" class="stat" data-reveal>
          <KhmerIcon :name="s.icon" :size="46" draw />
          <div class="stat-n" :data-count="s.n" :data-suffix="s.suffix">{{ khmerNum(s.n) }}{{ s.suffix }}</div>
          <div class="stat-l">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <KhmerMarquee />

    <!-- ================= ERA TIMELINE ================= -->
    <section class="timeline">
      <div class="wrap">
        <div class="sec-label" data-reveal><KhmerIcon name="temple" :size="18" />សម័យកាលដប់ប្រាំ</div>
        <h2 class="sec-title" data-ink>ខ្សែស្រឡាយតែមួយ មិនដាច់</h2>
        <p class="sec-sub" data-reveal>ពីរូងភ្នំល្អាងស្ពាន ដល់ការរស់ឡើងវិញ — ដើរតាមដំណើរពីរពាន់ឆ្នាំនៃអរិយធម៌ខ្មែរ។</p>
        <div class="timeline-list">
          <div class="tl-line" aria-hidden="true" />
          <article v-for="e in eras || []" :key="e.stem" class="tl-item">
            <span class="tl-dot" aria-hidden="true" />
            <NuxtLink :to="`/era/${slug(e.stem)}`" class="tl-card" data-reveal data-tilt>
              <div class="tl-media" data-img-reveal>
                <NuxtImg :src="eraVisual(e.stem).img" :alt="e.heroAlt || e.h1" width="720" height="420" format="webp" loading="lazy" />
                <span class="tl-year">{{ eraVisual(e.stem).year }}</span>
              </div>
              <div class="tl-body">
                <div class="tl-kicker"><KhmerIcon :name="eraVisual(e.stem).icon" :size="22" />{{ e.kicker }}</div>
                <h3>{{ e.h1 || e.title }}</h3>
                <p>{{ e.sub }}</p>
                <span class="tl-go">អានបន្ត →</span>
              </div>
            </NuxtLink>
          </article>
        </div>
        <div class="more" data-reveal>
          <NuxtLink to="/timeline" class="btn ghost" data-magnetic>មើលខ្សែប្រវត្តិសាស្ត្រពេញលេញ →</NuxtLink>
        </div>
      </div>
    </section>

    <!-- ================= LIVING HERITAGE ================= -->
    <section class="living">
      <div class="wrap">
        <div class="sec-label" data-reveal><KhmerIcon name="lotus" :size="18" />បេតិកភណ្ឌរស់រវើក</div>
        <h2 class="sec-title" data-ink>បេតិកភណ្ឌរស់រវើកទាំង ១១</h2>
        <div class="card-grid">
          <NuxtLink
            v-for="h in heritage || []"
            :key="h.stem"
            :to="`/heritage/${slug(h.stem)}`"
            class="card"
            data-reveal
            data-tilt
          >
            <div class="card-media">
              <div class="card-clip">
                <NuxtImg :src="heritageVisual(h.stem).img" :alt="h.heroAlt || h.h1" width="640" height="420" format="webp" loading="lazy" class="card-img" />
              </div>
              <span class="card-badge"><KhmerIcon :name="heritageVisual(h.stem).icon" :size="26" /></span>
            </div>
            <div class="card-body">
              <div class="card-tag">{{ h.kicker }}</div>
              <h3>{{ h.h1 || h.title }}</h3>
              <p>{{ h.sub }}</p>
              <span class="card-go">ស្វែងយល់ →</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home{min-height:100vh}

/* ---- hero ---- */
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden;background:var(--night)}
.hero-media{position:absolute;inset:-12% 0;z-index:0}
.hero-bg{width:100%;height:100%;object-fit:cover;opacity:.55}
.hero-veil{position:absolute;inset:0;z-index:1;background:
  radial-gradient(90% 70% at 50% 45%,rgba(12,20,16,.35) 0%,rgba(12,20,16,.82) 70%),
  linear-gradient(180deg,rgba(12,20,16,.6),transparent 30%,transparent 70%,var(--night))}
.hero-mandala{position:absolute;z-index:1;width:min(92vmin,860px);aspect-ratio:1;left:50%;top:50%;translate:-50% -50%;color:var(--gold);opacity:.22;pointer-events:none}
.hero :deep(.gold-dust){z-index:2}
.hero-inner{max-width:980px;padding:140px 28px 110px;position:relative;z-index:3}
.kicker{display:inline-flex;align-items:center;gap:10px;font-family:var(--khmer);font-size:.9rem;letter-spacing:.14em;color:var(--gold-2);margin-bottom:10px}
.khmer-title{font-family:var(--display);font-size:clamp(2.6rem,8.4vw,6.4rem);line-height:var(--lh-display);letter-spacing:.02em;text-shadow:0 0 60px rgba(212,175,55,.15)}
.en{font-family:var(--latin-display);font-size:clamp(.72rem,1.4vw,.95rem);letter-spacing:.42em;color:var(--stone);margin-top:4px}
.sub{font-family:var(--khmer);color:var(--ivory);opacity:.85;margin:26px auto 0;font-size:clamp(1rem,1.8vw,1.18rem);line-height:2.1;max-width:680px}
.cta{display:flex;gap:16px;justify-content:center;margin-top:42px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:10px;font-family:var(--khmer);font-size:.95rem;line-height:1.9;letter-spacing:.04em;padding:12px 28px;border-radius:var(--r-pill);transition:background .3s var(--ease),border-color .3s,color .3s}
.btn.primary{background:linear-gradient(180deg,var(--gold-2),var(--gold));color:var(--night);box-shadow:0 10px 30px rgba(212,175,55,.25)}
.btn.primary:hover{background:var(--gold-2)}
/* no backdrop blur: behind it the Ken Burns photo and gold dust change every frame, so the blur would be recomputed every frame */
.btn.ghost{border:1px solid var(--gold-dim);color:var(--gold-2);background:rgba(12,20,16,.55)}
.btn.ghost:hover{border-color:var(--gold);background:rgba(212,175,55,.1)}
.scroll-cue{position:absolute;bottom:30px;left:50%;translate:-50% 0;z-index:3;width:24px;height:40px;border:1px solid var(--gold-dim);border-radius:var(--r-md)}
.scroll-cue span{position:absolute;left:50%;top:8px;width:3px;height:8px;margin-left:-1.5px;border-radius:var(--r-xs);background:var(--gold-2);animation:cue 2s ease-in-out infinite}
@keyframes cue{0%{opacity:0;transform:translateY(0)}40%{opacity:1}100%{opacity:0;transform:translateY(14px)}}

/* ---- today ---- */
.today-card{padding:48px 0;border-block:1px solid rgba(212,175,55,.14);background:linear-gradient(180deg,rgba(30,51,38,.45),transparent)}
.tc-inner{display:flex;gap:28px;align-items:center;justify-content:center;flex-wrap:wrap}
.tc-ic{color:var(--gold-2);flex:none}
.tc-label{font-family:var(--khmer);font-size:.8rem;letter-spacing:.14em;color:var(--stone-2)}
.tc-main{display:flex;gap:18px;align-items:baseline;flex-wrap:wrap}
.tc-lunar{font-family:var(--title);font-size:clamp(1.3rem,3vw,1.8rem);line-height:var(--lh-title);color:var(--gold-2)}
.tc-greg{font-family:var(--khmer);font-size:.95rem;color:var(--ivory-dim)}
.tc-meta{display:flex;gap:16px;flex-wrap:wrap;font-family:var(--khmer);font-size:.82rem;color:var(--stone)}
.tc-go{font-family:var(--khmer);color:var(--gold-2);border-bottom:1px solid var(--gold-dim);padding-bottom:2px}

/* ---- stats ---- */
.stats{padding:84px 0}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.stat{text-align:center;padding:30px 16px;border:1px solid rgba(212,175,55,.12);border-radius:var(--r-md);background:radial-gradient(120% 100% at 50% 0%,rgba(46,74,53,.45),transparent 70%)}
.stat :deep(.kh-icon){margin:0 auto 6px;color:var(--gold-2)}
.stat-n{font-family:var(--title);font-size:clamp(2rem,4.4vw,3.2rem);line-height:1.9;color:var(--ivory)}
.stat-l{font-family:var(--khmer);font-size:.88rem;color:var(--ivory-dim);line-height:1.9}
@media(max-width:860px){.stat-grid{grid-template-columns:repeat(2,1fr)}}

/* ---- section heads ---- */
.sec-label{display:flex;align-items:center;gap:10px;font-family:var(--khmer);font-size:.85rem;letter-spacing:.18em;color:var(--gold-2);margin-bottom:8px}
.sec-title{font-family:var(--display);font-size:clamp(1.7rem,4.2vw,2.8rem);color:var(--ivory);line-height:var(--lh-display);margin-bottom:6px}
.sec-sub{font-family:var(--khmer);color:var(--ivory-dim);max-width:640px;line-height:2.1;margin-bottom:56px}

/* ---- era timeline ---- */
.timeline{padding:110px 0 80px}
.timeline-list{position:relative;max-width:1060px;margin:0 auto}
.tl-line{position:absolute;top:0;bottom:0;left:50%;width:2px;translate:-50% 0;background:linear-gradient(180deg,transparent,var(--gold-dim) 4%,var(--gold-dim) 96%,transparent)}
.tl-item{position:relative;width:50%;padding:0 60px 64px 0}
.tl-item:nth-child(odd){margin-left:50%;padding:0 0 64px 60px}
.tl-dot{position:absolute;top:36px;right:-9px;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 30%,var(--gold-2),var(--gold) 60%)}
.tl-item:nth-child(odd) .tl-dot{right:auto;left:-9px}
.tl-card{display:block;border:1px solid rgba(201,168,124,.16);border-radius:var(--r-md);overflow:hidden;background:linear-gradient(180deg,rgba(30,51,38,.6),rgba(20,36,27,.6));transition:border-color .3s,box-shadow .4s var(--ease)}
.tl-card:hover{border-color:var(--gold-dim);box-shadow:0 22px 50px rgba(0,0,0,.45)}
.tl-media{position:relative;aspect-ratio:16/9}
.tl-media img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease)}
.tl-card:hover .tl-media img{transform:scale(1.06)}
.tl-year{position:absolute;left:16px;bottom:10px;font-family:var(--title);font-size:1.25rem;line-height:1.9;color:var(--gold-2);text-shadow:0 2px 14px rgba(0,0,0,.9)}
.tl-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(10,16,13,.85))}
.tl-year{z-index:1}
.tl-body{padding:22px 26px 26px;display:flex;flex-direction:column;gap:8px}
.tl-kicker{display:flex;align-items:center;gap:8px;font-family:var(--khmer);font-size:.78rem;letter-spacing:.08em;color:var(--gold-2);line-height:1.9}
.tl-card h3{font-family:var(--title);font-size:1.35rem;color:var(--ivory)}
.tl-card p{font-family:var(--khmer);color:var(--ivory-dim);font-size:.94rem;line-height:2}
.tl-go{font-family:var(--khmer);color:var(--gold-2);font-size:.88rem}
.more{text-align:center;margin-top:20px}
@media (max-width:760px){
  .tl-line{left:8px;translate:none}
  .tl-item,.tl-item:nth-child(odd){width:100%;margin-left:0;padding:0 0 44px 36px}
  .tl-dot,.tl-item:nth-child(odd) .tl-dot{right:auto;left:0}
}

/* ---- living heritage ---- */
.living{padding:100px 0 130px;border-top:1px solid rgba(212,175,55,.14)}
.living .sec-title{margin-bottom:44px}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:24px}
.card{display:flex;flex-direction:column;border:1px solid rgba(201,168,124,.16);border-radius:var(--r-md);overflow:hidden;background:linear-gradient(180deg,rgba(30,51,38,.6),rgba(20,36,27,.6));transition:border-color .3s,box-shadow .4s var(--ease)}
.card:hover{border-color:var(--gold-dim);box-shadow:0 22px 50px rgba(0,0,0,.45)}
.card-media{position:relative;aspect-ratio:16/10}
.card-clip{position:absolute;inset:0;overflow:hidden;border-bottom:1px solid rgba(212,175,55,.25)}
.card-img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease)}
.card:hover .card-img{transform:scale(1.07)}
.card-badge{position:absolute;right:14px;bottom:-22px;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:var(--moss-3);border:1px solid var(--gold-dim);color:var(--gold-2);z-index:2;box-shadow:0 6px 20px rgba(0,0,0,.4)}
.card-body{padding:26px 24px 26px;display:flex;flex-direction:column;gap:8px;flex:1}
.card-tag{font-family:var(--khmer);font-size:.76rem;letter-spacing:.08em;color:var(--gold-2);line-height:1.9}
.card h3{font-family:var(--title);font-size:1.3rem;color:var(--ivory)}
.card p{font-family:var(--khmer);color:var(--ivory-dim);font-size:.92rem;line-height:2;flex:1}
.card-go{font-family:var(--khmer);color:var(--gold-2);font-size:.88rem}
</style>
