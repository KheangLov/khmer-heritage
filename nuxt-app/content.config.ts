// ---------------------------------------------------------------------------
// content.config.ts — @nuxt/content v3 collection definitions.
//
// The set-up converter (scripts/convert-static-to-content.mjs) turns the 26
// verified static article pages (public/static/pages/*.html) into Khmer
// markdown under app/content/:
//   era/era-N.md        — the 15 Suriyakati "era" timeline pages
//   heritage/<slug>.md  — the 11 living-heritage articles (amok, krama, …)
// This file types both collections so the /era and /heritage renderers can
// queryCollection them with full-field inference. Frontmatter mirrors the
// static pages' hero/kicker/facts/related contract 1:1 (see converter).
// ---------------------------------------------------------------------------
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    era: defineCollection({
      type: 'page',
      source: {
        // Files live under app/content/ (Nuxt 4 layout), not the default
        // <rootDir>/content — point the source cwd there explicitly.
        // (Relative to rootDir; the '~~/' alias is broken in this module
        // version — it concatenates rootDir without a separator.)
        cwd: 'app/content',
        // 'era/**' (not '**/era/**') so the fixed prefix 'era/' is stripped
        // from stems — stems become the bare slugs the routes expect (era-0,
        // amok), not 'era/era-0'.
        include: 'era/**',
      },
      schema: z.object({
        title: z.string(),
        kicker: z.string(),
        h1: z.string(),
        en: z.string(),
        sub: z.string(),
        hero: z.string(),
        heroAlt: z.string(),
        facts: z.array(z.object({ t: z.string(), d: z.string() })),
        related: z.array(z.object({ label: z.string(), to: z.string() })),
      }),
    }),
    heritage: defineCollection({
      type: 'page',
      source: {
        cwd: 'app/content',
        include: 'heritage/**',
      },
      schema: z.object({
        title: z.string(),
        kicker: z.string(),
        h1: z.string(),
        en: z.string(),
        sub: z.string(),
        hero: z.string(),
        heroAlt: z.string(),
        facts: z.array(z.object({ t: z.string(), d: z.string() })),
        related: z.array(z.object({ label: z.string(), to: z.string() })),
      }),
    }),
  },
})
