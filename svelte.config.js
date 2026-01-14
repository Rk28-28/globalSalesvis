// svelte.config.js
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/kit/vite";

const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: "index.html"
    }),
    paths: {
      base: "/globalSalesvis"  // <--- THIS IS CRUCIAL
    },
    alias: {
      "@data-types": "src/lib/types",
      "@utils": "src/lib/utils",
      "@components": "src/lib/components"
    }
  }
};

export default config;
