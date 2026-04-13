import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://contentflow.com',
  base: '/',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/drafts/'),
    }),
  ],
});
