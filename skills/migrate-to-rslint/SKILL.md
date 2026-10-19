---
name: migrate-to-rslint
description: Migrate ESLint flat config or Oxlint to Rslint, preserving rule options, file scopes, and plugins while updating lint scripts, editor settings, and inline directives.
---

<!-- cspell:words Rslint rslint -->

# Migrate to Rslint

## Goal

Migrate lint tooling to Rslint with minimal behavior changes and clear validation.

## Supported source linters

- ESLint flat config
- Oxlint

## Migration principles (must follow)

1. **Official docs first**: use Rslint docs for CLI, config, inline directives, VS Code settings, rules, and presets. Check capabilities against the installed version; historical migration gaps and workarounds are not permanent limitations.
2. **Smallest-change-first**: migrate package, command, config, and editor wiring before changing source files.
3. **Preserve lint intent**: keep supported rule severities/options where Rslint supports them; call out unsupported rules/plugins instead of silently dropping behavior.
4. **Preserve inline suppression intent**: preserve which directives take effect, their rule targets, and their scope. Keep compatible prefixes unless the user requests renaming; translate source-only syntax and account for disabled directive compatibility in the source-specific guide.
5. **Validate before cleanup**: switch lint entry points to Rslint and validate the migrated scope before removing obsolete source-linter artifacts. Report unsupported-rule coverage differences without treating them as a blocker or requiring separate approval.

## Workflow

1. **Detect source linter**
   - ESLint flat config: `eslint.config.*`, `eslint` dependency, or package scripts that run `eslint`.
   - Oxlint: `.oxlintrc.json`, `.oxlintrc.jsonc`, `oxlint.config.*`, `oxlint` dependency, or commands that run `oxlint`.
   - Record installed versions, commands, working directories, environment switches, and the scope being migrated. Include shared configs, nested configs, and root fallback behavior within that scope.
   - If the source linter is not covered by a reference yet, inventory the current behavior and explain that no dedicated migration reference exists.

2. **Prepare Rslint and apply the source-specific guide**
   - Select and install the intended `@rslint/core` version with the repository's package manager before checking its rules, config, and plugin APIs. Respect existing version constraints and retain the source linter for validation.
   - ESLint flat config: [references/eslint-flat-config.md](references/eslint-flat-config.md)
   - Oxlint: [references/oxlint.md](references/oxlint.md)
   - For community or local JS plugins from either source, also read [references/eslint-plugins.md](references/eslint-plugins.md).

3. **Update lint entry points**
   - Use a supported `rslint.config.*` format. Keep source plugin dependencies required by the translated config.
   - Update package scripts, CI, hooks, and staged-file commands in the migrated scope. Use the [Rslint CLI reference](https://rslint.rs/guide/cli) to translate flags while preserving working directories, file arguments, warning thresholds, and environment switches.
   - Update existing editor integration using the [Rslint VS Code guide](https://rslint.rs/guide/vscode-extension). Keep unrelated editor tools and settings.

4. **Validate behavior**
   - Run the migrated lint command.
   - Check effective rules/options, file coverage, suppressions, and plugin execution against the source inventory. A successful exit alone does not establish equivalent behavior.
   - For enabled source rules without a validated native or compatible JS-plugin replacement, omit unsupported target keys and record the rule names, affected file scope, and lost coverage for the final report. Continue the migration with the supported rules.
   - If the project had a fix command, run the migrated fix command only when appropriate for the task.
   - Resolve target config-loading errors, invalid options for supported rules, command failures, and editor-integration errors before cleanup.

5. **Cleanup and summarize**
   - Confirm all lint entry points in the migrated scope use Rslint, then remove obsolete source-linter commands, configuration, and dependencies after validation.
   - Summarize the completed switchover and validation, naming any omitted rules/plugins, affected scopes, and coverage or behavior changes.
