import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  lang: 'en',
  title: 'string-kit',
  description: 'A small collection of string utilities',
  themeConfig: {
    nav: [
      {
        text: 'Guide',
        link: '/guide/getting-started',
        activeMatch: '/guide/',
      },
      {
        text: 'API',
        link: '/api/',
        activeMatch: '/api/',
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/example/string-kit',
      },
    ],
  },
});
