// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from "@astrojs/node";
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://soareso.com',
  integrations: [mdx(), sitemap()],
  output: "static",
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
  },
});