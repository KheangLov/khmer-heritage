import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      // The static heritage site lives in public/static/ and is served as a
      // public asset, not a Nuxt route — the link-checker cannot know about it.
      'link-checker/valid-route': 'off',
      'link-checker/valid-sitemap-link': 'off',
    },
  },
)