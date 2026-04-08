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

- Repository root: `node skills/rsdoctor-analysis/scripts/rsdoctor.js <group> <subcommand> [options]`
- Skill directory: `node scripts/rsdoctor.js <group> <subcommand> [options]`

**Example usage (repository root):**

```bash
# Analyze chunks
node skills/rsdoctor-analysis/scripts/rsdoctor.js chunks list --data-file ./dist/rsdoctor-data.json

# Analyze packages
node skills/rsdoctor-analysis/scripts/rsdoctor.js packages list --data-file ./dist/rsdoctor-data.json

# Analyze specific module by path
node skills/rsdoctor-analysis/scripts/rsdoctor.js modules by-path --path "src/index.tsx" --data-file ./dist/rsdoctor-data.json

# Analyze tree-shaking summary
node skills/rsdoctor-analysis/scripts/rsdoctor.js tree-shaking summary --data-file ./dist/rsdoctor-data.json

# Optimize bundle inputs
node skills/rsdoctor-analysis/scripts/rsdoctor.js bundle optimize --data-file ./dist/rsdoctor-data.json
```

**Command format:**

- Use `<group> <subcommand>` (for example: `chunks list`, `bundle optimize`, `tree-shaking summary`)
- Do not use deprecated `<group>:<subcommand>` format
- Full command map: [command-map.md](command-map.md)

**Benefits of JSON Mode:**

- ✅ No need to keep the build process running
- ✅ Works in CI/CD environments
- ✅ Can be shared and version controlled
- ✅ Faster analysis for large projects
- ✅ No server connection required

Note: `rsdoctor-data.json` can be large in complex projects. Add it to `.gitignore` if you do not want to commit it.
