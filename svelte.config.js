import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/kit/vite";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    // Use static adapter for GitHub Pages
    adapter: adapter({
      pages: "build",        // output HTML goes here
      assets: "build",       // output static assets go here
      fallback: "index.html" // required for single-page app routing
    }),

    paths: {
      base: "/globalSalesvis", // required for repo-based Pages
    },

    alias: {
      "@data-types": "src/lib/types",
      "@utils": "src/lib/utils",
      "@components": "src/lib/components",
    },
  },
};

export default config;
