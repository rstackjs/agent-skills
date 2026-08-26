---
name: rsdoctor-migrate-v2
description: Migrate Rspack projects from Rsdoctor 1.x to 2.0. Use when replacing legacy Rsdoctor packages, converting Rsdoctor setup to ESM, updating removed or deprecated options, moving MCP workflows to Agent CLI, or validating Node.js and Rspack compatibility for an Rsdoctor 2.0 upgrade.
---

# Migrate Rsdoctor to v2

Upgrade with the smallest behavior-preserving diff. Treat the official migration guides and the installed package exports as the source of truth:

- https://rsdoctor.rs/guide/start/migration-v2
- https://rsdoctor.rs/config/options/options-v2

## Workflow

1. **Audit the current integration**
   - Read `package.json`, the lockfile, Node.js version files, and the build scripts.
   - Locate Rspack, Rsbuild, and Rsdoctor configuration files. Preserve any environment condition that enables Rsdoctor only for selected builds.
   - Search source, scripts, and editor configuration for `@rsdoctor/`, `RsdoctorRspackPlugin`, legacy options, MCP setup, and report-output assumptions.
   - Record the current build command and expected report formats before editing.

2. **Pass the compatibility gate**
   - Require Node.js 22.18 or later and Rspack 2.0 or later.
   - For webpack projects, stop the Rsdoctor upgrade. Keep Rsdoctor 1.x or migrate the project to Rspack as a separate task first.
   - If a framework supplies Rspack, upgrade that framework or its Rspack integration. Add `@rspack/core` directly only when the project uses Rspack directly.

3. **Plan only applicable changes**
   - Read [references/migration-map.md](references/migration-map.md).
   - List the package, import, module-format, configuration, and AI-workflow changes that apply to this project.
   - Choose one Rsdoctor 2.x target version. Keep `@rsdoctor/core` and `@rsdoctor/cli` on the same version; version `@rsdoctor/agent-cli` independently.

4. **Migrate packages and imports**
   - Replace `@rsdoctor/rspack-plugin` with `@rsdoctor/core` and import `RsdoctorRspackPlugin` from `@rsdoctor/core`.
   - Convert Rsdoctor `require()` calls to ESM imports. When the project remains CommonJS, move only the affected build config to a supported ESM extension such as `.mjs` instead of changing the entire package module type without need.
   - Do not mechanically rename imports from removed low-level packages. Resolve every imported symbol against the public 2.x exports, then type-check it.
   - Use the project's existing package manager and avoid unrelated dependency or lockfile updates.

5. **Migrate configuration without changing report intent**
   - Replace each removed or deprecated field using the mapping reference.
   - Preserve whether the project needs HTML, JSON, or both, and preserve intentional code-source omission from lite reports.
   - Delete `experiments.enableNativePlugin`; the Rspack native plugin is always enabled in 2.0.
   - If Rspack reports that `experiments.RsdoctorPlugin` is unavailable, upgrade the Rspack version supplied by the project or framework rather than restoring the removed fallback.

6. **Migrate AI workflows when present**
   - Remove `@rsdoctor/mcp-server`, its editor MCP entries, and scripts that start it.
   - Add `@rsdoctor/agent-cli`, generate a fresh `rsdoctor-data.json`, and invoke `rsdoctor-agent` against that file.
   - Rewrite automation to consume structured CLI output. Agent CLI is not an MCP-compatible or drop-in API replacement; do not translate MCP ports or compiler-selection options.

7. **Validate the migration**
   - Reinstall dependencies and run the production build under the project's supported Node.js version.
   - Confirm the expected Rsdoctor report is generated and open the overview, compilation, and bundle-analysis pages used by the project.
   - If JSON output or Agent CLI is used, validate a newly generated data file with one representative command.
   - Run the relevant tests and type checks, then search again for removed packages and legacy options.
   - Report what changed, commands run, and any validation that could not be completed. Do not claim success from dependency installation alone.

## Guardrails

- Do not install Rsdoctor 2.x into a webpack-only project.
- Do not mix 1.x and 2.x packages to work around migration errors.
- Do not silently change report formats, filenames, server ports, or source-code visibility.
- Do not replace MCP configuration with an invented Agent CLI service configuration.
- Do not remove compatibility code until the replacement build and report have been verified.
