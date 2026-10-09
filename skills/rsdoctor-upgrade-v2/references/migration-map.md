# Rsdoctor 2.0 Migration Map

Read only the sections that match the audited project.

## Compatibility

| Area          | Rsdoctor 2.0 requirement | Migration action                                                                       |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| Node.js       | 22.18 or later           | Update local, CI, and deployment runtimes before installing 2.x.                       |
| Bundler       | Rspack 2.0 or later      | Upgrade Rspack first. If a framework owns Rspack, upgrade through the framework.       |
| webpack       | Unsupported              | Stay on maintained Rsdoctor 1.x or migrate to Rspack in a separate change.             |
| Module format | ESM-only packages        | Replace Rsdoctor `require()` calls with imports and use an ESM-compatible config file. |

## Packages and imports

| Rsdoctor 1.x usage                                                                                  | Rsdoctor 2.x action                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@rsdoctor/rspack-plugin`                                                                           | Replace with `@rsdoctor/core`. Import `RsdoctorRspackPlugin` from `@rsdoctor/core`.                                                                                                              |
| `@rsdoctor/cli`                                                                                     | Keep when the `rsdoctor` command or Node.js API is used. Match its version to `@rsdoctor/core`.                                                                                                  |
| `@rsdoctor/mcp-server`                                                                              | Remove and migrate the workflow to `@rsdoctor/agent-cli`; this is a workflow migration, not an import rename.                                                                                    |
| `@rsdoctor/webpack-plugin`                                                                          | No 2.x replacement. Keep the project on Rsdoctor 1.x or migrate the bundler first.                                                                                                               |
| `@rsdoctor/sdk`, `@rsdoctor/graph`, `@rsdoctor/types`, `@rsdoctor/utils`, or `@rsdoctor/components` | These standalone packages are removed. Resolve each used symbol against documented public exports from `@rsdoctor/core` or `@rsdoctor/shared`; there is no safe package-wide search-and-replace. |

Basic plugin import:

```ts
// Before
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

// After
import { RsdoctorRspackPlugin } from '@rsdoctor/core';
```

If the old config uses CommonJS, migrate the config itself to ESM:

```ts
import { RsdoctorRspackPlugin } from '@rsdoctor/core';

export default {
  plugins: [new RsdoctorRspackPlugin()],
};
```

When renaming `rspack.config.js` or `rspack.config.cjs` to `.mjs` or `.mts`, update build scripts that pass the config path explicitly.

## Configuration options

| Rsdoctor 1.x option                                                 | Status in 2.x              | Replacement                                                                                   |
| ------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| `experiments.enableNativePlugin`                                    | Removed                    | Delete it; the native plugin is always enabled.                                               |
| top-level `mode: 'normal'`                                          | Removed and ignored        | `output.mode: 'normal'`                                                                       |
| top-level `mode: 'brief'`                                           | Removed and ignored        | `output.mode: 'brief'`                                                                        |
| top-level `mode: 'lite'`                                            | Removed and ignored        | `output.mode: 'normal'` plus `output.reportCodeType: 'noCode'` or `'noAssetsAndModuleSource'` |
| `brief`                                                             | Deprecated                 | `output.mode: 'brief'`, `output.options.type: ['html']`, and `output.options.htmlOptions`     |
| `brief.writeDataJson` or `output.options.htmlOptions.writeDataJson` | Removed                    | Include both formats with `output.options.type: ['html', 'json']`                             |
| `output.compressData`                                               | Removed and ignored        | `output.mode: 'brief'` plus `output.options.type: ['json']`                                   |
| top-level `port`                                                    | Deprecated                 | `server.port`                                                                                 |
| `supports.generateTileGraph`                                        | Deprecated and unnecessary | Delete it; tree-map data is generated by default.                                             |

Brief HTML and JSON output:

```ts
new RsdoctorRspackPlugin({
  output: {
    mode: 'brief',
    options: {
      type: ['html', 'json'],
      htmlOptions: {
        reportHtmlName: 'rsdoctor-report.html',
      },
    },
  },
  server: {
    port: 9966,
  },
});
```

Lite-equivalent output without module source code:

```ts
new RsdoctorRspackPlugin({
  output: {
    mode: 'normal',
    reportCodeType: 'noCode',
  },
});
```

Both `features: { lite: true }` and `features: ['lite']` remain supported. Leave them unchanged unless the project benefits from expressing the equivalent behavior explicitly with `output.reportCodeType`.

## AI workflow

Remove MCP entries from files such as `.cursor/mcp.json` and `.vscode/mcp.json`, and remove automation that starts `npx @rsdoctor/mcp-server`.

Generate JSON data with Rsdoctor 2.x, then invoke Agent CLI directly:

```bash
rsdoctor-agent bundle optimize --data-file ./dist/rsdoctor-data.json
rsdoctor-agent query packages_duplicates --data-file ./dist/rsdoctor-data.json
```

Update agents and automation to parse the structured command output. The data file replaces the long-running MCP connection, so MCP-only server ports and compiler-selection arguments do not carry over.

## Final search

Use a bounded search after the migration:

```bash
rg '@rsdoctor/(rspack-plugin|webpack-plugin|sdk|graph|types|utils|components|mcp-server)|enableNativePlugin|compressData|generateTileGraph|writeDataJson'
```

Review every match; documentation, snapshots, or intentionally retained Rsdoctor 1.x examples may be valid.
