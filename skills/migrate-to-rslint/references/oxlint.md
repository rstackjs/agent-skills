# Oxlint -> Rslint migration guide

Use this reference for `.oxlintrc.json`, `.oxlintrc.jsonc`, or `oxlint.config.*`. It translates Oxlint-specific configuration into Rslint entries, then returns to the shared entry-point, validation, and cleanup steps in [SKILL.md](../SKILL.md).

## Official references

- Oxlint [configuration](https://oxc.rs/docs/guide/usage/linter/config), [CLI](https://oxc.rs/docs/guide/usage/linter/cli.html), and [rules](https://oxc.rs/docs/guide/usage/linter/rules.html)
- Oxlint [JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) and [`createOnce` compatibility](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html)
- Rslint [rules](https://rslint.rs/rules/), [file selectors](https://rslint.rs/config/files), [ignores](https://rslint.rs/config/ignoring-files), and [project settings](https://rslint.rs/config/language-options)

## Checklist

Copy this checklist and check off items as you complete them:

- [ ] Step 0: Resolve source configs, defaults, and command overrides
- [ ] Step 1: Normalize rule values without losing inherited options
- [ ] Step 2: Map rule identities and split combined JS/TS behavior
- [ ] Step 3: Preserve file scopes, ignores, and TypeScript projects
- [ ] Step 4: Adapt JS plugins while retaining their configuration
- [ ] Step 5: Translate source-specific flags and directives, then resume the shared workflow

## Step 0: resolve the effective source configuration

Read the leaf config and its shared presets, imports, object spreads, and `extends`. Use the installed Oxlint version and the same working directory and environment as the original command.

Collect both the evaluated configuration and Oxlint's `--print-config` output for each distinct configuration in the migrated scope. The evaluated form retains inheritance, plugin objects, and options; the printed form reveals defaults, category expansion, and normalized native rule names. Reconcile them rather than treating either as a complete substitute for the other.

For example, adapt these commands to the repository's package manager, config path, and original flags:

```bash
pnpm exec oxlint --print-config --config oxlint.config.mts
pnpm exec oxlint --rules --format json
```

Include `--type-aware` when the source command enables it. Preserve the order of CLI category/rule overrides such as `-D correctness -A no-debugger`, and plugin switches. Check the installed CLI's supported export options before using these examples.

| Source input                                                 | Information to retain                                                                                      |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `plugins`, `categories`, defaults, CLI overrides             | Effective native rules, including rules absent from the authored `rules` object                            |
| `rules`                                                      | Severity, full options, and explicit `off` entries                                                         |
| `extends`, `overrides`                                       | Inheritance order, `files`, `excludeFiles`, and local changes                                              |
| `jsPlugins`                                                  | Module or object, configured alias, wrapper, and JS rule configuration                                     |
| `ignorePatterns`, ignore files, `env`, `globals`, `settings` | Path origins, environment globals, plugin settings, and precedence                                         |
| Runtime options and environment variables                    | Type-aware mode, project context, warning policy, directive compatibility, and conditional plugin behavior |

Inspect files without a leaf config separately: root fallback or default rules can differ from workspace presets. `--quiet` hiding warnings does not mean warning-level rules are disabled. Do not use diagnostic output alone as a rule inventory.

Keep native and JS plugin data separately identifiable. Native-only exports or comparison configs that remove `jsPlugins` are incomplete migration inputs.

## Step 1: normalize rule values and inheritance

Normalize severity aliases:

| Oxlint value         | Rslint value |
| -------------------- | ------------ |
| `allow`, `off`, `0`  | `off`        |
| `warn`, `1`          | `warn`       |
| `deny`, `error`, `2` | `error`      |

Inspect the export schema before converting options. Oxlint 1.79.0 printed some values as `[level, [option1, option2]]`; those need `[level, option1, option2]` in ESLint-style config. Unwrap only that schema layer. An option that is itself an array must remain an array; do not flatten authored rule values indiscriminately.

Resolve severity-only overrides using the source version's merge semantics. For example, when a parent sets `['warn', { max: 3 }]` for `max-params` and a child changes only the severity to `error`, preserve the effective `{ max: 3 }` option. The historical print output omitted some inherited options, so consult the evaluated inheritance tree when necessary.

Track the latest explicit options and later severity changes for each rule through `extends` and each override. Preserve ordered entries instead of using a shallow object spread to approximate rule merging. Retain options such as selectors/messages in `no-restricted-syntax`, nested objects, and explicit disabled rules.

## Step 2: map rule identities

Resolve aliases with the installed Oxlint registry and Rslint rule catalog. Treat these as candidate mappings, then check the actual rule and options:

| Oxlint rule             | Rslint candidate                                    |
| ----------------------- | --------------------------------------------------- |
| `eslint/<core-rule>`    | `<core-rule>`                                       |
| `typescript/<rule>`     | `@typescript-eslint/<rule>`                         |
| `react/rules-of-hooks`  | `react-hooks/rules-of-hooks`                        |
| `react/exhaustive-deps` | `react-hooks/exhaustive-deps`                       |
| Custom JS namespace     | The same configured alias and plugin implementation |

Some aliases resolve to core rules despite their source prefix. Do not replace namespaces without checking ownership. Declare the target native plugin namespaces needed by the mapped rules; a rule key alone does not replace plugin registration. Do not add recommended presets as a shortcut for Oxlint categories, because their rule sets differ.

### Split combined JS and TypeScript rules

Oxlint can use one rule ID for both JS and TS behavior that Rslint exposes as a core rule and a TypeScript extension. Historical examples include `max-params`, `no-array-constructor`, `no-dupe-class-members`, `no-empty-function`, `no-restricted-imports`, `no-unused-expressions`, `no-unused-vars`, and `no-useless-constructor`. Check each against the versions being migrated; this is not an exhaustive or unconditional replacement list.

For each confirmed pair, keep the core rule in its original entry and insert a TS entry immediately after it. In the TS entry, disable the core rule and enable its extension with the same effective severity and options. Preserve `basePath` and local ignores, and keep later source overrides later in the array. Use the normalized file patterns described in Step 3 before forming TS intersections.

For an original `files: ['src/**/*', 'tests/**/*']`, the TS entry intersects each branch with the TS extensions:

```js
{
  files: [
    ['src/**/*', '**/*.{ts,tsx,mts,cts}'],
    ['tests/**/*', '**/*.{ts,tsx,mts,cts}'],
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    'max-params': 'off',
    '@typescript-eslint/max-params': ['error', { max: 3 }],
  },
}
```

With no original `files`, use only the TS selector. Append it to an existing AND group rather than nesting another group. Two top-level strings mean OR and would broaden the scope. Apply this mapping to later severity/off overrides too, so they do not leave an earlier TS extension enabled.

Do not split by name alone: core `no-unused-private-class-members` concerns `#private`, while a TypeScript extension may also cover `private` keyword members. More configured IDs after a split do not necessarily mean more active rules per file.

### Handle proprietary rules and conditional substitutes

Use the main skill's unsupported-rule handling. Check current native support and compatible JS implementations before declaring a gap. For a proposed substitute, compare detection scope, required type information, options, and fixes/suggestions. Similar names are insufficient:

- `oxc/missing-throw` is not equivalent to `no-new` or `unicorn/throw-new-error`.
- `oxc/only-used-in-recursion` and `unicorn/no-useless-recursion` inspect different behavior.
- A `TSEnumDeclaration[const=true]` selector for `oxc/no-const-enum` depends on target selector support and does not reproduce its fix by itself.
- A type-aware substitute for `unicorn/prefer-string-starts-ends-with` can change coverage when type information is unavailable.

Keep unresolved mappings visible. A rule intersection prepared for benchmarking is not the production migration policy; do not copy its blanket rule disables or JS plugin removal.

## Step 3: preserve scopes, ignores, and projects

Translate `overrides` to ordered flat entries. Map `excludeFiles` to that entry's local `ignores`; it must not become a global exclusion. Translate `ignorePatterns` into global ignores for the original owning scope. Map environment globals and explicit globals into `languageOptions.globals`, retaining precedence and file scope; keep `settings` with the rules that consume them.

Normalize override globs before copying them into flat config. Oxlint's [glob normalization](https://github.com/oxc-project/oxc/blob/main/crates/oxc_config/src/glob_set.rs) makes patterns without `/` recursive unless they start with `./`; Rslint's flat selectors do not add that recursion. Use already-normalized patterns from printed config when available. When converting authored patterns, preserve these distinctions for both `files` and `excludeFiles`:

| Authored Oxlint override pattern   | Rslint pattern                         | Matching scope                                        |
| ---------------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `*.test.ts`                        | `**/*.test.ts`                         | Root and nested test files                            |
| `*.generated.ts` in `excludeFiles` | `**/*.generated.ts` in local `ignores` | Root and nested generated files                       |
| `./*.test.ts`                      | `*.test.ts`                            | Test files directly under the config's base directory |

Retain each pattern's original base directory and check root and nested file examples against the source version. Do not recursively normalize an already-normalized printed `*.test.ts`: it may have originated from the anchored `./*.test.ts` form.

Rslint reads `.gitignore`, but its collection roots depend on config discovery and invocation. Compare the source's ancestor ignore behavior with the target's actual config boundaries before removing or copying patterns. When an ancestor ignore is not inherited, preserve it in a global ignore entry with `basePath` bound to the original directory. Keep negations, order, root anchoring, basename patterns, and trailing-directory semantics; a raw concatenation of patterns from different directories changes their meaning.

For repeated monorepo configs, a shared profile plus a leaf config can reduce duplication. Bind relative file/ignore/project paths to the leaf's location, for example from its `import.meta.url`, rather than to the shared helper directory. Keep ancestor-ignore entries bound to their own directories. Use direct flat config for a simple project; profile JSON and a generator are not required.

When the source enables type-aware linting, preserve project selection with `languageOptions.parserOptions.project` or `projectService: true` as appropriate. Do not enable both modes together. Account for nonstandard project names used by package commands, such as `tsconfig.lint.json`. Check what a source `--tsconfig` flag actually controls in that Oxlint version: import resolution and type-aware linting may select projects differently.

Type-aware rules require a selected project that includes the linted file. `--type-check` adds compiler diagnostics and must not be introduced merely because the source used `--type-aware`.

## Step 4: adapt JS plugins

Oxlint `plugins` declares native groups; `jsPlugins` loads JS implementations. Preserve the module, configured namespace, rule values, settings, overrides, and environment wrappers for each JS plugin. Resolve imports relative to their original config or package before relocating them.

Choose adaptation by the plugin's actual API:

1. An ESLint-compatible `create(context)` plugin can follow [ESLint-compatible JS plugins](eslint-plugins.md) directly.
2. For a `createOnce(context)` plugin, check whether its export already provides compatible `create` methods. Otherwise use the installed `@oxlint/plugins` package's official `eslintCompatPlugin` adapter before registering it with Rslint. Reuse the implementation; do not rename `createOnce` to `create`, because lifecycle behavior differs.
3. Retain plugin and adapter dependencies after removing the Oxlint CLI. Keep environment-controlled wrappers and separate hook invocations intact; an import that becomes a no-op in one environment is not evidence that the plugin is unused.

One migration with Oxlint 1.79.0 and Rslint 0.9.4 required a context prototype view around the adapted `create`. Treat this only as a troubleshooting lead: reproduce the context-layout failure on the installed versions first. If still needed, clone the plugin and affected rule, capture its original `create`, and delegate with `originalCreate.call(this, Object.create(context))`. Do not mutate the imported plugin or change detection logic, and do not install this historical workaround by default.

Continue with the shared JS plugin reference to check target APIs and rule execution.

## Step 5: translate flags and directives

Carry the resolved rules, plugins, scopes, and settings into the main workflow's entry-point update. Fold Oxlint category and native-plugin flags into the translated configuration. Preserve `--quiet` and warning thresholds; `--deny-warnings` maps to `--max-warnings 0`. Check other flags against the installed Rslint CLI, especially fix modes and output formats, rather than copying them verbatim.

Check the source's [directive compatibility option](https://oxc.rs/docs/guide/usage/linter/config-file-reference#options-respecteslintdisabledirectives) before preserving comments. With `options.respectEslintDisableDirectives: false`, existing `eslint-*` directives are inactive in Oxlint but would become active in Rslint. Preserve that inactivity: use an equivalent target setting if supported, otherwise make those comments non-directive in fully migrated files. If a retained ESLint check still consumes them, record the compatibility gap rather than breaking its suppressions.

Inspect both `oxlint-*` and active `eslint-*` comments. Rslint documents `eslint-` and `rslint-` prefixes; translate unsupported `oxlint-disable`, `oxlint-enable`, `oxlint-disable-line`, and `oxlint-disable-next-line` forms to a supported prefix. Map rule aliases using Step 2, including in active `eslint-*` comments. For a split rule, use the rule active for that file's syntax. Preserve descriptions, line/block scope, and disable/enable pairs. Do not turn an unmapped rule-specific suppression into a blanket disable.

Refer to the official [Oxlint comments](https://oxc.rs/docs/guide/usage/linter/ignore-comments.html) and [Rslint directives](https://rslint.rs/guide/inline-directives) docs for supported syntax. Limit edits to directive comments; keep strings, snapshots, and documentation unchanged unless they are part of the requested migration.

Resume validation and cleanup in [SKILL.md](../SKILL.md) with the effective source inventory, translated config, required JS dependencies, and explicit unresolved mappings.
