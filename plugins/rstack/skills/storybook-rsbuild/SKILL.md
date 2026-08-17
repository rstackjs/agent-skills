---
name: storybook-rsbuild
description: Set up or migrate Storybook to use the Rsbuild builder. Handles fresh setup for React, Vue 3, HTML, Web Components, and React Native Web, migration from webpack5 or Vite frameworks, and integrations with Rslib, Modern.js, and Rspack. Use when asked to add Storybook, migrate Storybook to Rsbuild, configure rsbuildFinal, or integrate Storybook with Rslib/Modern.js/Rspack.
compatibility: Requires network access to read upstream docs at storybook.rsbuild.rs
---

# Storybook Rsbuild

## Goal

Set up Storybook on Rsbuild, or migrate an existing Storybook to it. Factual mappings — version compatibility, package names, install commands, config conversion patterns — live in upstream docs at `storybook.rsbuild.rs`. This skill is an action router and a behavioral checklist; it does not duplicate the docs.

## Principles (must follow)

1. **Single source of truth is upstream.** Fetch the relevant `storybook.rsbuild.rs` page for version tables, install commands, and config conversion patterns. Do not infer version pins or package names from training memory — the ecosystem moves faster than the model's prior.

2. **Pin from the framework guide's Requirements table.** Each framework guide page (e.g. `https://storybook.rsbuild.rs/guide/framework/react`) carries a Requirements section listing the canonical compatible version ranges — that is the authoritative source for version pins. For fresh setups, install the latest stable `storybook` major and the matching `storybook-rsbuild` major. Do not pin from version numbers you see in code snippets elsewhere; only the docs are authoritative.

3. **Declare `@rsbuild/core` directly.** `storybook-<framework>-rsbuild` lists `@rsbuild/core` as a peer dependency, but you must still add `@rsbuild/core` to the project's own `devDependencies` so version pins and lockfile audits remain unambiguous and a future framework-package release that drops the peer cannot silently break the build.

4. **Migration is one task with two ordered phases — both required.** Phase A: install the new framework package and update config; leave the old framework package, old builder package, and old `webpackFinal` / `viteFinal` blocks in place so [Verification](#verification) has a rollback path. Phase B: as soon as Verification passes, in the same task, remove the old framework package (e.g. `@storybook/react-webpack5`, `@storybook/vue3-vite`), the old builder package (e.g. `@storybook/builder-webpack5`, `@storybook/builder-vite`), and the old `webpackFinal` / `viteFinal` block. A migration that ends with both builders' framework packages still in `package.json` is incomplete — leaving them is the most common silent regression in this skill's evals. Phase A on its own is not a valid stopping point; if you ran Verification, you must also run cleanup.

5. **Preserve addons; never silently drop.** When migrating, webpack-only addons (e.g. `@storybook/addon-styling-webpack`) must either be passed through `webpackAddons` (so upstream auto-translation handles them) or replaced with the equivalent Rsbuild-native pipeline (`@rsbuild/plugin-postcss`, `tools.postcss`, etc.). A migration that removes a styling addon and produces a passing `storybook build` but a visually broken story tree is still a regression.

6. **Operate in scope.** In monorepos, modify only the package that hosts stories. Do not edit business source files unless the migration strictly requires it.

## Step 1 — Detect scenario

Read `package.json` and project structure to determine existing Storybook state:

1. Check for `.storybook/` directory (in monorepos, check both root and per-package)
2. Check `package.json` for `storybook` scripts or `@storybook/*` / `storybook-*-rsbuild` in dependencies or devDependencies
3. If Storybook exists **and already uses `storybook-*-rsbuild`** → already set up; go to [Configuration](#configuration) or [Troubleshooting](#troubleshooting) as needed
4. If Storybook exists **with a non-Rsbuild builder** (`@storybook/*-webpack5`, `@storybook/*-vite`, etc.) → go to [Migration Workflow](#migration-workflow)
5. **No Storybook found** → go to [Fresh Setup Workflow](#fresh-setup-workflow)

---

## Fresh Setup Workflow

### 1. Detect ecosystem integration

Read `package.json` dependencies and devDependencies, check in order:

| Signal                                 | Ecosystem   | Integration guide                                        |
| -------------------------------------- | ----------- | -------------------------------------------------------- |
| `@rslib/core`                          | Rslib       | https://storybook.rsbuild.rs/guide/integrations/rslib    |
| `@modern-js/app-tools`                 | Modern.js   | https://storybook.rsbuild.rs/guide/integrations/modernjs |
| `@rspack/core` without `@rsbuild/core` | Pure Rspack | https://storybook.rsbuild.rs/guide/integrations/rspack   |

If matched, read the integration guide and **apply its constraints as an overlay** alongside the steps below.

### 2. Detect UI framework

Infer the UI framework from app dependencies (`react`, `vue`, `lit`, etc.):

| UI Framework     | Framework package                    | Guide                                                         |
| ---------------- | ------------------------------------ | ------------------------------------------------------------- |
| React            | `storybook-react-rsbuild`            | https://storybook.rsbuild.rs/guide/framework/react            |
| Vue 3            | `storybook-vue3-rsbuild`             | https://storybook.rsbuild.rs/guide/framework/vue              |
| Vanilla JS/TS    | `storybook-html-rsbuild`             | https://storybook.rsbuild.rs/guide/framework/vanilla          |
| Web Components   | `storybook-web-components-rsbuild`   | https://storybook.rsbuild.rs/guide/framework/web-components   |
| React Native Web | `storybook-react-native-web-rsbuild` | https://storybook.rsbuild.rs/guide/framework/react-native-web |

### 3. Set up Storybook

1. In monorepos, operate in the package that will host stories
2. Read and follow the framework guide matched above; install the **latest stable** `storybook` major and the matching `storybook-<framework>-rsbuild` major (Principle 2)
3. Add `@rsbuild/core` to `devDependencies` directly, alongside `storybook-<framework>-rsbuild` (Principle 3)
4. Ensure `.storybook/main.*` uses the correct `framework: '<storybook-*-rsbuild>'`
5. Ensure `package.json` has `storybook dev` and `storybook build` scripts
6. If no story file exists yet, scaffold at least one minimal example story (e.g. `src/stories/Example.stories.*`) so [Verification](#verification) step 2 has something to render
7. Run [Verification](#verification) below

## Migration Workflow

Read the upstream migration guide: https://storybook.rsbuild.rs/guide/migration

Follow these steps **in order**:

1. **Detect migration type** — read `.storybook/main.*` (`framework` field and/or `core.builder`) and `package.json` dependencies to classify as "from webpack5" or "from Vite", then select the matching section in the migration guide
2. **Resolve version compatibility** — read the "Version compatibility" section in the migration guide, select the correct `storybook-rsbuild` major based on installed Storybook version
3. **Replace packages** — apply the install/remove mapping from the migration guide using the project's package manager (detect from lockfile); only change packages required by the migration. Always add `@rsbuild/core` as a direct devDep alongside the new framework package (Principle 3). Do not remove the old framework package or old devDeps yet — that happens after Verification (Principle 4)
4. **Update `.storybook/main.*`** — apply the config changes exactly as shown in the migration guide for the detected framework
5. **Migrate custom builder hooks** — search for legacy builder hooks (`webpackFinal` / `viteFinal`); if found, convert following the upstream configuration guide (https://storybook.rsbuild.rs/guide/configuration)
6. **Handle addon compatibility** — keep addons unchanged initially. If a webpack-only addon must change, route it through `webpackAddons` for upstream auto-translation, or replace it with the Rsbuild-native equivalent — never silently drop it (Principle 5). Consult the migration guide's addon section for the recommended fix
7. **Verify, then clean up — both required** — run [Verification](#verification) below; once it passes, in the same task complete all of the following before reporting done (Principle 4):
   - Remove the old framework package from `package.json` devDependencies (e.g. `@storybook/react-webpack5`, `@storybook/vue3-webpack5`, `@storybook/react-vite`, `@storybook/vue3-vite`, `@storybook/html-webpack5`, `@storybook/web-components-webpack5`, etc.)
   - Remove the old builder package if separately listed (e.g. `@storybook/builder-webpack5`, `@storybook/builder-vite`)
   - Delete the legacy `webpackFinal` / `viteFinal` block from `.storybook/main.*`
   - Drop any old-builder-only devDeps that no longer have consumers
   - Re-run `pnpm install` (or the project's package manager equivalent) so the lockfile reflects the cleanup

If a factual mapping is needed (version table, package names, conversion patterns) and not present in this skill, fetch it from the upstream docs — do not guess.

---

## Verification

1. `storybook dev` starts without errors
2. At least one story renders correctly in the browser (a clean dev-server boot is not sufficient — a missing-glob in `stories` or a broken framework wiring will only surface here)
3. HMR works
4. `storybook build` completes
5. Check startup logs to confirm the Rsbuild builder is active (not webpack/vite)

## Troubleshooting

- **Cache issues**: remove `node_modules/.cache/storybook` and retry
- **Residual config**: if dev fails after migration, temporarily remove custom `rsbuildFinal` block to isolate the issue, then re-add incrementally
- For debugging and other issues, consult the upstream migration guide's "Debugging" section and https://storybook.rsbuild.rs/guide/configuration

## Edge Cases

- **Monorepo**: locate the package that hosts stories; operate there, not at root
- **Multiple `.storybook/` dirs**: pick the one referenced by `package.json` scripts
- **TS path aliases**: ensure aliases are preserved after migration; consult the upstream configuration guide for how to configure `rsbuildFinal`

## Configuration

For `rsbuildFinal`, builder options, TypeScript, and framework-specific options → read https://storybook.rsbuild.rs/guide/configuration
