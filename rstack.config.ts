// Configuration guide: https://rstack.rs/config
import { define } from 'rstack';

define.fmt({
  singleQuote: true,
  sortPackageJson: true,
  ignorePatterns: ['skills-lock.yaml'],
});

define.staged({
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['rs lint --fix', 'rs fmt'],
  '*.{json,jsonc,json5,md,mdx,css,scss,less,html,yml,yaml}': 'rs fmt',
});

define.lint(({ ts }) => [
  {
    ignores: ['skills/**/scripts/*'],
  },
  ts.configs.recommended,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
