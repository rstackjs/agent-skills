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

After the dependency installation, you need to integrate the Rsdoctor plugin into your project. Below are configuration examples for different Rspack-based frameworks:

:::important
**Important:** To generate `rsdoctor-data.json` file that can be analyzed by AI tools, you must configure the plugin with:

- `output.mode: 'brief'`
- `output.options.type: ['json']`

This configuration ensures that only JSON data is generated, which is suitable for analysis without starting the Rsdoctor server.
:::

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
        // Generate JSON data only (suitable for AI tools analysis)
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

To generate JSON data for AI tools analysis, configure it in `rsbuild.config.ts`:

```ts title="rsbuild.config.ts"
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

export default {
  tools: {
    rspack: {
      plugins: [
        process.env.RSDOCTOR === 'true' &&
          new RsdoctorRspackPlugin({
            disableClientServer: true, // Required: Prevent starting local server
            output: {
              mode: 'brief', // Required: Use brief mode
              options: {
                type: ['json'], // Required: Only generate JSON data
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
              disableClientServer: true, // Required: Prevent starting local server
              output: {
                mode: 'brief', // Required: Use brief mode
                options: {
                  type: ['json'], // Required: Only generate JSON data
                },
              },
            }),
        ],
      },
    },
  },
});
```

## Step 3: Locate the rsdoctor-data.json

First, check whether `rsdoctor-data.json` already exists in the build output (artifacts) directory. Common locations include:

- `dist/rsdoctor-data.json` (most common)
- `output/rsdoctor-data.json`
- `static/rsdoctor-data.json`
- `.rsdoctor/rsdoctor-data.json` (if using custom reportDir)

If you cannot find the file, ask the user to provide the path to `rsdoctor-data.json`. If the file truly does not exist, they will need to run a build with `RSDOCTOR=true` to generate it.

The file is typically generated in the same directory as your build output (e.g., `dist`, `output`, `static`). You can configure a custom output directory using the `output.reportDir` option:

```js
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
```

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
