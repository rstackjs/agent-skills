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

After the dependency installation, check the installed `@rsdoctor/webpack-plugin` version before changing config:

- For `@rsdoctor/webpack-plugin` >= `1.5.11`, use the existing Rsdoctor-enabled build and set `RSDOCTOR_OUTPUT='json'` to generate `rsdoctor-data.json`. If the project gates plugin activation with `RSDOCTOR`, set that too. Do not modify the Rsdoctor plugin config only for JSON output.
- For `@rsdoctor/webpack-plugin` < `1.5.11`, configure the plugin with `output.mode: 'brief'` and `output.options.type: ['json']` as shown below.

### Webpack

For older plugin versions or projects that still need to register the plugin, initialize it in the [plugins](https://webpack.js.org/configuration/plugins/#plugins) of `webpack.config.js`:

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
