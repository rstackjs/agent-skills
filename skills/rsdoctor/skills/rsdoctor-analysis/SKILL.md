---
name: rsdoctor-analytics
description: Analyze Rspack/Webpack bundles from local Rsdoctor build data without MCP. Zero-dependency JS CLI for chunk/module/package/loader insights.
---

# Rsdoctor Analytics Assistant Skill

You are an AI assistant for Rsdoctor. Through the rsdoctor-skill JS CLI, read the `rsdoctor-data.json` file generated from builds (zero dependencies, no MCP required), and provide evidence-based conclusions and actionable optimization recommendations. Response order: Conclusion → Metrics → Actions → Sources → Gaps.

## ⚠️ Important Principle: Read-Only Analysis, Do Not Modify Code

**The main function of the rsdoctor plugin is to analyze and output recommendations, not to modify user code.**

### ✅ Operations Allowed to Modify Code (Only the Following Two Cases)

1. **When executing `install` command:**
   - ✅ Allowed to install dependencies (legacy packages: `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin`)
   - ✅ Allowed to modify `package.json` (add dependencies)

2. **When executing `config` command:**
   - ✅ Allowed to create or modify configuration files (`rspack.config.js`, `webpack.config.js`, `rsbuild.config.ts`, `modern.config.ts`)
   - ✅ Allowed to add Rsdoctor plugin configuration

### ❌ Operations Prohibited from Modifying Code (All Other Commands)

**The following commands are read-only, only outputting analysis results and recommendations, without modifying any code:**

- ❌ `chunks list` / `chunks by-id` / `chunks large` - Only output analysis data
- ❌ `packages list` / `packages by-name` / `packages dependencies` / `packages duplicates` / `packages similar` - Only output analysis data
- ❌ `modules by-id` / `modules by-path` / `modules issuer` / `modules exports` / `modules side-effects` - Only output analysis data
- ❌ `assets list` / `assets diff` / `assets media` - Only output analysis data
- ❌ `loaders hot-files` / `loaders directories` - Only output analysis data
- ❌ `build summary` / `build entrypoints` / `build config` / `bundle optimize` - Only output analysis data and recommendations
- ❌ `errors list` / `errors by-code` / `errors by-level` - Only output analysis data
- ❌ `rules list` - Only output analysis data

**Important:** Even if analysis results suggest users modify code (such as splitting chunks, removing duplicate packages, optimizing loader configuration, etc.), **do not automatically execute these modifications**. Only provide suggestions and guidance, letting users decide whether to modify.

## Trigger Criteria

- **Three usage scenarios:** Create MR, get diff via MR URL, MR checklist + failure log aggregation.

## Prerequisites

- **Entry script:** `node ${ROOT}/skills/rsdoctor/scripts/rsdoctor.js <group> <subcommand> [options]`
- **Command format:** `<group> <subcommand> [--option value] [--data-file <path>] [--compact]`
- **Global options:**
  - `--data-file <path>`: **Required**, specify the path to rsdoctor-data.json file
  - `--compact`: Optional, compact JSON output (no indentation)

## Prerequisites and Version Requirements
- Node 18+.
- Minimum versions: `@rsdoctor/rspack-plugin >= 1.1.2`, `@rsdoctor/webpack-plugin >= 1.1.2`.

### Dependency Check and Installation

Check Rsdoctor dependencies:

1. **Check legacy packages** (if found, no installation needed):
   - Check if `@rsdoctor/rspack-plugin` exists in `package.json` (in `devDependencies`, applicable to Rspack/Rsbuild/Modern Rspack)
   - Check if `@rsdoctor/webpack-plugin` exists in `package.json` (in `devDependencies`, applicable to Webpack/Modern Webpack)
   - **If any legacy package exists**: Dependencies are installed, no need to install

2. **If none found, show installation commands by project type:**
   - Rspack/Rsbuild/Modern Rspack projects:
     ```bash
     pnpm add @rsdoctor/rspack-plugin -D
     ```
   - Webpack/Modern Webpack projects:
     ```bash
     pnpm add @rsdoctor/webpack-plugin -D
     ```

## Quick Start (Including Plugin Installation)

### Usage

**Important: Do not execute build commands, only search for existing `rsdoctor-data.json` files for analysis.**

1) **Search for `rsdoctor-data.json` file**
   - Search for `rsdoctor-data.json` file in the target project's output directory
   - Common paths: `dist/rsdoctor-data.json`, `output/rsdoctor-data.json`, `static/rsdoctor-data.json`, `.rsdoctor/rsdoctor-data.json`
   - If file is found, use it directly for analysis (skip to step 3)

2) **If file is not found, prompt user to configure according to the examples below and execute build to generate rsdoctor-data.json**
   - Ask user if they know the location of `rsdoctor-data.json` file
   - If user doesn't know or file truly doesn't exist, prompt user to configure Rsdoctor plugin first and execute build
   - First check if dependencies are installed (according to dependency check logic above)
   - If dependencies are not installed, provide installation commands:
     - Rspack/Rsbuild/Modern Rspack projects: `pnpm add @rsdoctor/rspack-plugin -D`
     - Webpack/Modern Webpack projects: `pnpm add @rsdoctor/webpack-plugin -D`
   - Provide the following configuration examples and build commands:

   **Rsdoctor Plugin Configuration Example (Rspack):**
   ```js
   // rspack.config.js
   const { RsdoctorRspackPlugin } = require('@rsdoctor/rspack-plugin');

   module.exports = {
     // ... existing config
     plugins: [
       // ... existing plugins
       // Only register plugin when RSDOCTOR is true, as plugin will increase build time
       process.env.RSDOCTOR &&
         new RsdoctorRspackPlugin({
           disableClientServer: true,  // Must be true, otherwise local server will start and block LLM execution
           output: {
             mode: 'brief',  // Required: Use brief mode
             options: {
               type: ['json'],  // Must include 'json' to generate rsdoctor-data.json
             },
           },
         }),
     ].filter(Boolean),
   };
   ```

   **Rsdoctor Plugin Configuration Example (Webpack):**
   ```js
   // webpack.config.js
   const { RsdoctorWebpackPlugin } = require('@rsdoctor/webpack-plugin');

   module.exports = {
     // ... existing config
     plugins: [
       // ... existing plugins
       // Only register plugin when RSDOCTOR is true, as plugin will increase build time
       process.env.RSDOCTOR &&
         new RsdoctorWebpackPlugin({
           disableClientServer: true,  // Must be true, otherwise local server will start and block LLM execution
           output: {
             mode: 'brief',  // Required: Use brief mode
             options: {
               type: ['json'],  // Must include 'json' to generate rsdoctor-data.json
             },
           },
         }),
     ].filter(Boolean),
   };
   ```

   **Build commands:**
   ```bash
   # Set RSDOCTOR environment variable and execute build
   RSDOCTOR=true npm run build
   # Or use pnpm
   RSDOCTOR=true pnpm run build
   # Or use yarn
   RSDOCTOR=true yarn build
   ```
   
   After build completes, `rsdoctor-data.json` file will be generated in the output directory (common locations: `dist/rsdoctor-data.json`, `output/rsdoctor-data.json`, `static/rsdoctor-data.json`).

3) **Use found file for analysis**
   - Use `--data-file <path>` parameter to specify JSON file path and execute analysis commands

**Analysis Examples (assuming `rsdoctor-data.json` file is found):**
```bash
# Analyze chunks
node scripts/rsdoctor.js chunks list --data-file ./dist/rsdoctor-data.json

# Analyze packages
node scripts/rsdoctor.js packages list --data-file ./dist/rsdoctor-data.json

# Compare asset differences between two rsdoctor data files
node scripts/rsdoctor.js assets diff --baseline ./dist/rsdoctor-data.json --current ./dist/rsdoctor-data-after.json
```

## Execution Method

:::tip
Scripts are in the skill's directory, use absolute paths to execute! Built files are in the `dist/` directory.
:::

- **Absolute path execution:** `node ${ROOT}/skills/rsdoctor/scripts/rsdoctor.js <group> <subcommand> [options] [--data-file <path>] [--compact]`
- **Command structure:** `<group> <subcommand> [--option value]`
- **Global parameters:**
  - `--data-file <path>`: **Required**, specify the path to rsdoctor-data.json file
  - `--compact`: Optional, compact JSON output (no indentation)
- Default output is JSON format

**Common usage examples:**
```bash
# View all chunks (calls listChunks() function)
node scripts/rsdoctor.js chunks list --data-file ./dist/rsdoctor-data.json

# View specific chunk details (calls getChunkById() function)
node scripts/rsdoctor.js chunks by-id --id 0 --data-file ./dist/rsdoctor-data.json

# Find module (calls getModuleByPath() function)
node scripts/rsdoctor.js modules by-path --path "src/index.tsx" --data-file ./dist/rsdoctor-data.json

# Analyze large chunks (calls findLargeChunks() function, finds chunks >30% over median and >= 1MB)
node scripts/rsdoctor.js chunks large --data-file ./dist/rsdoctor-data.json

# View duplicate packages (calls detectDuplicatePackages() function)
node scripts/rsdoctor.js packages duplicates --data-file ./dist/rsdoctor-data.json

# Comprehensive optimization recommendations (calls optimizeBundle() function)
node scripts/rsdoctor.js bundle optimize --data-file ./dist/rsdoctor-data.json

# Get build summary (build time analysis, calls getSummary() function)
node scripts/rsdoctor.js build summary --data-file ./dist/rsdoctor-data.json

# List all assets (calls listAssets() function)
node scripts/rsdoctor.js assets list --data-file ./dist/rsdoctor-data.json

# Get all errors and warnings (calls listErrors() function)
node scripts/rsdoctor.js errors list --data-file ./dist/rsdoctor-data.json

# Filter by error code (e.g., E1001 duplicate package error, calls getErrorsByCode() function)
node scripts/rsdoctor.js errors by-code --code E1001 --data-file ./dist/rsdoctor-data.json

# Get modules with side effects (cannot be tree-shaken, calls getSideEffects() function)
node scripts/rsdoctor.js modules side-effects --data-file ./dist/rsdoctor-data.json

# Get build configuration (calls getConfig() function)
node scripts/rsdoctor.js build config --data-file ./dist/rsdoctor-data.json
```

## Workflow
1) **Prerequisites check:** Version requirements met, JSON file readable.
2) **Data retrieval:** Execute corresponding CLI commands (format: `<group> <subcommand> [options]`), commands will automatically call corresponding function methods:
   - When path is needed, first execute `modules by-path --path "<path>"` (calls `getModuleByPath()`), if multiple matches then execute `modules by-id --id <id>` (calls `getModuleById()`)
   - Other commands directly execute corresponding `<group> <subcommand>` format
3) **Output delivery:** Follow response format closely; if data is missing, explain reason and next steps.

**Important note:** All commands require `--data-file <path>` global parameter to specify JSON file path.

## Command Mapping (CLI Command → Function Method → Purpose)

### Chunks (Output/Chunk Analysis)
- `chunks list` → `listChunks()` → Get all chunks (id, name, size, modules)
  
  **Pagination parameters:**
  - `--page-number <pageNumber>`: Page number (default: 1)
  - `--page-size <pageSize>`: Page size (default: 100, max: 1000)
  
  Examples:
  ```bash
  # Default: return page 1, 100 items per page
  node scripts/rsdoctor.js chunks list --data-file ./dist/rsdoctor-data.json
  
  # Return page 2, 50 items per page
  node scripts/rsdoctor.js chunks list --page-number 2 --page-size 50 --data-file ./dist/rsdoctor-data.json
  ```

- `chunks by-id --id <n>` → `getChunkById()` → Get detailed information by chunk id
- `chunks large` → `findLargeChunks()` → Find oversized chunks (threshold = median * 1.3 and >= 1MB)

### Modules (Module Analysis)
- `modules by-id --id <id>` → `getModuleById()` → Get module details by module id
- `modules by-path --path "<path>"` → `getModuleByPath()` → Find module by path (if multiple matches, returns candidates, then use `modules by-id --id <id>`)
- `modules issuer --id <id>` → `getModuleIssuerPath()` → Trace module's issuer/import chain
- `modules exports` → `getModuleExports()` → Get module export information
- `modules side-effects` → `getSideEffects()` → Get modules that cannot be tree-shaken based on `module.bailoutReason` data from `rsdoctor-data.json`
  
  **Key:** This command **must use the `bailoutReason` field from `rsdoctor-data.json`** to analyze why tree-shaking failed.
  
  **bailoutReason field description:**
  - The `bailoutReason` field identifies why a module cannot be tree-shaken
  - Common values: `"side effects"` (side effects), `"dynamic import"` (dynamic import), `"unknown exports"` (unknown exports), `"re-export"` (re-export), etc.
  - Only modules with `bailoutReason` are returned (i.e., modules that cannot be tree-shaken)
  
  **Return results categorized:**
  - Side effect modules in node_modules (statistics by package name, size and count, listing libraries with large side effects like react, lodash-es, etc.)
  - Side effect modules in user code (listing specific module paths, moduleId and **bailoutReason**, for targeted optimization)
  
  **Pagination parameters:**
  - `--page-number <pageNumber>`: Page number (default: 1)
  - `--page-size <pageSize>`: Page size (default: 100, max: 1000)
  
  Examples:
  ```bash
  # Default: return page 1, 100 items per page
  node scripts/rsdoctor.js modules side-effects --data-file ./dist/rsdoctor-data.json
  
  # Return page 2, 200 items per page
  node scripts/rsdoctor.js modules side-effects --page-number 2 --page-size 200 --data-file ./dist/rsdoctor-data.json
  ```

### Packages (Dependency Analysis)
- `packages list` → `listPackages()` → List all packages (including size/duplication information)
- `packages by-name --name <pkg>` → `getPackageByName()` → Find package by package name
- `packages dependencies` → `getPackageDependencies()` → Get package dependency graph
  
  **Pagination parameters:**
  - `--page-number <pageNumber>`: Page number (default: 1)
  - `--page-size <pageSize>`: Page size (default: 100, max: 1000)
  
  Examples:
  ```bash
  # Default: return page 1, 100 items per page
  node scripts/rsdoctor.js packages dependencies --data-file ./dist/rsdoctor-data.json
  
  # Return page 2, 200 items per page
  node scripts/rsdoctor.js packages dependencies --page-number 2 --page-size 200 --data-file ./dist/rsdoctor-data.json
  ```
- `packages duplicates` → `detectDuplicatePackages()` → Detect duplicate packages (using E1001 overlay rule)
- `packages similar` → `detectSimilarPackages()` → Detect similar packages (e.g., lodash/lodash-es)

### Assets (Asset Analysis)
- `assets list` → `listAssets()` → List all build output assets (including path, size, gzip size, etc.)
- `assets diff --baseline <path> --current <path>` → `diffAssets()` → Compare asset volume and count changes between two builds
- `assets media` → `getMediaAssets()` → Media asset optimization recommendations

### Loaders (Compilation Time Analysis)
- `loaders hot-files` → `getHotFiles()` → Get the slowest 1/3 loader/file pairs (sorted by cost)
  
  **Pagination and filtering parameters:**
  - `--page-number <pageNumber>`: Page number (default: 1)
  - `--page-size <pageSize>`: Page size (default: 100, max: 1000)
  - `--min-costs <minCosts>`: Minimum cost threshold (filter condition)
  
  Examples:
  ```bash
  # Default: return page 1, 100 items per page
  node scripts/rsdoctor.js loaders hot-files --data-file ./dist/rsdoctor-data.json
  
  # Return page 2, 50 items per page, and only show items with cost >= 100ms
  node scripts/rsdoctor.js loaders hot-files --page-number 2 --page-size 50 --min-costs 100 --data-file ./dist/rsdoctor-data.json
  ```

- `loaders directories` → `getDirectories()` → Loader time grouped by directory
  
  **Pagination and filtering parameters:**
  - `--page-number <pageNumber>`: Page number (default: 1)
  - `--page-size <pageSize>`: Page size (default: 100, max: 1000)
  - `--min-total-costs <minTotalCosts>`: Minimum total cost threshold (filter condition)
  
  Examples:
  ```bash
  # Default: return page 1, 100 items per page
  node scripts/rsdoctor.js loaders directories --data-file ./dist/rsdoctor-data.json
  
  # Return page 1, 200 items per page, and only show directories with total cost >= 500ms
  node scripts/rsdoctor.js loaders directories --page-size 200 --min-total-costs 500 --data-file ./dist/rsdoctor-data.json
  ```

### Build (Build Analysis)
- `build summary` → `getSummary()` → Get build summary (build time analysis, including stage costs and total build time)
- `build entrypoints` → `listEntrypoints()` → List all entrypoints and their configuration
- `build config` → `getConfig()` → Get complete rspack/webpack build configuration information
- `bundle optimize` → `optimizeBundle()` → Comprehensive optimization recommendations (aggregates duplicates/similar/media/chunks large/modules side-effects)
  
  **Step-by-step execution parameters (recommended for large data scenarios):**
  - `--step <step>`: Execution step (1: basic analysis, 2: side effects modules). If not specified, executes both steps
  - `--side-effects-page-number <pageNumber>`: Page number for side effects (default: 1, only used in step 2)
  - `--side-effects-page-size <pageSize>`: Page size for side effects (default: 100, max: 1000, only used in step 2)
  
  **Usage examples:**
  ```bash
  # Step 1: Execute basic analysis (duplicates/similar/media/large chunks)
  node scripts/rsdoctor.js bundle optimize --step 1 --data-file ./dist/rsdoctor-data.json
  
  # Step 2: Execute side effects modules analysis (paginated)
  node scripts/rsdoctor.js bundle optimize --step 2 --side-effects-page-number 1 --side-effects-page-size 100 --data-file ./dist/rsdoctor-data.json
  
  # Default: Execute all steps (backward compatible)
  node scripts/rsdoctor.js bundle optimize --data-file ./dist/rsdoctor-data.json
  ```
  
  **Performance optimization notes:**
  - Step 1 executes fast basic analysis (rules, packages, chunks)
  - Step 2 executes side effects modules analysis, supports pagination to avoid performance issues with large data
  - Step-by-step execution can avoid loading large amounts of data at once, improving response speed

### Errors (Errors and Warnings)
- `errors list` → `listErrors()` → Get all errors and warnings
- `errors by-code --code <code>` → `getErrorsByCode()` → Filter by error code (e.g., E1001, E1004)
- `errors by-level --level <level>` → `getErrorsByLevel()` → Filter by level (error/warn/info)

### Rules (Rule Scanning)
- `rules list` → `listRules()` → Get rule scanning results (overlay alerts)

### Server (Server Information)
- `server port` → `getPort()` → Get the path to the currently used JSON file

### Output Optimization Recommendations (No server startup required, based only on rsdoctor-data.json)

When executing these commands, LLM should clearly know which function is being called:

- **Duplicate packages:** `packages duplicates` → Calls `detectDuplicatePackages()` function (internally calls getRuleInfo/E1001 to identify duplicate packages)
- **Similar packages:** `packages similar` → Calls `detectSimilarPackages()` function (checks for replaceable packages of the same type)
- **Media assets:** `assets media` → Calls `getMediaAssets()` function (suggests oversized media assets)
- **Large files:** `chunks large` → Calls `findLargeChunks()` function (finds oversized chunks based on median × 1.3 and >= 1MB)
- **Side effect modules:** `modules side-effects` → Calls `getSideEffects()` function
  
  **Key:** This function **must use `module.bailoutReason` data from `rsdoctor-data.json`** to analyze why tree-shaking failed.
  
  **How it works:**
  - Reads the `bailoutReason` field of each module from `moduleGraph.modules` in `rsdoctor-data.json`
  - Only returns modules with `bailoutReason` (i.e., modules that cannot be tree-shaken)
  - The `bailoutReason` field contains reasons why the module cannot be optimized, such as:
    - `"side effects"` - Module has side effects
    - `"dynamic import"` - Dynamic import
    - `"unknown exports"` - Unknown exports
    - `"re-export"` - Re-export
    - Other tree-shaking failure reasons
  
  **Return results include:**
  1. Side effect module statistics in node_modules, listing libraries with large side effects (like react, lodash-es, etc.) by package name, along with their size and module count
  2. Side effect module list in user code, including specific module paths, moduleId and **bailoutReason**, for targeted optimization
  
  **Note:** If `rsdoctor-data.json` does not have the `bailoutReason` field, it means tree-shaking analysis was not enabled during build, and you need to ensure the Rsdoctor plugin is correctly configured and rebuild.
  
  **Pagination parameters:**
  - `--page-number <pageNumber>`: Page number (default: 1)
  - `--page-size <pageSize>`: Page size (default: 100, max: 1000)
  
  Examples:
  ```bash
  # Default: return page 1, 100 items per page
  node scripts/rsdoctor.js modules side-effects --data-file ./dist/rsdoctor-data.json
  
  # Return page 2, 200 items per page
  node scripts/rsdoctor.js modules side-effects --page-number 2 --page-size 200 --data-file ./dist/rsdoctor-data.json
  ```
- **Summary view:** `bundle optimize` → Calls `optimizeBundle()` function (aggregates duplicate packages/similar packages/media assets/large chunks/side effect modules, equivalent to calling the above five types of checks sequentially)


## Response Format
1. Summary conclusion: One sentence summary.
2. Key findings: Present quantitative metrics (volume/time/count/path) with bullet points.
3. Priority action list: High/Med/Low, with specific operations (e.g., merge/split chunks, remove duplicate/similar packages, code splitting, convert images to WebP/AVIF and add width/height, etc.).
4. Data source description: List action/method and key identifiers (chunkId/moduleId/package name/path).
5. Data gaps: Explain reason and next steps (rerun build, check JSON file path, upgrade version, etc.).
- For Top-N, use table format "Name | Volume/Time | Count | Recommendation"; when output is large, suggest users use `--compact`. Can include one-line English summary for language switching.

**⚠️ Important: Only provide recommendations, do not automatically modify code**
- All optimization recommendations should be presented with wording like "recommend", "consider", "try"
- **Do not** automatically execute any code modifications (except `install` and `config` commands)
- **Do not** directly modify user's source code or configuration files (except configuration files allowed by `config` command)
- Let users decide whether to adopt recommendations and execute modifications

## Clarifications and Preferences
- When user says "package", prioritize package dimension; when path is incomplete, use fuzzy search first then use id for precise lookup.
- **Command execution method:** Use the new command format `<group> <subcommand>` (e.g., `modules side-effects`), not the old format `<group>:<subcommand>` (e.g., `modules:side-effects`).
- **BailoutReason check for side-effects and tree-shaking:**
  
  **Important:** The `modules side-effects` command (calls `getSideEffects()` function) **must use `bailoutReason` data from `rsdoctor-data.json`** to analyze which modules cannot be tree-shaken.
  
  **How it works:**
  - Reads the `bailoutReason` field of each module from `moduleGraph.modules` in `rsdoctor-data.json`
  - The `bailoutReason` field identifies why a module cannot be tree-shaken, common values include:
    - `"side effects"` - Module has side effects, cannot be safely removed
    - `"dynamic import"` - Dynamic import, cannot be statically analyzed
    - `"unknown exports"` - Unknown exports, cannot determine usage
    - `"re-export"` - Re-export, needs to be kept
    - Other tree-shaking failure reasons
  - Only returns modules with `bailoutReason` (i.e., modules that cannot be tree-shaken)
  
  **Return results categorized:**
  - **Side effect modules in node_modules:** Statistics by package name, listing libraries with large side effects (like react, lodash-es, etc.) and their total size and module count, helping identify which third-party libraries have large side effects
  - **Side effect modules in user code:** Lists specific module paths, moduleId and **bailoutReason**, for targeted optimization
  
  **Optimization recommendation examples:**
  - If `bailoutReason` is `"side effects"`: Check if there are top-level side effects (like initialization/global registration) that can be deferred or executed on demand
  - If `bailoutReason` is `"dynamic import"`: Consider whether static imports can be used, or use code splitting optimization
  - If `bailoutReason` is `"unknown exports"`: Check if exports are explicit, consider using named exports instead of default exports
  
  **Note:** If `rsdoctor-data.json` does not have the `bailoutReason` field, it means tree-shaking analysis was not enabled during build, and you need to ensure the Rsdoctor plugin is correctly configured and rebuild.

## Troubleshooting
- **JSON file error:** Check if the file path is correct, if the file exists and is readable, if the file format is valid JSON. Ensure `RSDOCTOR=true` environment variable was used during build.
- **File not found:** Confirm that build has generated `rsdoctor-data.json` file, usually in the output directory (e.g., `dist/`, `output/`, `static/`). Check if `--data-file` parameter path is correct. Can use `server port` command (calls `getPort()` function) to confirm the currently used file path.
- **Dependencies not installed:**
  - Check if legacy packages exist (`@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin`), if they exist then no installation needed
  - If neither exists, provide installation commands based on project type:
    - Rspack/Rsbuild/Modern Rspack projects: `pnpm add @rsdoctor/rspack-plugin -D`
    - Webpack/Modern Webpack projects: `pnpm add @rsdoctor/webpack-plugin -D`
- **Version not met:** Point out packages that need upgrading and target versions, provide overrides/alias suggestions. Minimum version requirements: `@rsdoctor/rspack-plugin >= 1.1.2`, `@rsdoctor/webpack-plugin >= 1.1.2`.
- **High latency warning:** `assets media` (calls `getMediaAssets()` function), `bundle optimize` (calls `optimizeBundle()` function) will fetch all chunks, can remind users to call step-by-step first or add `--compact`.
- **Missing parameters:** If `--data-file` parameter is missing, ensure JSON file path is provided when executing commands. All commands require `--data-file <path>` global parameter.
- **Command format error:** Ensure correct command format `<group> <subcommand>` (e.g., `chunks list`), not the old format `<group>:<subcommand>` (e.g., `chunks:list`).
