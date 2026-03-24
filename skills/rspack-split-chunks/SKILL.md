---
name: rspack-split-chunks
description: >-
  Diagnose and optimize Rspack `optimization.splitChunks` configuration. Use
  this when a user wants better production chunking, safer `chunks: "all"`
  defaults, fewer duplicated modules, better long-term caching, `cacheGroups`
  design help, `maxSize` tuning, or debugging over-fetch caused by `name` and
  forced chunk merging.
---

# Rspack SplitChunks Optimization

Use this skill when the task is to recommend, review, or debug `optimization.splitChunks`. If you are using ESM library, it's not the same algorithm of this skill.

## Default stance

- Distinguish repo defaults from recommended production baselines.
- Rspack's built-in default is `chunks: "async"`, but for most production web apps the best starting point is:

```js
optimization: {
  splitChunks: {
    chunks: "all",
  },
}
```

- Keep the default cache groups unless there is a concrete reason to replace them.
- Treat `name` as a graph-shaping option, not a cosmetic naming option.
- Do not use `splitChunks` to reason about JavaScript execution order or tree shaking. For JS, chunk loading/execution order is preserved by the runtime dependency graph, and tree shaking is decided elsewhere.

Read [`references/repo-behavior.md`](references/repo-behavior.md) when you need the source-backed rationale.

## What To Optimize For

First identify which problem the user actually has:

- duplicated modules across entry or async boundaries
- a route fetching a large shared chunk with mostly unused modules
- too many tiny chunks
- a vendor/common chunk that changes too often and hurts caching
- an oversized async or initial chunk that should be subdivided
- confusion about whether `splitChunks` affects runtime execution order

Do not optimize all of these at once. Pick the primary goal and keep the rest as constraints.

## Workflow

### 1. Start from the safest production baseline

Unless the user already has a measured problem that requires custom grouping, prefer:

```js
optimization: {
  splitChunks: {
    chunks: "all",
  },
}
```

Why:

- it lets splitChunks dedupe modules across both initial and async chunks
- it still only loads chunks reachable from the current entry/runtime
- it usually avoids loading unnecessary modules better than hand-written global vendor buckets

If the existing config disables `default` or `defaultVendors`, assume that is suspicious until proven necessary.

### 2. Audit the config for high-risk knobs

Check these first:

- fixed `name`
- `cacheGroups.*.name`
- `enforce: true`
- disabled `default` / `defaultVendors`
- broad `test: /node_modules/` rules combined with a single global `name`
- `usedExports: false`
- very small `minSize`
- `maxSize` combined with manual global names

### 3. Interpret `name` correctly

Use this rule:

- No `name`: splitChunks can keep different chunk combinations separate.
- Same `name`: matching modules are merged into the same named split chunk candidate.

That means a fixed `name: "vendors"` or `name: "common"` is often the real reason a page starts fetching modules from unrelated dependency chains.

Prefer these alternatives before adding `name`:

- keep `name` unset
- use `idHint` if the goal is filename identity, not grouping identity
- narrow the `test` so the cache group is smaller
- split one broad cache group into several focused cache groups
- rely on `maxSize` to subdivide a big chunk instead of forcing a global name

Use a fixed `name` only when the user explicitly wants one shared asset across multiple entries/routes and accepts the extra coupling.

### 4. Preserve the built-in cache groups by default

Rspack's built-in production-oriented behavior depends heavily on these two groups:

- `default`: extracts modules shared by at least 2 chunks and reuses existing chunks
- `defaultVendors`: extracts `node_modules` modules and reuses existing chunks

These defaults are usually the best balance between dedupe and "only fetch what this page needs".

If you customize `cacheGroups`, do not casually replace these with one manually named vendor bucket.

### 5. Use `chunks: "all"` without fear of breaking execution order

When a module group is split out, Rspack connects the new chunk back to the original chunk groups. That preserves JavaScript loading semantics.

So:

- `splitChunks` changes chunk topology
- the runtime still guarantees dependency loading/execution order
- if execution order appears broken, look for other causes first
- this statement is about JavaScript, not CSS order

### 6. Use `maxSize` as a refinement tool

Use `maxSize`, `maxAsyncSize`, or `maxInitialSize` when the problem is "this shared chunk is too large", not when the problem is "I need a stable vendor chunk name".

Important behavior:

- `maxSize` runs after a chunk already exists
- the split is deterministic
- modules are grouped by path-derived keys and split near low-similarity boundaries
- similar file paths tend to stay together

This is usually safer than forcing one giant named vendor chunk, because it keeps chunk graph semantics while subdividing hot spots.

### 7. Use `usedExports` deliberately

If the user has multiple runtimes/entries and wants leaner shared chunks per runtime, prefer keeping `usedExports` enabled.

If they set `usedExports: false`, expect broader sharing and potentially larger common chunks.

This is still not tree shaking. It only changes how splitChunks groups modules across runtimes.

### 8. Treat `enforce: true` as an escape hatch

`enforce: true` bypasses several normal guardrails. Use it only when the user intentionally wants a split regardless of `minSize`, `minChunks`, and request limits.

If a config looks aggressive and hard to explain, check `enforce` before changing anything else.

## Recommendations By Goal

### Better default production chunking

Recommend:

```js
optimization: {
  splitChunks: {
    chunks: "all",
  },
}
```

Avoid:

- disabling `default`
- disabling `defaultVendors`
- adding `name` before measuring a real problem

### Avoid fetching non-essential modules

Recommend:

- remove fixed `name`
- keep cache groups narrow
- keep `chunks: "all"` if dedupe across initial chunks is still desired
- inspect which routes now depend on a shared chunk after each change

Avoid:

```js
cacheGroups: {
  vendors: {
    test: /[\\/]node_modules[\\/]/,
    chunks: "all",
    name: "vendors",
    enforce: true
  }
}
```

That pattern often creates one over-shared chunk that many pages must fetch.

### Improve caching without over-merging

Recommend:

- keep `name` unset
- use `idHint`
- keep `chunkIds: "deterministic"` or other stable id strategies elsewhere in the config
- split broad groups into smaller focused groups only when the package boundaries are stable and important

Use a fixed `name` only if the user explicitly prefers cache reuse over route isolation.

### Split a large shared chunk

Recommend:

```js
optimization: {
  splitChunks: {
    chunks: "all",
    maxSize: 200000,
  },
}
```

Then tune:

- `maxAsyncSize` when async chunks are the pain point
- `maxInitialSize` when first-load pressure matters more
- `hidePathInfo` if generated part names should not leak path structure

### Keep an intentionally shared chunk

Recommend a named chunk only when the user says something like:

- "all pages should share one React vendor asset"
- "I want one framework chunk for cache reuse across routes"

Even then, call out the tradeoff explicitly:

- better cache hit rate
- more coupling between routes
- a page may fetch modules it does not execute immediately

## Review Checklist

When reviewing a user's config, explicitly answer:

1. Is the goal dedupe, cache stability, request count, or route isolation?
2. Is `chunks: "all"` a better baseline than the current config?
3. Did `name` accidentally turn multiple candidates into one forced shared chunk?
4. Were `default` or `defaultVendors` disabled without a strong reason?
5. Would `idHint` satisfy the naming goal without changing grouping?
6. Is `maxSize` a better fit than a broad manual vendor/common bucket?
7. Does the result still keep each page fetching only reachable chunks?

## Minimal stats setup

When the task includes diagnosis, ask for or generate stats that expose chunk relations:

```js
stats: {
  chunks: true,
  chunkRelations: true,
  chunkOrigins: true,
  entrypoints: true,
  modules: false
}
```

Then compare:

- which entrypoints reference which shared chunks
- whether a change added a new dependency edge from an entry to a broad shared chunk
- whether a large shared chunk exists only because of a fixed `name`

## FAQ

### Why do I still see duplicate modules?

Common reasons:

- the shared candidate is too small, so extracting it would not satisfy `minSize`
- the candidate does not satisfy `minSizeReduction`
- it does not satisfy `minChunks`
- request-budget limits reject the split
- `chunks` / `test` / `cacheGroups` do not actually select the same chunk combination

If the duplicate module is tiny, do not assume this is a bug. Rspack may intentionally keep it in place because splitting it out would create a worse chunk.

### Does splitChunks affect JS execution order?

No.

- `splitChunks` only changes chunk boundaries and dependency edges
- JS loading and execution order are runtime concerns
- if a JS ordering bug appears, investigate runtime/bootstrap, side effects, or app code first

### Does splitChunks affect tree shaking?

No.

- tree shaking is controlled by module-graph analysis such as `sideEffects`, `usedExports`, and dead-code elimination
- `splitChunks` runs later and only reorganizes already-selected modules into chunks
- `splitChunks.usedExports` is only a grouping hint for runtime-specific chunk combinations; it is not tree shaking itself

### Can splitChunks affect CSS order?

Yes, potentially.

- this caveat applies to CSS order, not JS execution order
- extracted CSS flows such as `mini-css-extract-plugin` or `experiments.css` can observe changed final CSS order after splitChunks rewrites chunk groups
- if CSS order is critical, be careful when splitting order-sensitive styles into separate chunks

See [web-infra-dev discussion #12](https://github.com/orgs/web-infra-dev/discussions/12).

## Quick conclusions to reuse

- "Keep `chunks: \"all\"`, keep the default cache groups, and remove `name` unless you intentionally want forced sharing."
- "`name` is not just a filename hint in Rspack splitChunks; it changes grouping behavior."
- "`splitChunks` does not control JS execution order or tree shaking; it only changes chunk topology."
- "`splitChunks` can affect CSS order in extracted-CSS scenarios, so treat CSS as a separate caveat."
- "`maxSize` is the safer tool when the problem is one chunk being too large."
