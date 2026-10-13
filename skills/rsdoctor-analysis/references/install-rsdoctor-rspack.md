# Install Rsdoctor plugin for Rspack projects

This guide covers installation for Rspack-based projects, including:

- Rspack CLI
- Rsbuild
- Modern.js
- Rslib
- Rspress

## Step 1: Check the Plugin Version

Follow the [Generation Gate](../SKILL.md#generation-gate) before installation or build. Rspack 2.x uses `@rsdoctor/core` 2.x; existing Rspack 1.x integrations use `@rsdoctor/rspack-plugin` 1.x. Do not add the legacy plugin to a 2.x project. A standalone `@rsdoctor/core` 1.x dependency may exist for custom rules and does not identify the active plugin.

If no plugin is installed, select a version compatible with the project's Rspack version and install it with the project's package manager. If both 2.x and 1.x plugins are actively registered, report the mixed setup instead of installing another package. A framework-owned transitive 1.x package alone does not establish that its plugin is active.

## Step 2: Register Plugin and Generate JSON

For `@rsdoctor/core` 2.x, preserve the project's existing plugin registration point and use this import and output configuration when generating analysis data:

```ts
import { RsdoctorRspackPlugin } from '@rsdoctor/core';

new RsdoctorRspackPlugin({
  disableClientServer: true,
  output: {
    mode: 'brief',
    options: { type: ['json'] },
  },
});
```

Add `'json'` alongside `'html'` when an existing brief report needs both. If normal report settings are changed temporarily, restore them after generating the data. Build with `RSDOCTOR=true`; do not use `RSDOCTOR_OUTPUT=json` for this 2.x branch.

The following examples apply to the legacy `@rsdoctor/rspack-plugin` 1.x branch when explicit JSON configuration is needed (version below `1.5.11` or unknown):

### Rspack CLI

Initialize the plugin in the [plugins](https://www.rspack.rs/config/plugins.html#plugins) of `rspack.config.ts`:

```ts title="rspack.config.ts"
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

export default {
  plugins: [
    // Only register the plugin when RSDOCTOR is true, as the plugin will increase the build time.
    process.env.RSDOCTOR &&
      new RsdoctorRspackPlugin({
        disableClientServer: true,
        // Required for @rsdoctor/rspack-plugin < 1.5.11.
        output: {
          mode: 'brief',
          options: {
            type: ['json'],
          },
        },
      }),
  ],
};
```

### Rsbuild/Rslib/Modern.js

See [Rsbuild - Use Rsdoctor](https://rsbuild.rs/guide/debug/rsdoctor) for more details.
If this is Modern.js project can see [tools.rspack](https://modernjs.dev/configure/app/tools/rspack) of `modern.config.ts`:

For `@rsdoctor/rspack-plugin` < `1.5.11`, configure JSON output in `rsbuild.config.ts`:

```ts title="rsbuild.config.ts"
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

export default {
  tools: {
    rspack: {
      plugins: [
        process.env.RSDOCTOR === 'true' &&
          new RsdoctorRspackPlugin({
            disableClientServer: true, // Prevent starting local server
            output: {
              mode: 'brief', // Required for plugin versions < 1.5.11
              options: {
                type: ['json'], // Only generate JSON data
              },
            },
          }),
      ],
    },
  },
};
```

### Rspress

For Rspress projects, configure the plugin in `builderConfig.tools.rspack`:

```ts title="rspress.config.ts"
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  builderConfig: {
    tools: {
      rspack: {
        plugins: [
          process.env.RSDOCTOR === 'true' &&
            new RsdoctorRspackPlugin({
              disableClientServer: true, // Prevent starting local server
              output: {
                mode: 'brief', // Required for plugin versions < 1.5.11
                options: {
                  type: ['json'], // Only generate JSON data
                },
              },
            }),
        ],
      },
    },
  },
});
```

## Step 3 & 4: locate and use rsdoctor-data.json

For steps on locating the `rsdoctor-data.json` file and using it for analysis, see the [common installation guide](./install-rsdoctor-common.md).
