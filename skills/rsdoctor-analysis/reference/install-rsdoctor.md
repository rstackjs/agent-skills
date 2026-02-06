# install rsdoctor plugin

## Scenario Decision Logic

**When helping users install Rsdoctor, first determine their project type:**

1. **Check project type** (`projectType`):
   - If project uses **Rspack** (including Rsbuild, Rslib, or any Rspack-based project) → Use `projectType: 'rspack'`
   - If project uses **Webpack** (webpack >= 5) → Use `projectType: 'webpack'`

2. **Check framework** (`framework`):
   - If using **pure Rspack** → Use `framework: 'rspack'`
   - If using **Rsbuild** → Use `framework: 'rsbuild'`
   - If using **pure Webpack** → Use `framework: 'webpack'`
   - If using **Modern.js** → Use `framework: 'modern.js'`

**Decision flow:**

```
User's project
├─ Is it Rspack-based? (Rsbuild, Rslib, etc.)
│  ├─ Yes → projectType: 'rspack'
│  │  ├─ Pure Rspack? → framework: 'rspack'
│  │  ├─ Rsbuild? → framework: 'rsbuild'
│  │  └─ Modern.js? → framework: 'modern.js'
│  └─ No → Is it Webpack >= 5?
│     └─ Yes → projectType: 'webpack', framework: 'webpack'
```

## Step 1: install dependencies

**Conditional logic:** Based on `projectType` variable

**IF** `projectType === 'rspack'`:

### Rspack projects

For projects based on Rspack, such as Rsbuild or Rslib:
**Note:** Prefer using the latest versions of the above dependencies when available.

```bash
npm add @rsdoctor/rspack-plugin -D
pnpm add @rsdoctor/rspack-plugin -D
```

**ELSE IF** `projectType === 'webpack'`:

### webpack projects

Rsdoctor only supports webpack >= 5.

For projects based on webpack:

```bash
npm add @rsdoctor/webpack-plugin -D
pnpm add @rsdoctor/webpack-plugin -D
```

## Step 2: register plugin

After the dependency installation, you need to integrate the Rsdoctor plugin into your project. Below are some examples of common tools and frameworks:

:::important
**Important:** To generate `rsdoctor-data.json` file that can be analyzed by AI tools, you must configure the plugin with:

- `output.mode: 'brief'`
- `output.options.type: ['json']`

This configuration ensures that only JSON data is generated, which is suitable for analysis without starting the Rsdoctor server.
:::

**Conditional logic:** Based on `framework` variable

**IF** `framework === 'rspack'`:

### Rspack

Initialize the plugin in the [plugins](https://www.rspack.rs/config/plugins.html#plugins) of `rspack.config.ts`:

```ts title="rspack.config.ts"
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

export default {
  // ...
  plugins: [
    // Only register the plugin when RSDOCTOR is true, as the plugin will increase the build time.
    process.env.RSDOCTOR &&
      new RsdoctorRspackPlugin({
        disableClientServer: true,
        // Generate JSON data only (suitable for AI tools analysis)
        output: {
          mode: 'brief',
          options: {
            type: ['json'],
          },
        },
      }),
  ].filter(Boolean),
};
```

- **Options:** The plugin provides some configurations, please refer to [Options](../../config/options/options).

**ELSE IF** `framework === 'rsbuild'`:

### Rsbuild

Rsbuild has built-in support for Rsdoctor, so you don't need to manually register plugins. See [Rsbuild - Use Rsdoctor](https://rsbuild.rs/guide/debug/rsdoctor) for more details.

To generate JSON data for tmates analysis, configure it in `rsbuild.config.ts`:

```ts title="rsbuild.config.ts"
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  // ... existing config
  tools: {
    rspack(config, { appendPlugins }) {
      // Only register plugin when RSDOCTOR is true, as plugin will increase build time
      if (process.env.RSDOCTOR) {
        appendPlugins(
          new RsdoctorRspackPlugin({
            disableClientServer: true, // Required: Prevent starting local server
            output: {
              mode: 'brief', // Required: Use brief mode
              options: {
                type: ['json'], // Required: Only generate JSON data
              },
            },
          }),
        );
      }
    },
  },
});
```

**ELSE IF** `framework === 'webpack'`:

### Webpack

Initialize the plugin in the [plugins](https://webpack.js.org/configuration/plugins/#plugins) of `webpack.config.js`:

```js title="webpack.config.js"
const { RsdoctorWebpackPlugin } = require('@rsdoctor/webpack-plugin');

module.exports = {
  // ...
  plugins: [
    // Only register the plugin when RSDOCTOR is true, as the plugin will increase the build time.
    process.env.RSDOCTOR &&
      new RsdoctorWebpackPlugin({
        disableClientServer: true,
        // Generate JSON data only (suitable for AI tools analysis)
        output: {
          mode: 'brief',
          options: {
            type: ['json'],
          },
        },
      }),
  ].filter(Boolean),
};
```

- **Options:** The plugin provides some configurations, please refer to [Options](../../config/options/options).

**ELSE IF** `framework === 'modern.js'`:

### Modern.js

Initialize the plugin in the [tools.rspack](https://modernjs.dev/configure/app/tools/rspack) of `modern.config.ts`:

```ts title="modern.config.ts"
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

export default {
  // ...
  tools: {
    rspack(config, { appendPlugins }) {
      // Only register the plugin when RSDOCTOR is true, as the plugin will increase the build time.
      if (process.env.RSDOCTOR) {
        appendPlugins(
          new RsdoctorRspackPlugin({
            disableClientServer: true,
            // Generate JSON data only (suitable for AI tools analysis)
            output: {
              mode: 'brief',
              options: {
                type: ['json'],
              },
            },
          }),
        );
      }
    },
  },
};
```

- **Options:** The plugin provides some configurations, please refer to [Options](../../config/options/options).

:::tip
For projects using Modern.js's webpack mode, please register the plugin through [tools.webpack](https://modernjs.dev/configure/app/tools/webpack). Use `RsdoctorWebpackPlugin` from `@rsdoctor/webpack-plugin`.
:::

## Step 3: Locate the rsdoctor-data.json

First, check whether `rsdoctor-data.json` already exists in the build output (artifacts) directory. Common locations include:

- `dist/rsdoctor-data.json` (most common)
- `output/rsdoctor-data.json`
- `static/rsdoctor-data.json`
- `.rsdoctor/rsdoctor-data.json` (if using custom reportDir)

If you cannot find the file, ask the user to provide the path to `rsdoctor-data.json`. If the file truly does not exist, they will need to run a build with `RSDOCTOR=true` to generate it.

The file is typically generated in the same directory as your build output (e.g., `dist`, `output`, `static`). You can configure a custom output directory using the `output.reportDir` option:

**Conditional logic:** Based on `projectType` variable

```js
// IF projectType === 'rspack'
// Rspack project
new RsdoctorRspackPlugin({
  disableClientServer: true,
  output: {
    mode: 'brief',
    options: {
      type: ['json'],
    },
    reportDir: './dist', // Custom output directory (defaults to build output directory)
  },
});

// ELSE IF projectType === 'webpack'
// Webpack project
new RsdoctorWebpackPlugin({
  disableClientServer: true,
  output: {
    mode: 'brief',
    options: {
      type: ['json'],
    },
    reportDir: './dist',
  },
});
```

:::tip
The Rsdoctor plugin provides some configurations, please refer to [Options](../../config/options/options).
:::

---

## Step 4: Use JSON file for analysis

Once you have the `rsdoctor-data.json` file, you can use it for analysis. This JSON file contains all the build analysis data and can be used without starting the Rsdoctor server.

**Example usage:**

**Note:** Use the new command format `<group> <subcommand>`, not the old format `<group>:<subcommand>`.

```bash
# Analyze chunks using JSON file (calls listChunks() function)
node scripts/rsdoctor.js chunks list --data-file ./dist/rsdoctor-data.json

# Analyze packages using JSON file (calls listPackages() function)
node scripts/rsdoctor.js packages list --data-file ./dist/rsdoctor-data.json

# Analyze specific module (calls getModuleByPath() function)
node scripts/rsdoctor.js modules by-path --path "src/index.tsx" --data-file ./dist/rsdoctor-data.json

# Find large chunks (calls findLargeChunks() function, finds chunks >30% over median and >= 1MB)
node scripts/rsdoctor.js chunks large --data-file ./dist/rsdoctor-data.json

# Optimize bundle (calls optimizeBundle() function)
node scripts/rsdoctor.js bundle optimize --data-file ./dist/rsdoctor-data.json
```

**Command format:**

- New format: `<group> <subcommand>` (e.g., `chunks list`, `bundle optimize`)
- Old format (deprecated): `<group>:<subcommand>` (e.g., `chunks:list`, `bundle:optimize`)
- Script path: `scripts/rsdoctor.js` (built file)

**Benefits of JSON Mode:**

- ✅ No need to keep the build process running
- ✅ Works in CI/CD environments
- ✅ Can be shared and version controlled
- ✅ Faster analysis for large projects
- ✅ No server connection required

:::tip
The JSON file contains all the build analysis data, so it can be quite large for complex projects. Make sure to add it to `.gitignore` if you don't want to commit it to your repository.
:::
