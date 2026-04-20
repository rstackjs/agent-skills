# Global API Migration

Use this reference when tests rely on globally available test APIs (Jest's `jest.<api>`, or Vitest's `vi.<api>` / `vitest.<api>` under `globals: true`).

For the identifier mapping (`jest.` / `vi.` / `vitest.` → Rstest equivalents), see the official guides:

- Jest: https://rstest.rs/guide/migration/jest.md (see "Test API")
- Vitest: https://rstest.rs/guide/migration/vitest.md (see "Test API" and "Global APIs")

The rules below are skill-side enforcement on top of that mapping.

## Red lines

1. **No shims.** All three forms below leave the migration incomplete and must be rejected in every test and setup file:
   - `globalThis.vi = rs;` / `global.jest = rstest;` (direct global aliasing)
   - `const vi = rs;` / `const jest = rstest;` (local rebinding)
   - `import { rs as vi } from '@rstest/core';` / `import { rstest as jest } from '@rstest/core';` (aliased named import)

   Fix at every call site instead. Do not propose a shim "just to keep the diff small" — it hides whether the migration actually happened, blocks IDE refactors, and silences future deprecation warnings.

2. **No test-name mutation.** When rewriting `vi.` / `jest.` / `vitest.`, only replace identifiers that precede a `(`. After every batch edit, grep `describe\(|it\(|test\(` to confirm no name string was rewritten — test names are stable identifiers, not labels for the new API.

3. **Global-only scope.** Do not apply these replacements to import-style APIs; this rule is global-only.
