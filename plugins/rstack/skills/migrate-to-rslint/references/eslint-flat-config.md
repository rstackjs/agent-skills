# ESLint Flat Config -> Rslint Migration Guide

Use this reference when the source project uses `eslint.config.*`.

## Official references

- Rslint CLI: https://rslint.rs/guide/cli
- Rslint configuration: https://rslint.rs/config/
- Rslint ignores and `.gitignore`: https://rslint.rs/config/ignoring-files
- Rslint rules and presets: https://rslint.rs/config/rules-and-presets
- Rslint inline directives: https://rslint.rs/guide/inline-directives
- Rslint VS Code extension: https://rslint.rs/guide/vscode-extension
- `jiti`: https://npmjs.com/package/jiti

## Checklist

Copy this checklist and check off items as you complete them:

- [ ] Step 0: Inventory current ESLint behavior
- [ ] Step 1: Replace linter package dependencies
- [ ] Step 2: Replace package scripts and CLI flags
- [ ] Step 3: Rename and translate config file
- [ ] Step 4: Migrate presets, plugins, rules, and ignores
- [ ] Step 5: Preserve inline directives unless the user asks for `rslint-disable`
- [ ] Step 6: Replace VS Code ESLint settings with Rslint settings
- [ ] Step 7: Validate, then remove obsolete ESLint artifacts

## Step 0: Inventory current ESLint behavior

Check:

- `package.json` scripts that run `eslint`.
- `eslint.config.js`, `eslint.config.mjs`, `eslint.config.ts`, or `eslint.config.mts`.
- `.vscode/settings.json` and `.vscode/extensions.json`.
- ESLint dependencies such as `eslint`, `@eslint/js`, `typescript-eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, and `eslint-plugin-*`.
- Custom or third-party ESLint plugins that do not have a Rslint built-in equivalent.

Do not delete the ESLint config or dependencies until the migrated Rslint command is green.

## Step 1: Replace linter package dependencies

Install Rslint:

```bash
pnpm add -D @rslint/core
```

Use the repository's package manager if it is not pnpm:

```bash
npm install -D @rslint/core
yarn add -D @rslint/core
bun add -D @rslint/core
```

If the migrated config is `rslint.config.ts` and the project must support Node.js 20, also install `jiti`:

```bash
pnpm add -D jiti
```

Remove ESLint-only dependencies only after validation passes. Built-in Rslint presets/plugins often make these packages obsolete:

- `eslint`
- `@eslint/js`
- `typescript-eslint`
- `@typescript-eslint/parser`
- `@typescript-eslint/eslint-plugin`
- `eslint-plugin-react`
- `eslint-plugin-react-hooks`
- `eslint-plugin-import`
- `eslint-plugin-promise`
- `eslint-plugin-jest`
- `eslint-plugin-unicorn`
- `eslint-plugin-jsx-a11y`

Before removing any package, verify it is not used by another tool, workspace package, or still-unmigrated scope.

## Step 2: Replace package scripts and CLI flags

Replace `eslint` commands with `rslint` commands. Preserve file and directory arguments.

Common mappings:

| ESLint script                        | Rslint script                        |
| ------------------------------------ | ------------------------------------ |
| `eslint .`                           | `rslint .`                           |
| `eslint src`                         | `rslint src`                         |
| `eslint . --fix`                     | `rslint . --fix`                     |
| `eslint --config eslint.config.js .` | `rslint --config rslint.config.js .` |
| `eslint . --quiet`                   | `rslint . --quiet`                   |
| `eslint . --max-warnings 0`          | `rslint . --max-warnings 0`          |

Use only Rslint-supported CLI flags. Supported flags include `--init`, `--config <path>`, `--fix`, `--type-check`, `--format <format>`, `--quiet`, `--max-warnings <n>`, `--rule <rule>`, `--no-color`, and `--force-color`.

Do not copy ESLint-only flags blindly. For example, remove or re-evaluate flags such as `--ext`, `--cache`, `--cache-location`, `--resolve-plugins-relative-to`, and `--report-unused-disable-directives` unless the Rslint CLI docs provide an equivalent.

If the old lint command relied on type-aware TypeScript linting, validate the migrated command with `--type-check` or preserve the project's existing Rslint type-checking setup.

## Step 3: Rename and translate config file

Rename the config to `rslint.config.*`.

Recommended mapping:

| ESLint flat config  | Rslint config       |
| ------------------- | ------------------- |
| `eslint.config.js`  | `rslint.config.js`  |
| `eslint.config.mjs` | `rslint.config.mjs` |
| `eslint.config.ts`  | `rslint.config.ts`  |
| `eslint.config.mts` | `rslint.config.mts` |

Rslint uses flat config arrays, so the shape is close to ESLint flat config. Import built-in helpers and presets from `@rslint/core`:

```ts
import {
  defineConfig,
  js,
  ts,
  reactPlugin,
  reactHooksPlugin,
  importPlugin,
  promisePlugin,
  jestPlugin,
  unicornPlugin,
  jsxA11yPlugin,
} from '@rslint/core';

export default defineConfig([
  js.configs.recommended,
  ts.configs.recommended,
  reactPlugin.configs.recommended,
  reactHooksPlugin.configs.recommended,
  importPlugin.configs.recommended,
  promisePlugin.configs.recommended,
  jestPlugin.configs.recommended,
  unicornPlugin.configs.recommended,
  jsxA11yPlugin.configs.recommended,
  {
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]);
```

Keep the config format aligned with the source project where practical. If the old config was JavaScript, keep JavaScript. If the old config was TypeScript, use TypeScript and add `jiti` when Node.js 20 compatibility is required.

## Step 4: Migrate presets, plugins, rules, and ignores

Rslint has built-in presets that cover common ESLint flat config imports:

| ESLint source                                  | Rslint equivalent                            |
| ---------------------------------------------- | -------------------------------------------- |
| `@eslint/js` `js.configs.recommended`          | `js.configs.recommended` from `@rslint/core` |
| `typescript-eslint` `ts.configs.recommended`   | `ts.configs.recommended` from `@rslint/core` |
| `eslint-plugin-react` recommended config       | `reactPlugin.configs.recommended`            |
| `eslint-plugin-react-hooks` recommended config | `reactHooksPlugin.configs.recommended`       |
| `eslint-plugin-import` recommended config      | `importPlugin.configs.recommended`           |
| `eslint-plugin-promise` recommended config     | `promisePlugin.configs.recommended`          |
| `eslint-plugin-jest` recommended config        | `jestPlugin.configs.recommended`             |
| `eslint-plugin-unicorn` recommended config     | `unicornPlugin.configs.recommended`          |
| `eslint-plugin-jsx-a11y` recommended config    | `jsxA11yPlugin.configs.recommended`          |

Rslint aligns its JavaScript recommended preset with ESLint's `js.configs.recommended` and its TypeScript recommended preset with `typescript-eslint` `ts.configs.recommended`. These presets are built in; do not install `@eslint/js` or `typescript-eslint` just to use recommended configs after migration.

For rules:

- Keep rule severities and options when Rslint supports the rule.
- If Rslint reports an unknown rule, remove it from the Rslint config and list it as an unsupported migration gap.
- Do not keep installing ESLint plugins in an attempt to make Rslint load them.
- For built-in plugin presets, remove the old plugin dependency after validation if it is no longer used elsewhere.

For ignores:

- Rslint automatically reads `.gitignore` files and treats those patterns as global ignores.
- Remove `ignores` entries that only duplicate `.gitignore` patterns.
- Keep lint-specific ignores that are not in `.gitignore`, such as source fixtures, generated checked-in files, or deliberate lint exclusions.
- Remember that a config entry containing only `ignores` is a global ignore and can block nested config discovery in ignored directories.

## Step 5: Preserve inline directives unless requested

Do not replace source comments such as:

```ts
// eslint-disable-next-line no-console
console.log(value);
```

Rslint supports both `eslint-` and `rslint-` directive prefixes, and they are equivalent.

Only replace prefixes when the user explicitly asks to use `rslint-disable`. If replacement is requested, change directive prefixes in comments while preserving rule names and descriptions:

| ESLint directive           | Rslint directive           |
| -------------------------- | -------------------------- |
| `eslint-disable`           | `rslint-disable`           |
| `eslint-enable`            | `rslint-enable`            |
| `eslint-disable-next-line` | `rslint-disable-next-line` |
| `eslint-disable-line`      | `rslint-disable-line`      |

After replacing, grep for remaining directives:

```bash
rg -n "eslint-(disable|enable)"
```

Do not mutate string literals, docs, snapshots, or user-visible text unless the user asked for a full terminology change.

## Step 6: Replace VS Code ESLint settings with Rslint settings

Check `.vscode/extensions.json`:

- Replace `dbaeumer.vscode-eslint` with `rstack.rslint` when the project recommended ESLint only for linting.
- Keep other extension recommendations unrelated to linting.

Check `.vscode/settings.json`:

- Replace `source.fixAll.eslint` with `source.fixAll.rslint`.
- Remove ESLint-only settings such as `eslint.enable`, `eslint.validate`, `eslint.useFlatConfig`, `eslint.workingDirectories`, `eslint.options`, `eslint.nodePath`, and `eslint.format.enable`.
- Add Rslint settings only when needed. Useful settings include `rslint.enable`, `rslint.binPath`, `rslint.customBinPath`, and `rslint.trace.server`.

Example fix-on-save setting:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.rslint": "explicit"
  }
}
```

The official VS Code extension id is `rstack.rslint`. It can use the built-in binary by default; use `rslint.binPath: "local"` only when the project needs the workspace-installed binary.

## Step 7: Validate, then remove obsolete ESLint artifacts

Run the migrated lint command, for example:

```bash
pnpm lint
```

Or run Rslint directly:

```bash
pnpm exec rslint .
```

If the project has a fix script and the task allows modifying lint fixes:

```bash
pnpm exec rslint . --fix
```

Resolve validation failures in this order:

1. Config loading and package resolution.
2. Unknown presets/plugins/rules.
3. Ignore coverage and file selection.
4. Type-aware linting behavior.
5. Autofix differences.

After validation passes:

- Remove obsolete ESLint config files.
- Remove obsolete ESLint dependencies that are not used elsewhere.
- Remove or update ESLint-specific editor settings.
- Summarize unsupported rules/plugins separately from completed migration work.
