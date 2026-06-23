# Dependency Install Gate

Use this reference when running the dependency install gate step of the migration workflow.

## Quick path

Run install with `ni` and trust its workspace/package-manager detection:

```bash
npx -y @antfu/ni install
```

Then verify Rstest is resolvable from local dependencies without falling back to remote package execution:

```bash
pnpm exec rstest -h
```

For npm-only repos, use `npm exec --no -- rstest -h` only after `@rstest/core` is installed locally, or run `./node_modules/.bin/rstest -h` directly.

If a package manager script already exists after the script migration, also prefer the repo-native script (for example `pnpm test -- --help` only when that is how the repo runs tests).

## Dependency decisions

Install only packages the migrated scope needs:

- Always add `@rstest/core` as a dev dependency for a migrated scope.
- If coverage is enabled, add the matching provider package:
  - `coverage.provider: 'istanbul'` -> `@rstest/coverage-istanbul`
  - `coverage.provider: 'v8'` -> `@rstest/coverage-v8`
- If migrating a project that already has `rslib.config.*`, prefer `@rstest/adapter-rslib`.
- If migrating a project that already has `rsbuild.config.*`, prefer `@rstest/adapter-rsbuild`.
- Keep Jest/Vitest packages until the migrated scope is green. Remove them only in the cleanup phase and only if no other scope still uses them.

Do not add both old and new coverage providers for the same scope unless mixed-mode scopes still require both.

## Rsbuild/Rspack version compatibility gate

Before debugging test failures, check whether the Rstest target version matches the installed Rstack toolchain:

- Latest Rstest uses the Rsbuild/Rspack 2.x ecosystem.
- Rstest 0.8.x uses the Rsbuild/Rspack 1.x ecosystem.
- `@rsbuild/plugin-*` packages must satisfy the installed `@rsbuild/core` peer range. Do not force major equality for plugins whose published peer range intentionally spans majors.
- Choose adapters such as `@rstest/adapter-rsbuild`, `@rstest/adapter-rslib`, and `@rstest/adapter-rspack` by peer compatibility with `@rstest/core` and the underlying Rsbuild/Rslib/Rspack version. Rstest 0.8.x migrations may need older adapter package versions whose package major does not match `@rstest/core`.
- In monorepos, check root and package-level `overrides`, `resolutions`, `pnpm.overrides`, lockfile entries, and nested package managers for duplicate major versions.

Use the repo-native package manager for inspection. Examples:

```bash
pnpm why @rstest/core @rsbuild/core @rspack/core @rslib/core
pnpm why @rstest/adapter-rsbuild @rstest/adapter-rslib @rstest/adapter-rspack
pnpm ls --depth Infinity | rg '@rsbuild/plugin-'
```

For npm-only repos, use `npm ls` instead:

```bash
npm ls @rstest/core @rsbuild/core @rspack/core @rslib/core 2>/dev/null || true
npm ls --all 2>/dev/null | grep '@rsbuild/plugin-' || true
```

If errors mention Rsbuild/Rspack config schema, plugin hooks, compiler instance mismatch, missing plugin APIs, or peer dependency conflicts, fix dependency versions first. Do not rewrite tests to hide a toolchain-major mismatch.

## Blocked mode

If install/check fails:

- Stop broad migration edits.
- If `ni` is unavailable or environment-blocked, use the repo-native package manager as fallback.
- Do not mix multiple package managers in one attempt unless user asks.
- In monorepo, only do manual workspace/root fallback when `ni` cannot be used.
- Do not fake a migration by editing code without a runnable `rstest` binary unless the user explicitly accepts a config-only patch.

Return a blocker report with:

1. Exact failed command(s).
2. Error class (network/auth/registry/peer conflict/lockfile mismatch/permission).
3. Concrete next command(s) for the user to run.
4. Whether files were already changed.
5. Resume point: "after dependencies are installed, continue from the deltas step".
6. Install strategy used (`ni` or explicit manager fallback).
