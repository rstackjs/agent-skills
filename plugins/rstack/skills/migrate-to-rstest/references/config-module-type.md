# Rstest Config Module Type

<!-- cspell:words TYPELESS -->

Use this reference when loading `rstest.config.*` emits Node's `[MODULE_TYPELESS_PACKAGE_JSON]` warning.

## Source of truth

- Rstest configuration files: https://rstest.rs/guide/basic/configure-rstest
- Rsbuild configuration loading: https://rsbuild.rs/guide/configuration/rsbuild
- Node.js package module rules: https://nodejs.org/api/packages.html#determining-module-system

## Understand the warning

An Rstest TypeScript config normally uses ESM syntax:

```ts
import { defineConfig } from '@rstest/core';

export default defineConfig({});
```

When the nearest controlling `package.json` has no `type` field, Node can initially treat the config as CommonJS, detect ESM syntax, and reparse it as an ES module. The warning reports that ambiguous module format and its extra parsing cost; it is not a test failure.

Resolve the ambiguity instead of hiding the warning with `NODE_OPTIONS=--no-warnings`, stderr filtering, or a blanket warning ignore.

## Choose the narrowest fix

### CommonJS or mixed package

Rename the config so only this file explicitly opts into ESM:

```text
rstest.config.ts -> rstest.config.mts
```

Rstest supports `.mts` config files. Update test scripts, CI commands, or documentation that pass an explicit `--config` / `-c` path. Remove or rename the old `.ts` config rather than leaving both files: automatic discovery checks `rstest.config.ts` before `rstest.config.mts`.

For a JavaScript config, use `rstest.config.mjs` for the same narrow ESM declaration. Use `.cts` or `.cjs` only when the config is intentionally authored with CommonJS-compatible semantics.

### Intentionally ESM package

Adding the following to the nearest package-level `package.json` also removes the ambiguity:

```json
{
  "type": "module"
}
```

Choose this only when the package is already intended to be ESM. The field changes how Node interprets every affected `.js` file, so audit runtime scripts, config files, `require` / `module.exports`, `__dirname` / `__filename`, and tool integrations first. Do not turn a package into ESM merely to silence an Rstest config warning.

In a monorepo, inspect the nearest `package.json` that controls the config path. Do not add `"type": "module"` at the workspace root when only one CommonJS package needs an unambiguous Rstest config.

## Validate

Run the same local or CI test command that produced the warning and confirm:

1. Rstest discovers the intended config, including any explicit `--config` path.
2. `[MODULE_TYPELESS_PACKAGE_JSON]` no longer appears.
3. Config imports, setup, and the migrated test scope still pass.
