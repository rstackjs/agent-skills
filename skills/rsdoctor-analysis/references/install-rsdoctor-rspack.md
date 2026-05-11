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

After the dependency installation, check the installed `@rsdoctor/rspack-plugin` version before changing config or running a build. Do not infer plugin capabilities from `@rsdoctor/agent-cli --version`.

Required version gate (use exactly this if/else order):

1. Set `pluginName = '@rsdoctor/rspack-plugin'`.
2. Determine `pluginVersion` from local files first: dependency declarations in `package.json`, lockfile entries, then `node_modules/@rsdoctor/rspack-plugin/package.json` if installed. Use `pnpm why @rsdoctor/rspack-plugin` / `npm ls @rsdoctor/rspack-plugin` only as a fallback. When repeating analysis, reuse a valid `.rsdoctor-analysis-cache.json` plugin entry before re-reading files; invalidate it if `package.json`, lockfiles, or the plugin package file mtime changed.
3. Choose one branch; do not merge branches:

```text
if @rsdoctor/rspack-plugin is missing:
  install/register @rsdoctor/rspack-plugin, then configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
else if pluginVersion is unknown:
  resolve pluginVersion first; if still unknown, configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
else if pluginVersion >= 1.5.11:
  do not modify plugin config just for JSON; build with RSDOCTOR_OUTPUT=json and RSDOCTOR=true if needed
else: # pluginVersion < 1.5.11
  MUST configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
```

Preflight every build command: `RSDOCTOR_OUTPUT=json` is allowed only in the `pluginVersion >= 1.5.11` branch. For missing, unknown, or `< 1.5.11`, `RSDOCTOR_OUTPUT=json` is forbidden. For example, when `@rsdoctor/rspack-plugin` is `1.5.7`, this command is incorrect:

```bash
RSDOCTOR_OUTPUT=json RSDOCTOR=true pnpm run build:rspack
```

Below are configuration examples for old Rspack plugin versions, unknown versions, missing plugins, or projects that still need to register the plugin:

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
