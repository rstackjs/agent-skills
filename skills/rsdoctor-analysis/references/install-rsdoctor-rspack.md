# Install Rsdoctor Plugin for Rspack Projects

This guide covers installation for Rspack-based projects, including:

- Rspack CLI
- Rsbuild
- Modern.js
- Rslib
- Rspress

## Step 1: Install Dependencies

For projects based on Rspack, such as Rsbuild or Rslib:

**Note:** Prefer using the latest versions of the above dependencies when available.

```bash
npm add @rsdoctor/rspack-plugin -D
pnpm add @rsdoctor/rspack-plugin -D
```

## Step 2: Register Plugin

After the dependency installation, check the installed `@rsdoctor/rspack-plugin` version before changing config:

- For `@rsdoctor/rspack-plugin` >= `1.5.11`, use the existing Rsdoctor-enabled build and set `RSDOCTOR_OUTPUT='json'` to generate `rsdoctor-data.json`. If the project gates plugin activation with `RSDOCTOR`, set that too. Do not modify the Rsdoctor plugin config only for JSON output.
- For `@rsdoctor/rspack-plugin` < `1.5.11`, configure the plugin with `output.mode: 'brief'` and `output.options.type: ['json']` as shown below.

Below are configuration examples for older Rspack plugin versions or projects that still need to register the plugin:

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

## Step 3 & 4: Locate and Use rsdoctor-data.json

For steps on locating the `rsdoctor-data.json` file and using it for analysis, see the [common installation guide](./install-rsdoctor-common.md).
