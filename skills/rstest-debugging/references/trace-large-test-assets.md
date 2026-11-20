# Trace a large test asset to its imports

Use one project and one representative test file. Keep the environment, setup files, mocks, dependency bundling and build options from the original run. Note the asset path and emitted bytes in that test's bundle coverage report. A large project total alone gives no indication of which import to investigate.

## Get the module graph for the same build

Use existing Rspack stats or an Rsdoctor module graph if available. Otherwise add this temporary plugin to the selected project's existing `tools.rspack` callback. Each child compiler writes a separate file. Reading stats can itself raise RSS, so collect the graph on the narrowed test and measure performance separately.

```js
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const importGraph = {
  apply(compiler) {
    compiler.hooks.done.tap('TraceTestImports', (stats) => {
      const graph = stats.toJson({
        all: false,
        assets: true,
        chunks: true,
        ids: true,
        modules: true,
        nestedModules: true,
        reasons: true,
        modulesSpace: Infinity,
      });
      const dir = mkdtempSync(join(tmpdir(), 'rstest-imports-'));
      const file = join(dir, 'stats.json');
      writeFileSync(file, JSON.stringify(graph));
      console.log('Test import graph:', file);
    });
  },
};

// Inside tools.rspack(config):
// (config.plugins ??= []).push(importGraph);
```

## Identify the import that contributes the bytes

1. Match the reported asset to `stats.assets[].name` relative to the compiler output directory. Use its chunk IDs to select modules from the same compilation. Rank candidates by module size. For concatenated modules, inspect nested modules under the matching parent. A module's stats size helps rank candidates; use emitted asset bytes for the before/after comparison.
2. Start with a large module's `issuerPath` and append the module itself. Confirm each hop against its incoming `reasons`: match the parent's `moduleIdentifier`, inspect `userRequest`, dependency type and `loc`, and check the import or re-export in source. An issuer path is one route; if it starts at another entry or there are multiple importers, follow active incoming reasons back to the selected test, setup file or generated entry. Track visited identifiers for cycles. Record other live paths that could keep the module in the bundle.
3. Use the matching raw V8 ranges to explain how the test used the generated code. An export getter can execute while the function it returns has a zero count. Shared and dynamic chunks may serve other tests; keep the conclusion scoped to the measured test.
4. If a narrower equivalent import is available, try it in isolation and rerun the same test with the same coverage settings. Compare total emitted bytes for the test and check which module or chunk disappeared. A chunk can be renamed or merged, so disappearance of a filename alone is insufficient. If the change would alter test semantics, report the observed path and size and leave potential savings unverified. Remove the diagnostic plugin and its temporary stats after extracting the evidence.

Report the test or setup entry, the import chain, the specific import site, and the byte change you measured. For example: `tests/read.test.js → select.js → catalog/index.js → catalog/large.js`. In a controlled fixture the registry imported the full catalog on line 2 even though the test used only the quick reader. Importing that reader directly kept the test passing and reduced its assets from 930,680 to 22,227 bytes.
