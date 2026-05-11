# Install Rsdoctor Plugin for Webpack Projects

This guide covers installation for Webpack projects (webpack >= 5).

## Step 1: Install Dependencies

Rsdoctor only supports webpack >= 5.

For projects based on webpack:

```bash
npm add @rsdoctor/webpack-plugin -D
pnpm add @rsdoctor/webpack-plugin -D
```

## Step 2: Register Plugin

After the dependency installation, check the installed `@rsdoctor/webpack-plugin` version before changing config or running a build. Do not infer plugin capabilities from `@rsdoctor/agent-cli --version`.

Required version gate (use exactly this if/else order):

1. Set `pluginName = '@rsdoctor/webpack-plugin'`.
2. Determine `pluginVersion` from local files first: dependency declarations in `package.json`, lockfile entries, then `node_modules/@rsdoctor/webpack-plugin/package.json` if installed. Use `pnpm why @rsdoctor/webpack-plugin` / `npm ls @rsdoctor/webpack-plugin` only as a fallback. When repeating analysis, reuse a valid `.rsdoctor-analysis-cache.json` plugin entry before re-reading files; invalidate it if `package.json`, lockfiles, or the plugin package file mtime changed.
3. Choose one branch; do not merge branches:

```text
if @rsdoctor/webpack-plugin is missing:
  install/register @rsdoctor/webpack-plugin, then configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
else if pluginVersion is unknown:
  resolve pluginVersion first; if still unknown, configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
else if pluginVersion >= 1.5.11:
  do not modify plugin config just for JSON; build with RSDOCTOR_OUTPUT=json and RSDOCTOR=true if needed
else: # pluginVersion < 1.5.11
  MUST configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
```

Preflight every build command: `RSDOCTOR_OUTPUT=json` is allowed only in the `pluginVersion >= 1.5.11` branch. For missing, unknown, or `< 1.5.11`, `RSDOCTOR_OUTPUT=json` is forbidden. For example, when `@rsdoctor/webpack-plugin` is `1.5.7`, this command is incorrect:

```bash
RSDOCTOR_OUTPUT=json RSDOCTOR=true pnpm run build
```

### Webpack

For old Webpack plugin versions, unknown versions, missing plugins, or projects that still need to register the plugin, initialize it in the [plugins](https://webpack.js.org/configuration/plugins/#plugins) of `webpack.config.js`:

```js title="webpack.config.js"
const { RsdoctorWebpackPlugin } = require('@rsdoctor/webpack-plugin');

module.exports = {
  // ...
  plugins: [
    // Only register the plugin when RSDOCTOR is true, as the plugin will increase the build time.
    process.env.RSDOCTOR &&
      new RsdoctorWebpackPlugin({
        disableClientServer: true,
        // Required for @rsdoctor/webpack-plugin < 1.5.11.
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

## Step 3 & 4: Locate and Use rsdoctor-data.json

For steps on locating the `rsdoctor-data.json` file and using it for analysis, see the [common installation guide](./install-rsdoctor-common.md).
