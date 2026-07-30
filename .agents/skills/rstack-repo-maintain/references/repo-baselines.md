# Rstack Repository Baselines

<!-- cspell:words oxfmt -->

Snapshot date: 2026-07-29.

Verified commits:

- `web-infra-dev/rsbuild@71d127b76dde529c9934b6266a52da6333c4e824`
- `rstackjs/rslog@eeba57ccc46f034ef46570256d25647a3a00171f`
- `rstackjs/rsbuild-plugin-publint@005d3f57632f3b94861e963adc7d4d36af297fc1`
- `rstackjs/rsbuild-plugin-arethetypeswrong@11e8ba47a1cd1489570d4133b01414767cd1c137`
- `rstackjs/prebundle@e969770de48cb3a35de18eedde2e6adcf92787e6`
- `rstackjs/rsbuild-plugin-virtual-module@b6249012dad0e02515c12ce4e0f17cd3201f60d9`

This reference records public main-branch state, not universal recommendations or latest-package claims. Re-check the target and chosen exemplar before editing. Do not mix versions from different columns without validating the resulting toolchain and lockfile.

## Version Snapshot

| Area               | Rsbuild monorepo         | Standalone `rslog` package      |
| ------------------ | ------------------------ | ------------------------------- |
| Node engine        | `>=22.18.0`              | Node `20.19.x` or `>=22.12.0`   |
| CI Node            | `24.18.0`                | `24.18.0`                       |
| pnpm               | `11.15.0`                | `11.11.0`                       |
| TypeScript         | `^6.0.3`                 | `^7.0.2`                        |
| Integrated tooling | `rstack@^0.2.0`          | Not used                        |
| Build              | Rstack CLI over Rslib    | `@rslib/core@^0.23.2`           |
| Lint               | `rs lint --type-check`   | `@rslint/core@^0.6.5`           |
| Test               | Rstack CLI over Rstest   | `@rstest/core@^0.11.1`          |
| Format             | `oxfmt@^0.60.0`          | `prettier@^3.9.5`               |
| Package validation | Per-package build config | `rsbuild-plugin-publint@^1.0.0` |

Current workflow pins shared by Rsbuild and the sampled standalone packages:

- `actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e` (`v6.4.0`).
- `pnpm/action-setup@0ebf47130e4866e96fce0953f49152a61190b271` (`v6.0.9`).
- Rsbuild uses `actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0` (`v7.0.0`); `rslog` still uses `df4cb1c069e1874edd31b4311f1884172cec0e10` (`v6`).

Refresh action pins from the selected live baseline. Preserve the version comment next to each immutable commit hash.

## Baseline Lanes

### Rsbuild: Integrated Monorepo Lane

Use `web-infra-dev/rsbuild` when the target is a substantial monorepo that benefits from shared configuration and the Rstack CLI.

Current traits:

- Root scripts use `rs setup`, `rs lint --type-check`, and Rstack-backed build/test commands.
- Package `rstack.config.ts` files use `define.lib`; shared types/config come from `rstack/lib` and `rstack/test`.
- The migration removed direct Rslib configs and redundant Rstest adapter dependencies while preserving generated artifacts.
- `oxfmt` is a separate format and format-check step; heading and spelling checks remain separate.
- Root `packageManager` is `pnpm@11.15.0`, with Node `>=22.18.0` and pnpm `>=11.0.0`.
- `pnpm-workspace.yaml` centralizes versions in a catalog and enables `catalogMode: prefer`, unused-catalog cleanup, explicit peer policy, an empty hoist pattern, a one-day minimum release age with trusted-project exclusions, build-script allowlisting, and strict dependency builds.
- Test, lint, preview, and release workflows use Node `24.18.0`, disable setup-node package-manager caching, and delegate install to `pnpm/action-setup` with `run_install: true`.
- Test CI builds before unit/e2e tests. Release CI builds before recursive `pnpm stage publish` and grants only the permissions it needs.
- Root `AGENTS.md` stays concise: Stack, Commands, Testing, Project structure, Skills, and Code style.

Useful migration evidence:

- [#8164 chore: migrate Rslint to Rstack CLI](https://github.com/web-infra-dev/rsbuild/pull/8164)
- [#8166 chore: migrate Rstest to Rstack CLI](https://github.com/web-infra-dev/rsbuild/pull/8166)
- [#8170 chore: migrate Rslib to Rstack CLI](https://github.com/web-infra-dev/rsbuild/pull/8170)
- [#8195 chore: migrate nano-staged to Rstack CLI](https://github.com/web-infra-dev/rsbuild/pull/8195)
- [#8197 chore: migrate Git hooks to Rstack CLI](https://github.com/web-infra-dev/rsbuild/pull/8197)

Do not copy this lane wholesale into a small package:

- `rstack` is valuable when it consolidates real duplication; it is not required for every RstackJS repository.
- Node `>=22.18.0`, a multi-OS test matrix, catalog policy, and strict build-script policy reflect Rsbuild's own constraints.
- Supply-chain settings can break installs when native or postinstall dependencies are not modeled. Add them one at a time and verify clean/frozen installs.
- Keep formatter replacement and toolchain consolidation as explicit migration scopes.

### rslog: Standalone Small-Package Lane

Use `rstackjs/rslog` as the primary baseline for focused packages that remain clearer with standalone Rslib, Rslint, and Rstest.

Current traits:

- Pure ESM with `type: "module"`, explicit `exports["."].types` and default entry, `types`, and `files: ["dist"]`.
- Rslib uses `syntax: "es2023"`, `dts: true`, and `pluginPublint()`.
- Rslint uses only `ts.configs.recommended` and ignores generated `dist`.
- Rstest enables globals; TypeScript uses NodeNext module/resolution and `target: "ES2023"`.
- Lint combines Rslint and Prettier. Test CI intentionally runs lint and tests without adding a redundant build step; release CI builds before `pnpm stage publish`.
- Workflows use immutable action pins, setup-node with `package-manager-cache: false`, and pnpm action `run_install: true`.
- Release uses npm trusted publishing with `contents: read` and `id-token: write`.

TypeScript 7 changed the old tsgo baseline:

- Rslib's current [declaration guide](https://rslib.rs/guide/advanced/dts) and [`lib.dts` reference](https://rslib.rs/config/lib/dts) state that Rslib automatically uses tsgo when the installed TypeScript version is 7 or later. Direct `@typescript/native-preview` plus manual tsgo selection is deprecated compatibility wiring, not the current baseline.
- [#97](https://github.com/rstackjs/rslog/pull/97) upgraded to `typescript@^7.0.2`.
- [#98](https://github.com/rstackjs/rslog/pull/98) removed direct `@typescript/native-preview`, removed manual tsgo selection, upgraded Rslib, and retained `dts: true`.
- Rsbuild's [#8162](https://github.com/web-infra-dev/rsbuild/pull/8162) separately recommends TypeScript 7 or later for faster plugin type checking, while the Rsbuild repository catalog itself still uses TypeScript 6 in this snapshot.

Therefore:

- Do not state that every repository should upgrade to one TypeScript major.
- Do not add `@typescript/native-preview` or manual tsgo selection as a current default.
- For TypeScript 7, remove the old preview-specific wiring and validate declaration output.
- For TypeScript 6, keep the existing declaration implementation unless there is repo-specific evidence to change it.

The current `rslog/AGENTS.md` still says its build uses “tsgo declarations,” which no longer matches `rslib.config.ts`. Treat this as evidence that documentation must be checked against live config, not copied verbatim.

### Rslib v1 Prerelease Upgrade

When the target version is `@rslib/core@1.0.0-beta` or another v1 prerelease, use the official [Rslib v0-to-v1 upgrade guide](https://v1.rslib.rs/zh/guide/upgrade/v0-to-v1) as the migration checklist. Treat the change from 0.23 to v1 as a deliberate compatibility migration:

- Upgrade or verify Rsbuild plugins against Rsbuild v2 peer requirements; if the project uses Rsbuild config or JavaScript APIs directly, also follow the Rsbuild v1-to-v2 guide linked there.
- Re-evaluate inferred Node syntax targets and the changed `es2023` and `es2024` baselines.
- Test ESM externals that originate from CommonJS `require()` because the default `externalsType` changes to `modern-module`.
- Remove preview-specific TypeScript wiring unless it is intentionally retained through the new explicit TypeScript path option; TypeScript 7+ is detected from the project root and enables tsgo automatically.
- Check the default declaration import-extension rewriting before accepting the new `redirect.dts.extension` behavior.
- Migrate deprecated `lib.autoExternal` to `output.autoExternal` and remove `experiments.advancedEsm`.

Do not recommend the beta solely because its version is newer than npm `latest`. Record why the target accepts prerelease risk, update the lockfile, and validate built declarations, ESM/CJS loading, external dependencies, and package contents.

Useful history:

- [#59 feat!: transform to pure ESM package and requires Node 20+](https://github.com/rstackjs/rslog/pull/59)
- [#74 chore: add Rslint as linter](https://github.com/rstackjs/rslog/pull/74)
- [#89 chore: optimize CI pnpm setup](https://github.com/rstackjs/rslog/pull/89)
- [#93 chore(infra): enable tsgo, publint, and prettier checks](https://github.com/rstackjs/rslog/pull/93) — historical TypeScript 6 state, superseded for tsgo by #98.

## Specialized References

### rsbuild-plugin-publint: Pure ESM Plugin

Use this repository when a plugin needs a compact pure ESM and Node 20-compatible shape.

- Node engine: `^20.19.0 || >=22.12.0`.
- TypeScript `7.0.2`, Rslib `^0.23.2`, Rslint `^0.6.5`, Rstest `^0.11.1`, and pnpm `11.13.0`.
- Rslib uses `syntax: "es2023"` and `dts: true`.
- Rslint enables only the TypeScript recommended config.
- Peer range supports Rsbuild 1 and 2 and marks the peer optional.

Use `rslog`, not this repository, for the publint-build-plugin example.

### rsbuild-plugin-arethetypeswrong: Bundled Declaration Validation

Use this repository for bundled declarations and package-validation behavior, not as a universal formatter or syntax template.

- Pure ESM with `dts: { bundle: true }`, `rsbuild-plugin-publint`, and `@microsoft/api-extractor`.
- TypeScript `^7.0.2`, Rslib `^0.23.1`, Rslint `^0.6.4`, and pnpm `11.9.0`.
- Intentionally uses ES2022, Node16/Node18 module settings, both JavaScript and TypeScript Rslint recommendations, dprint, Husky, and nano-staged.
- Node engine is `>=20.20.2`.

These differences are compatibility choices, not drift to normalize automatically.

### prebundle: Generated-Artifact CLI

Use this repository when the target has checked-in generated artifacts or a CLI bin.

- TypeScript `^6.0.3`, Rslib `0.23.2`, Rslint `^0.6.5`, Rstest `^0.11.1`, and pnpm `11.13.0`.
- Rslib intentionally emits ES2021 and excludes `compiled` dependencies from bundling.
- Rslint ignores generated `compiled` content and enables JavaScript plus TypeScript recommended configs.
- `compiled` and `bin.js` are publish inputs, so package validation must cover more than `dist`.

### rsbuild-plugin-virtual-module: Dual-Package Compatibility

Use this repository only when CommonJS consumers require dual output.

- Exports ESM and CJS entries from one package.
- Rslib emits ES2021 ESM plus a CJS build with declarations on the primary build.
- TypeScript `7.0.2`, Rslib `^0.23.2`, Rslint `^0.6.1`, Rstest `^0.11.1`, and pnpm `11.5.0`.
- Current main no longer uses `dts.tsgo` or `@typescript/native-preview`; older PR #28 is historical implementation evidence, not the current baseline.

## Selection Rules

1. Match repository shape before version freshness: monorepo, focused library, plugin, CLI, generated-artifact package, or compatibility package.
2. Preserve public output and runtime support unless the user explicitly accepts a breaking change.
3. Use one exemplar as the primary lane and specialized repositories only for the feature they demonstrate.
4. Treat exact versions as a coherent snapshot. Refresh the chosen baseline's manifest, lockfile, workflow pins, and engine fields together.
5. Prefer package-native validation: focused tests, build artifacts, import/require smoke tests, `pnpm pack --dry-run` for supported pnpm versions, publint, and release command inspection.

## Live Refresh Checklist

Before presenting or applying the baseline:

1. Resolve the exemplar's default branch and current commit.
2. Read `package.json`, package-manager workspace config, lockfile header, Node version files, tool configs, hooks, and workflows from that commit.
3. Compare recent merged infrastructure PRs with current files; current files win when documentation or old PR text disagrees.
4. Check whether versions are direct, cataloged, aliased, peer-only, or inherited through `rstack`.
5. Record deliberate deviations and validate them instead of silently combining incompatible patterns.
