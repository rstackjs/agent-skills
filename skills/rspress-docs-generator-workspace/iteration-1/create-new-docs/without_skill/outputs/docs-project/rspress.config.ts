import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: '.',
  title: 'string-kit',
  description: 'A small collection of string utilities',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Case Utilities', link: '/api/case' },
            { text: 'Truncate Utilities', link: '/api/truncate' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/example/string-kit' },
    ],
  },
});
