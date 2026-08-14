# SplitChunks Repo Behavior

This file is the source-backed reference for [SKILL.md](https://github.com/rstackjs/agent-skills/blob/main/skills/rspack-split-chunks/SKILL.md).

## 1. Repo defaults vs recommended production baseline

Rspack's built-in defaults are defined in [packages/rspack/src/config/defaults.ts](https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts).

Key defaults:

- `chunks: "async"` at [defaults.ts#L1046](https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts#L1046)
- `minChunks: 1` at [defaults.ts#L1048](https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts#L1048)
- `minSize: 20000` in production, `10000` otherwise at [defaults.ts#L1049](https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts#L1049)
- `maxAsyncRequests` and `maxInitialRequests`: `30` in production, `Infinity` otherwise at [defaults.ts#L1052](https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts#L1052) and [defaults.ts#L1055](https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts#L1055)
- `automaticNameDelimiter: "-"` at [defaults.ts#L1058](https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts#L1058)
- `cacheGroups.default` with `minChunks: 2` and `reuseExistingChunk: true` at [defaults.ts#L1061](https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts#L1061)
- `cacheGroups.defaultVendors` matching `node_modules` with `reuseExistingChunk: true` at [defaults.ts#L1067](https://github.com/web-infra-dev/rspack/blob/main/packages/rspack/src/config/defaults.ts#L1067)

Recommended production baseline in the skill is different from the built-in default:

- built-in default: safer generic fallback
- recommended app baseline: `chunks: "all"` for better dedupe across both initial and async chunks

## 2. `name` changes grouping, not just filenames

The core behavior is in [crates/rspack_plugin_split_chunks/src/plugin/module_group.rs](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/module_group.rs).

When a module matches a cache group, `merge_matched_item_into_module_group_map` computes the module-group key.

If `name` exists:

- the key is `cache_group.key + chunk_name` at [module_group.rs#L577](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/module_group.rs#L577)

If `name` does not exist:

- the key uses the selected chunk combination hash at [module_group.rs#L582](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/module_group.rs#L582)

Effect:

- same `name` collapses otherwise separate chunk combinations into one `ModuleGroup`
- that can force broader sharing than the user expects

This is why a broad manual `name: "vendors"` can create over-shared chunks.

## 3. Named chunks are reused by name

Chunk creation/reuse is handled in [crates/rspack_plugin_split_chunks/src/plugin/chunk.rs](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/chunk.rs).

If `module_group.chunk_name` exists:

- Rspack first looks for an existing named chunk at [chunk.rs#L125](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/chunk.rs#L125)
- if found, it reuses that chunk
- otherwise it creates a named chunk at [chunk.rs#L134](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/chunk.rs#L134)

If there is no `name`, only then does `reuseExistingChunk` try to reuse a chunk with the same module set at [chunk.rs#L160](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/chunk.rs#L160).

Implication:

- fixed `name` is a stronger form of coupling than `reuseExistingChunk`
- `reuseExistingChunk` is opportunistic
- `name` is explicit merging

## 4. `splitChunks` does not decide JS execution order

After extracting a chunk, Rspack wires the new chunk back to each original chunk in `split_from_original_chunks` at [chunk.rs#L235](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/chunk.rs#L235).

That means splitChunks changes the chunk graph, and the runtime follows that graph when loading dependencies.

Inference from the implementation:

- splitChunks is about graph topology and fetch boundaries
- execution order remains runtime-driven, not user-declared via splitChunks
- the plugin itself runs in optimize-chunks stage at [plugin/mod.rs#L305](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/mod.rs#L305), so it is not the mechanism that performs tree shaking

## 5. `idHint` is safer than `name` for identity hints

After a chunk is chosen, the plugin adds `idHint` to chunk id-name hints at [plugin/mod.rs#L215](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/mod.rs#L215).

`idHint` participates in naming/id presentation, but it is not used to build the `ModuleGroup` key.

This makes `idHint` a safer tool when the user wants chunk identity hints without changing grouping behavior.

## 6. `enforce: true` removes several guardrails

Normalization from JS options to Rust plugin options happens in [crates/rspack_binding_api/src/raw_options/raw_split_chunks/mod.rs](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_binding_api/src/raw_options/raw_split_chunks/mod.rs).

For cache groups with `enforce: true`:

- overall `minSize` is not merged in at [raw_split_chunks/mod.rs#L157](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_binding_api/src/raw_options/raw_split_chunks/mod.rs#L157)
- overall `minSizeReduction` is not merged in at [raw_split_chunks/mod.rs#L163](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_binding_api/src/raw_options/raw_split_chunks/mod.rs#L163)
- overall `maxAsyncSize` / `maxInitialSize` constraints are treated differently at [raw_split_chunks/mod.rs#L171](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_binding_api/src/raw_options/raw_split_chunks/mod.rs#L171) and [raw_split_chunks/mod.rs#L179](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_binding_api/src/raw_options/raw_split_chunks/mod.rs#L179)
- `minChunks` falls back to `1` when enforced at [raw_split_chunks/mod.rs#L188](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_binding_api/src/raw_options/raw_split_chunks/mod.rs#L188)

This matches the high-level guidance: `enforce` is powerful and easy to misuse.

## 7. `maxSize` is a second-stage deterministic split

The `maxSize` algorithm lives in [crates/rspack_plugin_split_chunks/src/plugin/max_size.rs](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/max_size.rs).

Important implementation details:

- it runs after chunk extraction, inside `ensure_max_size_fit`, at [max_size.rs#L469](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/max_size.rs#L469)
- it computes module keys from relative paths plus a short hash at [max_size.rs#L232](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/max_size.rs#L232)
- it sorts modules by that key before grouping at [max_size.rs#L278](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/max_size.rs#L278)
- it splits groups near the weakest similarity boundary at [max_size.rs#L381](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/max_size.rs#L381)
- it can hash away path info when `hidePathInfo` is enabled at [max_size.rs#L625](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/max_size.rs#L625)

The similarity function is simple character-distance scoring at [max_size.rs#L456](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/max_size.rs#L456), so similar path prefixes tend to stay together.

Practical meaning:

- `maxSize` is for subdividing a chunk, not for creating a global shared chunk policy
- path locality matters
- the result is deterministic and generally stable enough for production use

## 8. `usedExports` affects chunk combinations

The combinator prepares chunk combinations in two modes inside [plugin/module_group.rs](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/module_group.rs):

- by plain chunk sets at [module_group.rs#L162](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/module_group.rs#L162)
- by runtime-specific used exports at [module_group.rs#L197](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/module_group.rs#L197)

When `usedExports` is enabled, the grouping can stay more runtime-specific.

When it is disabled, more modules may be shared together because the grouping ignores those usage distinctions.

This is still not tree shaking. It only changes grouping granularity.

## 9. Why `chunks: "all"` is often the better application baseline

This is a recommendation, not the code default.

Combined reading of the defaults and the plugin behavior suggests:

- the built-in cache groups already cover duplicate-module extraction and vendor extraction
- `chunks: "all"` lets those rules consider both initial and async chunk boundaries
- because the runtime still follows chunk dependencies, this usually preserves "fetch only what the current page needs"
- the main thing that breaks that property is manual forced merging, especially fixed `name`

So for application builds, the skill recommends:

- start with `chunks: "all"`
- keep the default cache groups
- avoid `name` unless the user consciously wants one shared asset

## 10. Why duplicate modules can still exist

Duplicate modules are not automatically a bug.

The plugin explicitly removes or rejects split candidates when they do not satisfy size constraints:

- `remove_min_size_violating_modules` drops candidates below `minSize` at [min_size.rs#L44](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/min_size.rs#L44)
- `check_min_size_reduction` rejects candidates whose total reduction is too small at [min_size.rs#L95](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/min_size.rs#L95)
- `ensure_min_size_fit` removes invalid module groups at [min_size.rs#L121](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/min_size.rs#L121)
- `ensure_max_request_fit` can also reject a candidate when request budgets would be exceeded at [max_request.rs#L12](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/max_request.rs#L12)

Practical meaning:

- a very small shared module may remain duplicated because extracting it would fail `minSize`
- even with `minSize: 0`, `minSizeReduction` or request limits may still block the split
- if the user insists on extracting it, they need to lower the relevant threshold or intentionally override guardrails

## 11. Tree shaking is orthogonal to splitChunks

From the plugin stage and responsibilities:

- splitChunks runs during chunk optimization at [plugin/mod.rs#L305](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/mod.rs#L305)
- it groups and regroups modules into chunks; it does not decide whether a module/export is dead
- `splitChunks.usedExports` only changes runtime-specific grouping, as shown in [module_group.rs#L197](https://github.com/web-infra-dev/rspack/blob/main/crates/rspack_plugin_split_chunks/src/plugin/module_group.rs#L197)

So the clean mental model is:

- tree shaking decides what is kept
- splitChunks decides how kept modules are partitioned into chunks

## 12. CSS order is a separate caveat

For JavaScript, the guidance above stands: splitChunks does not change execution order semantics.

For CSS, there is a separate caveat documented in [web-infra-dev discussion #12](https://github.com/orgs/web-infra-dev/discussions/12):

- the discussion shows that extracted CSS order can become unstable after splitChunks rewrites chunk groups
- this is specifically discussed for `mini-css-extract-plugin` and `experiments.css`
- the same discussion contrasts this with `style-loader`, where CSS insertion follows JS execution order more directly

Useful lines from that discussion:

- CSS order can become inconsistent with import order after splitChunks at [discussion #12 lines 224-256](https://github.com/orgs/web-infra-dev/discussions/12)
- `style-loader` keeps insertion order aligned with import/execution order at [discussion #12 lines 284-286](https://github.com/orgs/web-infra-dev/discussions/12)
- extracted CSS flows are the problematic case at [discussion #12 lines 287-292](https://github.com/orgs/web-infra-dev/discussions/12)
- splitChunks is described there as further splitting of chunks, separate from JS code splitting semantics, at [discussion #12 lines 297-305](https://github.com/orgs/web-infra-dev/discussions/12)
