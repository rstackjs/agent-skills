import { defineConfig, type LibConfig } from '@rslib/core';
import path from 'node:path';

// Configure the folders to be bundled here, the entry is scripts/index.ts
const BUNDLE_FOLDER = {
  'rsdoctor': {
    src: './rsdoctor',
    scripts: '../skills/rsdoctor/scripts',
  },
};

const libs: LibConfig[] = Object.entries(BUNDLE_FOLDER).map(([id, { src, scripts }]) => {
  return {
    format: 'esm',
    dts: false,
    bundle: true,
    autoExternal: false,
    experiments: {
      advancedEsm: true,
    },
    banner: {
      js: '#!/usr/bin/env node',
    },
    id,
    source: {
      entry: {
        'rsdoctor': [path.join(src, 'index.ts')],
      },
    },
    output: {
      distPath: path.join(scripts),
      legalComments: 'none',
      cleanDistPath: true,
    },
  } as LibConfig;
});

export default defineConfig({
  lib: libs,
});
