# Common Steps for Rsdoctor Installation

This document contains common steps that apply to both Rspack and Webpack projects.

## Step 3: Locate the rsdoctor-data.json

First, check whether `rsdoctor-data.json` already exists in the build artifact/output directory. It is commonly emitted under directories such as `dist`, `output`, `static`, or a custom `reportDir`. Common locations include:

- `dist/rsdoctor-data.json` (most common)
- `output/rsdoctor-data.json`
- `static/rsdoctor-data.json`
- `.rsdoctor/rsdoctor-data.json` (if using custom reportDir)

If you cannot find the file, ask the user to provide the path to `rsdoctor-data.json`. If the file truly does not exist, they will need to run a build with `RSDOCTOR=true` to generate it.

The file is typically generated in the same directory as your build output (e.g., `dist`, `output`, `static`). You can configure a custom output directory using the `output.reportDir` option:

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

Stable CLI entry:

- `npx @rsdoctor/agent-cli <group> <subcommand> [options]` (recommended)
- `rsdoctor-agent <group> <subcommand> [options]` (if binary is available in PATH)
- `npx @rsdoctor/agent-cli list`
- `npx @rsdoctor/agent-cli query <tool-name> --data-file <path> [--input <json>]`
- `--filter` is supported by every data-fetch function; use it by default to keep only required fields and reduce token usage
- For agent execution, prefer running CLI commands in background mode when possible, then collect and summarize outputs.
- Reuse already returned results from context/history first, then run only missing queries.
- For duplicate packages and tree-shaking issues, do first-pass issue summary first; ask user before continuing reference-chain tracing.
- Choose `--filter` fields from [rsdoctor-data-types.md](rsdoctor-data-types.md) so filters match `@rsdoctor/types` data fields.
- For tree-shaking issues, use `tree-shaking summary` directly and control output size with `--filter` plus `--compact` where useful.
- Budget gate: if one response exceeds `20k` tokens (o200k_base) or raw JSON exceeds `2 MB`, skip broad commands and continue with filtered/targeted ones.
- For `tree-shaking summary`, filter/compact first and only use aggregated final findings.

**Example usage (repository root):**

```bash
# Discover tool catalog for query
npx @rsdoctor/agent-cli list

# Run one catalog tool directly
npx @rsdoctor/agent-cli query build_summary --data-file ./dist/rsdoctor-data.json

# Analyze chunks
npx @rsdoctor/agent-cli chunks list --data-file ./dist/rsdoctor-data.json

# Analyze packages
npx @rsdoctor/agent-cli packages list --data-file ./dist/rsdoctor-data.json

# Analyze specific module by path
npx @rsdoctor/agent-cli modules by-path --path "src/index.tsx" --data-file ./dist/rsdoctor-data.json

# Analyze side-effects (keep small page size to control output volume)
npx @rsdoctor/agent-cli modules side-effects --data-file ./dist/rsdoctor-data.json --page-size 10

# Only when explicitly requested: analyze bailout reasons for up to 100 modules
npx @rsdoctor/agent-cli tree-shaking bailout-reasons --data-file ./dist/rsdoctor-data.json --modules "<module-list>"

# Analyze tree-shaking issues (filter using rsdoctor-data-types fields, compact, and aggregate before using)
npx @rsdoctor/agent-cli tree-shaking summary --data-file ./dist/rsdoctor-data.json --filter "<command-specific-filter>"

# Build optimize with side-effects pagination tuned for analysis
npx @rsdoctor/agent-cli bundle optimize --data-file ./dist/rsdoctor-data.json --side-effects-page-size 10

# Example: return only required fields
npx @rsdoctor/agent-cli packages duplicates --data-file ./dist/rsdoctor-data.json --filter "<command-specific-filter>"
```

**Command format:**

- Top-level mode: `list`, `query`
- Use `<group> <subcommand>` (for example: `chunks list`, `bundle optimize`, `tree-shaking summary`)
- `--compact` is for direct/`ai` command mode; `query` uses `--input`
- Use `--filter` on every data-fetch command to return only required fields
- Derive `--filter` field names from [rsdoctor-data-types.md](rsdoctor-data-types.md)
- For tree-shaking diagnostics, use `tree-shaking summary` directly and control output size with `--filter` plus `--compact` where useful
- Only run `tree-shaking bailout-reasons` when the user explicitly asks for bailout reason analysis; pass `--modules <module-list>` to limit the query to the requested modules, with at most 100 modules per command
- If `tree-shaking summary` is used, filter/compact first and only use reduced results
- Do not use deprecated `<group>:<subcommand>` format
- Full command map: [command-map.md](command-map.md)

**Benefits of JSON Mode:**

- ✅ No need to keep the build process running
- ✅ Works in CI/CD environments
- ✅ Can be shared and version controlled
- ✅ Faster analysis for large projects
- ✅ No server connection required

Note: `rsdoctor-data.json` can be large in complex projects. Add it to `.gitignore` if you do not want to commit it.
