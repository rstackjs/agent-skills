# Detect Test Framework

Use this reference in Step 1 to decide migration path.

## Detection signals

### Jest signals

- `jest` in `dependencies` or `devDependencies`
- `jest.config.*` exists
- `package.json` contains `jest` config
- test scripts use `jest`
- test code uses `@jest/globals` or `jest.` APIs

### Vitest signals

- `vitest` in `dependencies` or `devDependencies`
- `vitest.config.*` exists
- `vite.config.*` contains a `test` block for Vitest
- test scripts use `vitest`
- test code imports from `vitest` (`vi`, `describe`, `it`, `expect`)

## Decision rules

- If only one runner is detected, migrate that runner path.
- If both are detected, treat as mixed mode and migrate one scope at a time (package/suite).
- Prefer migrating the currently CI-critical or higher-failure scope first.
- Keep both legacy runners until each migrated scope is green on Rstest.
