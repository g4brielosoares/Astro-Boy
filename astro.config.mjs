import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://astro-boy.vercel.app',
  integrations: [mdx(), sitemap()],
  output: "static",
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});