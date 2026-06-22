# Detect Test Framework

Use this reference to decide the migration path and scope.

## Detection signals

### Jest signals

- `jest` in `dependencies` or `devDependencies`
- `jest.config.*` exists
- `package.json` contains a `jest` config block
- test scripts use `jest`
- test code imports from `@jest/globals` or uses `jest.` APIs
- Jest-only packages such as `ts-jest`, `babel-jest`, `jest-environment-jsdom`, `identity-obj-proxy`, `@types/jest`, `jest-junit`

### Vitest signals

- `vitest` in `dependencies` or `devDependencies`
- `vitest.config.*` exists
- `vite.config.*` contains a `test` block for Vitest
- `vitest.workspace.*` exists
- test scripts use `vitest`, `vitest run`, or `vitest --run`
- test code imports from `vitest` (`vi`, `vitest`, `describe`, `it`, `expect`)
- Vitest-only packages such as `@vitest/coverage-v8`, `@vitest/coverage-istanbul`, `@vitest/ui`

### Rstack integration signals

- `rslib.config.*` exists -> consider `@rstest/adapter-rslib` and `extends: withRslibConfig()`.
- `rsbuild.config.*` exists -> consider `@rstest/adapter-rsbuild` and `extends: withRsbuildConfig()`.
- `rspack.config.*` exists -> consider `@rstest/adapter-rspack` and `extends: withRspackConfig()`.
- `@rsbuild/core`, `@rspack/core`, `@rslib/core`, or `@rsbuild/plugin-*` in dependencies/devDependencies indicates the migration must preserve Rstack toolchain compatibility.
- `overrides`, `resolutions`, and `pnpm.overrides` can pin Rsbuild/Rspack or plugin majors; inspect them before choosing the Rstest target version.
- Existing Rspack/Rsbuild aliases, plugins, `source.define`, `tools.swc`, or `output.externals` are often better migrated through adapters/config than by editing tests.

### Browser / DOM signals

- Jest `testEnvironment: 'jsdom'`, Vitest `environment: 'jsdom'` / `happy-dom`, or file-level environment comments.
- React/Vue Testing Library setup files.
- `@testing-library/jest-dom/vitest` should be replaced with direct matcher registration in Rstest setup.

## Decision rules

- If only one runner is detected, migrate that runner path.
- If both are detected, treat as mixed mode and migrate one scope at a time (package/suite/project).
- Prefer migrating the currently CI-critical or higher-failure scope first.
- Keep both legacy runners until each migrated scope is green on Rstest.
- Choose the Rstest target version together with the Rstack toolchain major: latest Rstest for Rsbuild/Rspack 2.x, or Rstest 0.8.x for Rsbuild/Rspack 1.x. Align `@rsbuild/plugin-*` with the same Rsbuild major before config migration.
- In monorepos, choose the smallest runnable scope that has its own package/config/test script. Do not migrate unrelated packages just because they share a root lockfile.
- If the root config is only a project/workspace aggregator, preserve that role: Rstest root `projects` config is not itself a test project unless the root is explicitly included as a project.
