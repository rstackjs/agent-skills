import { defineConfig, ts } from '@rslint/core';

export default defineConfig([
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
]);
