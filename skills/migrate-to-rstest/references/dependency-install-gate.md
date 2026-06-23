# Dependency Install Gate

Use this reference when running the dependency install gate step of the migration workflow.

## Quick path

Use the repository's native package manager instead of adding another package just to detect the manager.

Detect the manager from existing project signals, in this order:

1. `package.json#packageManager`
2. Lockfile: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `npm-shrinkwrap.json`, or `bun.lockb`
3. Existing CI/test scripts or workspace files such as `pnpm-workspace.yaml` or `.yarnrc.yml`

Then install with that manager. For example, in a pnpm repo:

```bash
pnpm install
```

After adding `@rstest/core`, verify Rstest through the same local manager path without remote package fallback. For example:

```bash
pnpm exec rstest -h
```

For npm-only repos, run `./node_modules/.bin/rstest -h` directly, or use `npm exec -- rstest -h` after local install. In Yarn/Bun repos, use the repo's local binary execution path only when it resolves the installed dependency.

If a package manager script already exists after the script migration, also prefer the repo-native script (for example `pnpm test -- --help` only when that is how the repo runs tests).

## Dependency decisions

Install only packages the migrated scope needs:

- Always add `@rstest/core` as a dev dependency for a migrated scope.
- If coverage is enabled, add a Rstest provider supported by the target Rstest version:
  - `coverage.provider: 'istanbul'` -> `@rstest/coverage-istanbul`
  - `coverage.provider: 'v8'` -> `@rstest/coverage-v8` only for Rstest >= 0.10.2; for Rstest 0.8.x targets, use Istanbul or explicitly plan a toolchain upgrade first
- If migrating a project that already has `rslib.config.*`, prefer `@rstest/adapter-rslib`.
- If migrating a project that already has `rsbuild.config.*`, prefer `@rstest/adapter-rsbuild`.
- Keep Jest/Vitest packages until the migrated scope is green. Remove them only in the cleanup phase and only if no other scope still uses them.

Temporary overlap between legacy coverage packages and Rstest coverage packages is acceptable until the migrated scope is green. Do not add multiple Rstest coverage providers for the same final scope unless the repo intentionally keeps multiple coverage modes.

## Rsbuild/Rspack version compatibility gate

Before debugging test failures, check whether the Rstest target version matches the installed Rstack toolchain:

- Latest Rstest uses the Rsbuild/Rspack 2.x ecosystem.
- Rstest 0.8.x uses the Rsbuild/Rspack 1.x ecosystem.
- `@rsbuild/plugin-*` packages must satisfy the installed `@rsbuild/core` peer range. Do not force major equality for plugins whose published peer range intentionally spans majors.
- Choose adapters such as `@rstest/adapter-rsbuild`, `@rstest/adapter-rslib`, and `@rstest/adapter-rspack` by peer compatibility with `@rstest/core` and the underlying Rsbuild/Rslib/Rspack version. Rstest 0.8.x migrations may need older adapter package versions whose package major does not match `@rstest/core`.
- In monorepos, check root and package-level `overrides`, `resolutions`, `pnpm.overrides`, lockfile entries, and nested package managers for duplicate major versions.

Use the repo-native package manager for inspection. Examples:

```bash
pnpm -r list @rstest/core @rsbuild/core @rspack/core @rslib/core --depth Infinity
pnpm -r list @rstest/adapter-rsbuild @rstest/adapter-rslib @rstest/adapter-rspack --depth Infinity
pnpm -r list --depth Infinity | rg '@rsbuild/plugin-'
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
- Use the repo-native package manager indicated by `packageManager`, lock files, workspace files, or existing scripts.
- Do not mix multiple package managers in one attempt unless user asks.
- In monorepos, run installs/checks from the workspace root unless the repo clearly uses nested package managers.
- Do not fake a migration by editing code without a runnable `rstest` binary unless the user explicitly accepts a config-only patch.

Return a blocker report with:

1. Exact failed command(s).
2. Error class (network/auth/registry/peer conflict/lockfile mismatch/permission).
3. Concrete next command(s) for the user to run.
4. Whether files were already changed.
5. Resume point: "after dependencies are installed, continue from the deltas step".
6. Install strategy used and which repo signal selected it (`packageManager`, lockfile, workspace file, or existing script).
