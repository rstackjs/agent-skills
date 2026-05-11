# Common Steps for Rsdoctor Installation

This document contains common steps that apply to both Rspack and Webpack projects.

## Step 3: Locate the rsdoctor-data.json

First, use the fast path to check whether `rsdoctor-data.json` already exists. If the user provided a path, check that path first. Otherwise check common build artifact/output locations before any package-manager, install, config, or build command:

- `dist/rsdoctor-data.json` (most common)
- `output/rsdoctor-data.json`
- `static/rsdoctor-data.json`
- `.rsdoctor/rsdoctor-data.json` (if using custom reportDir)

If common paths do not contain the file, run one bounded local file search that excludes expensive directories, for example `rg --files -g 'rsdoctor-data.json' -g '!node_modules' -g '!**/.git/**'`. If `rsdoctor-data.json` is found, skip the generation/version gate and go directly to JSON analysis. If it is not found, do not run any `rsdoctor-agent` analysis command; ask for the data path or generate the file first.

For repeated analysis in the same repository, use a lightweight project-local cache such as `.rsdoctor-analysis-cache.json`. Reuse it only when the cached data-file path still exists and cached modification times match the current `rsdoctor-data.json`, dependency files (`package.json`, lock files), relevant build config files, and plugin `package.json` if recorded. Refresh the cache after locating a new data file or confirming a plugin version.

When the runtime supports parallel execution, run independent local initialization checks concurrently: common path checks, bounded `rg --files` lookup, and local plugin-version file reads. Do not run `rsdoctor-agent` CLI checks until a real `rsdoctor-data.json` path exists. Treat plugin-version results as speculative until the data file is confirmed missing; never let parallel plugin checks trigger generation by themselves.

If you cannot find the file, ask the user to provide the path to `rsdoctor-data.json`. If the file truly does not exist and generation/setup is required, check the installed `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin` version before changing config or running a build. The `@rsdoctor/agent-cli` version does not prove plugin support for `RSDOCTOR_OUTPUT=json`.

Required version gate (use exactly this if/else order):

1. Identify `pluginName`: `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin`.
2. Determine `pluginVersion` from local files first: dependency declarations in `package.json`, lockfile entries, then installed `node_modules/<plugin>/package.json`. Use package-manager output such as `pnpm why @rsdoctor/rspack-plugin` / `npm ls @rsdoctor/rspack-plugin` only as a fallback.
3. Choose one branch; do not merge branches:

```text
if pluginName is missing:
  install/register the matching Rsdoctor plugin, then MUST configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
else if pluginVersion is unknown:
  resolve pluginVersion first; if still unknown, MUST configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
else if pluginVersion >= 1.5.11:
  do not modify plugin config just for JSON; build with RSDOCTOR_OUTPUT=json and RSDOCTOR=true if needed
else: # pluginVersion < 1.5.11
  MUST configure output.mode='brief' and output.options.type=['json']; build with RSDOCTOR=true only
```

Preflight every build command: `RSDOCTOR_OUTPUT=json` is allowed only in the `pluginVersion >= 1.5.11` branch. For missing, unknown, or `< 1.5.11` versions, a command such as `RSDOCTOR_OUTPUT=json RSDOCTOR=true pnpm run build:rspack` is incorrect.

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
