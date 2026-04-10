# Common Steps for Rsdoctor Installation

This document contains common steps that apply to both Rspack and Webpack projects.

## Step 3: Locate the rsdoctor-data.json

First, check whether `rsdoctor-data.json` already exists in the build output (artifacts) directory. Common locations include:

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
- `npx @rsdoctor/agent-cli describe-tools`
- `npx @rsdoctor/agent-cli run-tool <tool-name> --data-file <path> [--input <json>]`
- `npx @rsdoctor/agent-cli analyze "<query>" --data-file <path> [--format json|text]`
- For agent execution, prefer running CLI commands in background mode when possible, then collect and summarize outputs.

**Example usage (repository root):**

```bash
# Discover tool catalog for run-tool
npx @rsdoctor/agent-cli describe-tools

# Run one catalog tool directly
npx @rsdoctor/agent-cli run-tool build_summary --data-file ./dist/rsdoctor-data.json

# Run one-shot natural-language analysis plan
npx @rsdoctor/agent-cli analyze "find duplicate dependencies and tree shaking issues" --data-file ./dist/rsdoctor-data.json --format json

# Analyze chunks
npx @rsdoctor/agent-cli chunks list --data-file ./dist/rsdoctor-data.json

# Analyze packages
npx @rsdoctor/agent-cli packages list --data-file ./dist/rsdoctor-data.json

# Analyze specific module by path
npx @rsdoctor/agent-cli modules by-path --path "src/index.tsx" --data-file ./dist/rsdoctor-data.json

# Analyze tree-shaking summary
npx @rsdoctor/agent-cli tree-shaking summary --data-file ./dist/rsdoctor-data.json

# Optimize bundle inputs
npx @rsdoctor/agent-cli bundle optimize --data-file ./dist/rsdoctor-data.json
```

**Command format:**

- Top-level mode: `describe-tools`, `run-tool`, `analyze`
- Use `<group> <subcommand>` (for example: `chunks list`, `bundle optimize`, `tree-shaking summary`)
- `--compact` is for direct/`ai` command mode; `run-tool`/`analyze` use `--input` and `--format` instead
- Do not use deprecated `<group>:<subcommand>` format
- Full command map: [command-map.md](command-map.md)

**Benefits of JSON Mode:**

- ✅ No need to keep the build process running
- ✅ Works in CI/CD environments
- ✅ Can be shared and version controlled
- ✅ Faster analysis for large projects
- ✅ No server connection required

Note: `rsdoctor-data.json` can be large in complex projects. Add it to `.gitignore` if you do not want to commit it.
