import { basename, join } from 'node:path';
import { defineConfig } from '@rslib/core';
import { baseConfig } from '@rstackjs/config/rslib.config.ts';

const pkgName = basename(import.meta.dirname);

export default defineConfig({
  lib: [
    {
      ...baseConfig,
      source: {
        entry: {
          rsdoctor: './src/index.ts',
        },
      },
      banner: {
        js: '#!/usr/bin/env node',
      },
      output: {
        distPath: join(import.meta.dirname, `../../skills/${pkgName}/scripts`),
        legalComments: 'none',
        cleanDistPath: true,
      },
      tools: {
        rspack: {
          optimization: {
            runtimeChunk: false,
          },
        },
      },
    },
  ],
});
