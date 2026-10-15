---
name: rsdoctor-migrate-v2
description: Upgrade Rspack projects from Rsdoctor 1.x to 2.0. Use when replacing legacy Rsdoctor packages, converting Rsdoctor setup to ESM, updating removed or deprecated options, moving MCP workflows to Agent CLI, or validating Node.js and Rspack compatibility for an Rsdoctor 2.0 upgrade.
---

# Upgrade Rsdoctor to v2

Upgrade with the smallest behavior-preserving diff. Treat the official migration guides and the installed package exports as the source of truth:

- https://rsdoctor.rs/guide/start/migration-v2
- https://rsdoctor.rs/config/options/options-v2

## Workflow

1. **Audit the current integration**
   - Read `package.json`, the lockfile, Node.js version files, and the build scripts.
   - Determine the installed Rsdoctor package versions from the lockfile or package metadata, and check which package provides the active `RsdoctorRspackPlugin`. Migrate a 1.x `@rsdoctor/rspack-plugin` integration, including any partially migrated setup that still imports it. If `@rsdoctor/core` 2.x already provides the active plugin, validate the integration instead of migrating it again. `@rsdoctor/core` alone does not prove a 2.x integration because 1.x projects may use it for custom rules. Distinguish direct integration from framework-owned transitive 1.x dependencies.
   - Locate Rspack, Rsbuild, and Rsdoctor configuration files. Preserve any environment condition that enables Rsdoctor only for selected builds.
   - Search source, scripts, and editor configuration for `@rsdoctor/`, `RsdoctorRspackPlugin`, legacy options, MCP setup, and report-output assumptions.
   - Record the current build command and expected report formats before editing.

2. **Pass the compatibility gate**
   - Require Node.js `^20.19.0 || >=22.12.0` and verify that the installed Rspack version satisfies the selected `@rsdoctor/core` peer dependency. Check the selected package's `engines` and peer dependencies if they differ.
   - For webpack projects, stop the Rsdoctor upgrade. Keep Rsdoctor 1.x or migrate the project to Rspack as a separate task first.
   - Update only Rsdoctor dependencies and preserve the existing Rspack and framework versions. If a framework supplies Rspack, do not add `@rspack/core` directly. Report a compatibility issue separately only when the installed version does not satisfy Rsdoctor's peer dependency.

3. **Plan only applicable changes**
   - Read [references/migration-map.md](references/migration-map.md).
   - List the package, import, module-format, configuration, and AI-workflow changes that apply to this project.
   - Choose one Rsdoctor 2.x target version. Keep `@rsdoctor/core` and `@rsdoctor/cli` on the same version; version `@rsdoctor/agent-cli` independently.

4. **Migrate packages and imports**
   - Replace `@rsdoctor/rspack-plugin` with `@rsdoctor/core` and import `RsdoctorRspackPlugin` from `@rsdoctor/core`.
   - Convert Rsdoctor `require()` calls to ESM imports. When the project remains CommonJS, move only the affected build config to a supported ESM extension such as `.mjs` instead of changing the entire package module type without need.
   - Do not mechanically rename imports from removed low-level packages. Resolve every imported symbol against the public 2.x exports, then type-check it.
   - Use the project's existing package manager and avoid unrelated dependency or lockfile updates.
   - Do not remove framework-owned transitive 1.x dependencies merely because they remain in the lockfile; verify whether the framework still activates its old plugin.

5. **Migrate configuration without changing report intent**
   - Replace each removed or deprecated field using the mapping reference.
   - Preserve whether the project needs HTML, JSON, or both, and preserve intentional code-source omission from lite reports.
   - Delete `experiments.enableNativePlugin` and `supports.banner`; both options were removed in 2.0, and the Rspack native plugin is always enabled.
   - If Rspack reports that `experiments.RsdoctorPlugin` is unavailable, report the compatibility issue instead of changing Rspack or framework dependencies as part of the Rsdoctor upgrade.

6. **Migrate AI workflows when present**
   - Remove `@rsdoctor/mcp-server`, its editor MCP entries, and scripts that start it.
   - Add `@rsdoctor/agent-cli`, generate a fresh `rsdoctor-data.json`, and invoke `rsdoctor-agent` against that file.
   - Rewrite automation to consume structured CLI output. Agent CLI is not an MCP-compatible or drop-in API replacement. Do not carry over MCP ports or assume its compiler-selection syntax applies; for multi-compiler data, select a compiler using Agent CLI's `--compiler <name>`.

7. **Validate the migration**
   - Reinstall dependencies and run the production build under the project's supported Node.js version.
   - Confirm the expected Rsdoctor report is generated and open the overview, compilation, and bundle-analysis pages used by the project.
   - If JSON output or Agent CLI is used, validate a newly generated data file with one representative command.
   - Run the relevant tests and type checks, then search again for removed packages and legacy options.
   - Report what changed, commands run, and any validation that could not be completed. Do not claim success from dependency installation alone.

## Output language

- Write all user-facing explanations, plans, progress updates, and migration summaries in Chinese.
- Keep package names, API names, configuration fields, commands, file paths, and error messages in their original form; explain their meaning in Chinese when needed.

## Guardrails

- Do not install Rsdoctor 2.x into a webpack-only project.
- Do not activate 1.x and 2.x plugins together to work around migration errors. Investigate framework-owned transitive 1.x packages separately.
- Do not silently change report formats, filenames, server ports, or source-code visibility.
- Do not replace MCP configuration with an invented Agent CLI service configuration.
- Do not remove compatibility code until the replacement build and report have been verified.
