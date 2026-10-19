# ESLint-compatible JS plugins

Use this reference when the source config loads community or local JS plugins. Oxlint-specific `createOnce` adaptation is covered in [the Oxlint guide](oxlint.md#step-4-adapt-js-plugins).

Check the installed Rslint version against the official [plugin configuration](https://rslint.rs/config/plugins) and [ESLint API compatibility](https://rslint.rs/guide/eslint-plugins) references.

## Preserve plugin identity and configuration

- Record each module, configured namespace, enabled rules, options, settings, file scope, and environment-dependent wrapper. A loaded module or an explicitly disabled rule is not an enabled rule.
- Reuse the plugin implementation when supported. Keep its package and runtime dependencies resolvable from the migrated config.
- Register native namespaces with a `plugins` array and JS plugin objects with a `plugins` object in separate entries. Keep their original scope and precedence.
- Preserve custom aliases. If an alias conflicts with a Rslint built-in namespace, choose a distinct alias and update its rule keys and directive references together; do not merge unrelated rules by name.

For example, separate native and JS plugin registration while retaining the same file scope:

```js
import customPlugin from './lint/custom-plugin.js';

export default [
  {
    files: ['src/**/*.ts'],
    plugins: ['@typescript-eslint'],
    rules: { '@typescript-eslint/no-explicit-any': 'warn' },
  },
  {
    files: ['src/**/*.ts'],
    plugins: { custom: customPlugin },
    rules: { 'custom/project-rule': 'error' },
  },
];
```

## Check the APIs used by enabled rules

Confirm that the target version supports the plugin's selectors, context APIs, and fix behavior. In particular, inspect uses of parser services, custom parsers/processors, and code-path listeners against the compatibility reference. Loading a plugin successfully does not prove that its rules execute.

Use a representative known violation to confirm execution, including any environment switch that enables or disables a wrapper. Preserve rule logic; report an API gap when the existing implementation cannot run. Return to the calling source-specific guide and finish its remaining steps before continuing with the main workflow.
