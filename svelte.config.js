import adapter from '@sveltejs/adapter-static';
import sveltePreprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: sveltePreprocess(),

  kit: {
    adapter: adapter({
      pages: 'build',       // output HTML goes here
      assets: 'build',      // static assets
      fallback: 'index.html' // SPA fallback for your map route
    }),

    paths: {
      base: '/globalSalesvis' // your repo name for GitHub Pages
    },

    prerender: {
      default: true
    },

    alias: {
      '@data-types': 'src/lib/types',
      '@utils': 'src/lib/utils',
      '@components': 'src/lib/components'
    }
  }
};

export default config;
