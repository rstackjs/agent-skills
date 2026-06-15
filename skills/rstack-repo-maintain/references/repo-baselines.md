<!-- cspell:words chenjiahan -->

# Rstack Repository Baselines

Snapshot date: 2026-06-15.

This reference is based on public GitHub PR and repository inspection for `chenjiahan` activity under `rstackjs/*`. Re-check current main branches before applying these patterns.

## Primary Baseline: rstackjs/rslog

Use `rslog` as the primary chenjiahan-maintained baseline when modernizing a small Rstack package.

Why it is the best first template:

- It has the strongest chenjiahan maintenance signal among inspected candidates: 50 authored PRs.
- It shows the full migration history from Rslib to pure ESM, Node 20+, Rslint, TypeScript 6, and CI cleanup.
- Its current package shape is simple enough to copy: `type: "module"`, explicit `exports`, `files: ["dist"]`, `build: "rslib"`, `lint: "rslint"`, `test: "rstest"`.
- Current `rslib.config.ts` is minimal: `lib: [{ syntax: "es2023", dts: true }]`.
- Current `package.json#engines.node` is `^20.19.0 || >=22.12.0`.

Useful PRs:

- [#23 chore(build): switch to Rslib](https://github.com/rstackjs/rslog/pull/23)
- [#33 chore: migrate to Rstest](https://github.com/rstackjs/rslog/pull/33)
- [#43 chore: remove unused @microsoft/api-extractor dependency](https://github.com/rstackjs/rslog/pull/43)
- [#59 feat!: transform to pure ESM package and requires Node 20+](https://github.com/rstackjs/rslog/pull/59)
- [#74 chore: add Rslint as linter](https://github.com/rstackjs/rslog/pull/74)
- [#76 chore: update TypeScript to v6 and adjust tsconfig settings](https://github.com/rstackjs/rslog/pull/76)
- [#77 chore: update tsconfig](https://github.com/rstackjs/rslog/pull/77)
- [#89 chore: optimize CI pnpm setup](https://github.com/rstackjs/rslog/pull/89)
- [#91 chore: upgrade rslint to 0.6.1](https://github.com/rstackjs/rslog/pull/91)

Known gaps:

- No `AGENTS.md` in current main at snapshot time.
- No Rslib `dts.tsgo` in current main at snapshot time.
- Rslint config uses TypeScript recommended rules only because the package is TypeScript-only.

## Secondary Baseline: rstackjs/rsbuild-plugin-publint

Use `rsbuild-plugin-publint` when a plugin package needs a compact pure ESM + Node 20 example.

Current traits:

- `type: "module"`.
- `exports["."].types` plus ESM default entry.
- `engines.node: ">=20.20.2"`.
- `@rslib/core`, `@rslint/core`, TypeScript 6, and Rstest.
- `rslib.config.ts` uses `syntax: "es2023"` and `dts: true`.

Useful PRs:

- [#32 chore: upgrade TypeScript to 6.0.2](https://github.com/rstackjs/rsbuild-plugin-publint/pull/32)
- [#40 chore: migrate linting to Rslint and Prettier](https://github.com/rstackjs/rsbuild-plugin-publint/pull/40)
- [#49 feat: pure ESM package](https://github.com/rstackjs/rsbuild-plugin-publint/pull/49)
- [#50 feat!: replace picocolors with styleText and requires Node 20](https://github.com/rstackjs/rsbuild-plugin-publint/pull/50)
- [#54 chore: optimize CI pnpm setup](https://github.com/rstackjs/rsbuild-plugin-publint/pull/54)
- [#56 chore: upgrade rslint to 0.6.1](https://github.com/rstackjs/rsbuild-plugin-publint/pull/56)

Known gaps:

- No `AGENTS.md` in current main at snapshot time.
- No Rslib `dts.tsgo` in current main at snapshot time.

## AGENTS Reference: rstackjs/rsbuild-plugin-arethetypeswrong

Use `rsbuild-plugin-arethetypeswrong` for a concise `AGENTS.md` and stricter package validation reference.

Current traits:

- `type: "module"`.
- `engines.node: ">=20.20.2"`.
- Rslib build, Rslint, TypeScript 6, and Rstest.
- `rslint.config.ts` enables both `js.configs.recommended` and `ts.configs.recommended`.
- Has `AGENTS.md` and README.
- Rslib config includes `rsbuild-plugin-publint` and bundled declarations.

Useful PRs:

- [#49 chore: switch to npm staged publishing](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong/pull/49)
- [#51 chore: build before stage publish](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong/pull/51)
- [#55 chore: optimize CI pnpm setup](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong/pull/55)
- [#58 chore: upgrade rslint to 0.6.1](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong/pull/58)

Known gaps:

- Rslib output syntax is `es2022`, not `es2023`, at snapshot time.
- No Rslib `dts.tsgo` in current main at snapshot time.

## High-Activity Reference: rstackjs/prebundle

Use `prebundle` as a high-activity reference when maintaining a CLI/build-tool style package with generated artifacts.

Current traits:

- 28 chenjiahan-authored PRs at snapshot time.
- Rslib build, Rslint, TypeScript 6, Rstest, README, and `AGENTS.md`.
- `rslint.config.ts` enables both `js.configs.recommended` and `ts.configs.recommended`.

Useful PRs:

- [#10 refactor: use Rslib to bundle](https://github.com/rstackjs/prebundle/pull/10)
- [#37 chore: enable npm trusted publishing](https://github.com/rstackjs/prebundle/pull/37)
- [#62 chore: upgrade TypeScript to ^6.0.2](https://github.com/rstackjs/prebundle/pull/62)
- [#72 chore: add Rslint linting](https://github.com/rstackjs/prebundle/pull/72)
- [#81 chore: optimize CI pnpm setup](https://github.com/rstackjs/prebundle/pull/81)
- [#83 chore: upgrade rslint to 0.6.1](https://github.com/rstackjs/prebundle/pull/83)

Known gaps:

- No `engines.node` in current main at snapshot time.
- Rslib syntax is `es2021`, so do not copy it for Node 20+/ES2023 packages without checking why.

## tsgo Reference: rstackjs/rsbuild-plugin-virtual-module

Use `rsbuild-plugin-virtual-module` only as a concrete Rslib `tsgo` configuration reference.

Current traits:

- `rslib.config.ts` uses `dts: { tsgo: true }`.
- `@typescript/native-preview` is installed.
- Dual package output is still present.

Relevant PR:

- [#28 chore: update infrastructure for tsgo](https://github.com/rstackjs/rsbuild-plugin-virtual-module/pull/28)

Important caveat:

- The tsgo PR was authored by `SoonIter`, not `chenjiahan`. Treat it as implementation evidence for Rslib tsgo, not as part of the chenjiahan-maintained baseline.

## Search Notes

Searches used:

- `type:pr org:rstackjs author:chenjiahan rslib`
- `type:pr org:rstackjs author:chenjiahan rslint`
- `type:pr org:rstackjs author:chenjiahan "typescript 6"`
- `type:pr org:rstackjs author:chenjiahan "Node 20"`
- `type:pr org:rstackjs author:chenjiahan AGENTS`
- `type:pr org:rstackjs author:chenjiahan README`
- `type:pr org:rstackjs author:chenjiahan "optimize CI"`
- `type:pr org:rstackjs author:chenjiahan knip`

Findings:

- No chenjiahan-authored `knip` PRs were found in the sampled search results.
- Rslib `dts.tsgo` is not yet a common chenjiahan-authored bulk-maintenance pattern.
- Some heavily maintained packages intentionally remain dual package or use lower output syntax; copy only after checking consumer compatibility.
