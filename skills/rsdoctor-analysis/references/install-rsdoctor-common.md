# Common Steps for Rsdoctor Installation

This document contains common steps that apply to both Rspack and Webpack projects.

## Step 3: Locate the rsdoctor-data.json

First, check whether `rsdoctor-data.json` already exists in the build artifact/output directory. It is commonly emitted under directories such as `dist`, `output`, `static`, or a custom `reportDir`. Common locations include:

- `dist/rsdoctor-data.json` (most common)
- `output/rsdoctor-data.json`
- `static/rsdoctor-data.json`
- `.rsdoctor/rsdoctor-data.json` (if using custom reportDir)

If you cannot find the file, ask the user to provide the path to `rsdoctor-data.json`. If the file truly does not exist, check the installed `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin` version before changing config:

- For plugin versions >= `1.5.11`, run the existing Rsdoctor-enabled build with `RSDOCTOR_OUTPUT='json'`. If the project gates plugin activation with `RSDOCTOR`, set that too. Do not modify the Rsdoctor plugin config just to generate `rsdoctor-data.json`.
- For plugin versions < `1.5.11`, configure the plugin with JSON output as shown below, then run the build with `RSDOCTOR=true`.

The file is typically generated in the same directory as your build output (e.g., `dist`, `output`, `static`). For plugin versions < `1.5.11`, configure a custom output directory using the `output.reportDir` option:

```js
// Example for Rspack: use RsdoctorRspackPlugin
// Example for Webpack: use RsdoctorWebpackPlugin
new RsdoctorRspackPlugin({
  // or RsdoctorWebpackPlugin
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

Analyze the JSON file with the `rsdoctor-agent` CLI from the repository root or another directory that can access the JSON file:

```bash
rsdoctor-agent build summary --data-file ./dist/rsdoctor-data.json --filter "<fields>"
```

Keep analysis output small:

- Reuse already returned results from context/history first, then run only missing queries.
- Use `--filter` on data-fetch commands to return only fields required for the current question.
- Use first-pass summaries for duplicate packages and tree-shaking issues; ask before continuing reference-chain tracing.
- Stop broad commands when one response exceeds `5k` tokens (o200k_base) or `500 KB` raw output, then switch to filtered or targeted queries.

For command names, option scopes, tree-shaking command selection, and `--filter` guidance, use [command-map.md](command-map.md). For raw data field names, use [rsdoctor-data-types.md](rsdoctor-data-types.md).

**Benefits of JSON Mode:**

- ✅ No need to keep the build process running
- ✅ Works in CI/CD environments
- ✅ Can be shared and version controlled
- ✅ Faster analysis for large projects
- ✅ No server connection required

Note: `rsdoctor-data.json` can be large in complex projects. Add it to `.gitignore` if you do not want to commit it.
