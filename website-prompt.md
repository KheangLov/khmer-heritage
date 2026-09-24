# Website Generation Prompt — "អង្គរ | Angkor: A Living Heritage"

> Copy everything below the line into your AI website builder (v0, Lovable, Claude, Cursor, etc.). It is written to produce a complete, single-page, scroll-driven experience.

---

## ROLE & GOAL

You are a world-class creative developer and art director. Build a **single-page, scroll-driven storytelling website** about **Khmer (Cambodian) heritage** — from prehistoric Cambodia to the living culture of today. The site must feel like walking through a temple gallery: cinematic, sacred, immersive, and unmistakably Khmer — never a generic template. The centerpiece is a **vertical heritage timeline that animates as the user scrolls**, with each era revealing itself like a bas-relief emerging from stone.

## CONCEPT & MOOD

- **Title:** "អង្គរ | Angkor — A Living Heritage" (subtitle: *From the first potters of Laang Spean to the dancers of today*)
- **Narrative arc:** Dawn → Kingdom → Golden Age → Fall → Darkness → Revival. The user journeys through 2,000+ years of history in one continuous scroll.
- **Mood:** reverence, wonder, resilience. Ancient stone meeting modern web craft. Quiet luxury, not kitsch. No clip-art, no generic "Asian" stock clichés.
- **Language:** English primary, with Khmer script (អក្សរខ្មែរ) used decoratively and for era titles — it is one of the world's oldest living scripts and a core part of the identity.

## DESIGN SYSTEM

### Palette (stone + water + gold)
- **Stone:** warm sandstone tones — `#C9A87C`, `#B08D5F`, `#8A6A45` (carved stone, laterite)
- **Moss/patina:** deep jungle greens — `#2E4A35`, `#1E3326`, `#14241B` (backgrounds)
- **Night/void:** near-black green `#0C1410` for the darkest chapters
- **Gold:** `#D4AF37` / `#E8C96A` — accents, dividers, sacred highlights (temple gold)
- **Water:** soft teal `#7FA8A0` for the Tonle Sap / moat motifs
- **Text:** warm ivory `#F2E8D5` on dark; deep umber `#3A2A1A` on light sections
- Use a **duotone treatment** for imagery: sandstone + jungle green, so every photo feels carved into the same world.

### Typography
- **Display/headings:** a serif with gravitas — *Cormorant Garamond* or *Playfair Display* (weights 300–700, generous letter-spacing for Khmer-era titles).
- **Khmer script:** *Noto Serif Khmer* or *Battambang* for អង្គរ, era titles, and decorative glyphs.
- **Body:** *Inter* or *Source Sans 3*, light weights, comfortable line-height.
- **Mono accents:** *IBM Plex Mono* or *Space Mono* for dates, coordinates, and metadata (e.g., `802 CE — PHNOM KULEN`).

### Texture & motifs (SVG, CSS, or generated)
- Subtle **sandstone grain** and **laterite speckle** background textures (SVG noise/filters).
- **Lotus-bud tower silhouette** (the Angkor Wat profile) as a recurring divider/watermark.
- **Naga** (serpent) line-art that coils along the timeline spine.
- **Apsara** hand-gesture glyphs (mudras) as section markers.
- **Krama checkered pattern** strip as a thin border on the footer and cards.
- **Lotus** and **garuda** motifs in section dividers; **Churning of the Ocean of Milk** tug-of-war motif as the hero's background concept (gods vs. demons pulling the naga rope).
- Khmer numerals (០១ ០២ ០៣…) for era numbering.

## PAGE STRUCTURE

### 1. Hero — "The Churning"
- Full-viewport cinematic opener. Animated **Churning of the Ocean of Milk** scene: a naga rope being pulled by two rows of figures (gods left, demons right) rendered as elegant line-art/SVG that slowly animates (the rope undulates, figures tug rhythmically).
- Title in Khmer script (អង្គរ) fading into the English title. Subtitle. A **scroll cue** ("Scroll to begin the journey") with a slow-pulsing chevron.
- Background: deep jungle green with drifting mist (CSS gradients + slow parallax), faint temple silhouette at the horizon.

### 2. Intro / "The Land"
- Short poetic intro: the Mekong, the Tonle Sap (the great lake that reverses its flow), the rice fields, the sacred mountains. 2–3 sentences, elegant typography, a wide cinematic image with duotone treatment.
- Three quick stat chips: *629 years of empire · 1,200 m² of bas-relief · 7 UNESCO inscriptions*.

### 3. THE TIMELINE — "The Journey Through Time" (centerpiece)
A **vertical scroll-driven timeline** with these mechanics:

- **Fixed spine:** a vertical line (the naga's body) runs down the center of the section. As the user scrolls, a **golden "ink" fills the spine** from top to bottom, tracking scroll progress (like a progress bar carved in stone).
- **Era stops:** 15 chapters (data below). Each stop has:
  - A **node** on the spine (a lotus-bud or apsara glyph) that activates when reached.
  - A **year badge** (mono font, e.g., `802 CE`).
  - A **Khmer title** (e.g., ការបង្កើតអាណាចក្រ) + English title.
  - A short evocative description (2–4 sentences, poetic but factual).
  - A **visual**: image, illustration, or generated artwork with duotone treatment.
- **Scroll-triggered animations per stop** (use IntersectionObserver / GSAP ScrollTrigger / Framer Motion — whichever fits your stack):
  - Content **rises from below** with a soft blur-to-focus ("emerging from mist").
  - The node **ignites** (golden glow pulse) when it enters the viewport.
  - The spine ink **advances** to the current stop.
  - Alternate layout: stops alternate left/right of the spine on desktop; stack on mobile.
  - **Parallax:** each stop's image drifts at a slightly different speed than the text.
  - **Progress rail:** a thin fixed rail on the right edge listing all 15 eras; the active era is highlighted; clicking a rail item smooth-scrolls to that stop.
- **Chapter mood shifts:** the background color subtly shifts per era (e.g., dawn = warm sandstone, golden age = deep green + gold, dark years = near-black, revival = sunrise gold). Transition backgrounds with smooth crossfades as you scroll.
- **Special stops:**
  - **Angkor Wat stop:** a slow "reveal" of the temple silhouette — the lotus-bud towers draw themselves (SVG stroke animation) as the user scrolls into it.
  - **Dark years stop (1975–79):** restrained, respectful — muted palette, slower animations, a single candle-like glow; text acknowledges the genocide and the artists who were lost, then leads into revival.
  - **Revival stop:** the Apsara dancer — a subtle animated figure (SVG line art) whose hand gestures (mudras) cycle slowly.

### 4. "The Living Heritage" — culture grid
After the timeline, a section celebrating what lives today:
- Cards (with hover lift + gold border glow) for: **Royal Ballet & Apsara dance, Sbek Thom shadow theatre, Kun Lbokator martial arts, Chapei Dang Veng music, Krama weaving, Khmer cuisine**.
- Each card: small motif icon, title, one-line description, and a "UNESCO inscribed" tag where applicable.

### 5. Festivals strip
A horizontal auto-scrolling marquee (pausable) of festival names in Khmer + English: បុណ្យចូលឆ្នាំថ្មី Khmer New Year · បុណ្យភ្ជុំបិណ្ឌ Pchum Ben · បុណ្យអុំទូក Bon Om Touk · ពិធីបុណ្យវិសាខបូជា Visak Bochea · ពិធីច្រត់ព្រះនង្គ័ល Royal Ploughing…

### 6. UNESCO honors
Elegant list/table of the 5 World Heritage sites (Angkor 1992, Preah Vihear 2008, Sambor Prei Kuk 2017, Koh Ker 2023, Memorial Sites 2025) and the 7 intangible elements — presented as "inscriptions on stone" cards.

### 7. Footer
- Krama-pattern border. Closing line in Khmer: *អរគុណសម្រាប់ការធ្វើដំណើរ* ("Thank you for the journey").
- Credits note: "Content compiled from UNESCO, Britannica, and academic sources."

## TIMELINE CONTENT (use this data verbatim)

1. **c. 6000 BCE — ព្រឹកព្រលឹម | Dawn** — At Laang Spean cave, the first Khmer ancestors shape pottery and stone tools. A civilization begins before history is written.
2. **1st–6th c. CE — នគរភ្នំ | Funan** — The first kingdom rises on the Mekong delta: an Indianized maritime power trading silk, gold, and spices; the legend of Kaundinya and the Naga princess is born.
3. **6th–8th c. — ចេនឡា | Chenla** — Power moves inland. At Ishanapura (Sambor Prei Kuk) 186 brick temples rise, and the Khmer script — one of the oldest living scripts — takes form.
4. **802 — ការបង្កើតអាណាចក្រ | The Empire is Born** — Jayavarman II is consecrated on Phnom Kulen as universal monarch. The Khmer Empire begins its 629-year reign.
5. **877–910 — ភ្នំប្រាសាទ | The First Temple-Mountains** — Bakong and Phnom Bakheng rise: stone replicas of Mount Meru, home of the gods, ringed by cosmic oceans.
6. **967 — បន្ទាយស្រី | Banteay Srei** — The "citadel of women": a jewel carved in rose-red sandstone, the finest stonework ever made by Khmer hands.
7. **1113–1150 — អង្គរវត្ត | Angkor Wat** — Suryavarman II builds the largest religious structure on Earth. Its 1,200 m² of bas-reliefs churn the Ocean of Milk, and its silhouette becomes the soul of a nation — still on the flag today.
8. **1181–1218 — អង្គរធំ | Angkor Thom & the Bayon** — Jayavarman VII, the great builder-king, raises a walled city and the Bayon, whose 216 serene faces watch over the world.
9. **1296 — ភ្ញៀវចុងក្រោយ | The Last Eyewitness** — Chinese envoy Zhou Daguan writes the only first-hand account of daily life in the golden city.
10. **1431 — ការដួលរលំ | The Fall** — Angkor is sacked and abandoned to the jungle. The empire ends; the memory endures.
11. **16th–17th c. — រាមកេរ្តិ៍ | The Reamker** — The national epic is composed — the Khmer Ramayana — weaving Buddhist wisdom into dance, shadow theatre, and stone.
12. **1863–1953 — ការរកឃើញឡើងវិញ | Rediscovery** — Under the French protectorate, the jungle is cleared and Angkor is studied, restored, and given to the world.
13. **1953 — ឯករាជ្យ | Independence & the Apsara Renaissance** — Cambodia is free; Queen Kossamak recreates the Apsara dance from temple reliefs, and the arts bloom again.
14. **1975–1979 — គ្រាងងឹត | The Dark Years** — The Khmer Rouge regime takes nearly a quarter of the population and nearly all the artists. The Royal Ballet "practically ceases to exist."
15. **1992–2025 — ការរស់ឡើងវិញ | Revival** — Angkor is inscribed by UNESCO; dancers return to the stage; seven intangible heritages are honored; the culture lives — resilient, radiant, unbroken.

## TECHNICAL REQUIREMENTS

- **Stack:** React + Vite (or Next.js) with Tailwind CSS; animations via **GSAP ScrollTrigger** or **Framer Motion** (preferred: GSAP for the timeline spine + parallax). Vanilla JS + CSS is acceptable if simpler.
- **Performance:** lazy-load images (`loading="lazy"`), `content-visibility: auto` on off-screen sections, respect `prefers-reduced-motion` (provide a static fallback where animations are disabled).
- **Responsive:** flawless on mobile — timeline becomes a single left-rail spine with stacked cards; touch-scroll friendly; no horizontal overflow.
- **Accessibility:** semantic HTML, aria-labels on timeline nodes, keyboard-navigable progress rail, sufficient color contrast, alt text on all imagery.
- **Images:** use high-quality public-domain/CC images of Angkor, Banteay Srei, Bayon, Apsara dancers, krama weaving, etc. (e.g., Wikimedia Commons), or generate consistent duotone artwork. Apply the sandstone/green duotone filter to unify them.
- **Fonts:** load via Google Fonts (Cormorant Garamond, Noto Serif Khmer, Inter, IBM Plex Mono) with `display=swap`.
- **Extras that elevate it:** subtle ambient sound toggle (optional, muted by default — e.g., soft pinpeat-inspired drone) — only if easy; otherwise skip. A "begin journey" button that smooth-scrolls to the timeline. A thin gold progress bar at the very top of the page.

## QUALITY BAR

- The scroll experience must feel **cinematic and intentional** — every animation should have purpose (reveal, emphasis, transition), never gratuitous.
- The design must be **unmistakably Khmer** through palette, motifs, script, and content — not through generic "Asian" decoration.
- Handle the **dark years chapter with dignity**: no sensational imagery, no autoplay effects, muted and respectful.
- The site should work as a **museum-quality digital exhibit** — something a heritage organization would be proud to publish.

## DELIVERABLE

A complete, runnable single-page website implementing everything above, with the timeline data included, ready to preview in the browser.