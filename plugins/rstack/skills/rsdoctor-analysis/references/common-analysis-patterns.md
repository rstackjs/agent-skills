# Common Analysis Patterns

Use this reference for common Rspack/Webpack bundle analysis questions after locating `rsdoctor-data.json`.

## ROI-Based Lever Selection

Use this pattern before choosing detailed analysis commands. The goal is to find the biggest measured cost bucket first, then select the smallest follow-up that can prove or fix that bucket.

Recommended triage order:

1. Compare assets/media, top packages/modules, duplicate or cross-chunk cost, retained tree-shaking waste, and build-time cost.
2. Pick the largest bucket with a plausible project-side fix.
3. Fetch only the narrow supporting evidence required for that bucket.
4. Defer issuer/reference-chain tracing until it will change ownership, confidence, or the recommended fix.
5. If the largest bucket is expected or structurally required, call it out as a wall and move to the next meaningful bucket.

Lever map:

| Dominant bucket           | High-ROI first pass                                                                                               | Lower-ROI or second pass                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Assets/media              | Compress images, convert formats, deduplicate repeated assets, subset fonts, lazy-load non-critical media         | JS tree-shaking work that saves only tens of KB                             |
| One or few large packages | Check direct dependency necessity, lighter alternatives, deep imports, async boundaries, or route-level splitting | Broad package-list browsing without a top offender                          |
| Duplicate packages        | Use `packages duplicates` / E1001 evidence, then resolve compatible versions or alias deliberately                | Reference-chain tracing before the duplicate size is proven material        |
| Cross-chunk duplication   | Inspect E1002/cross-chunk summaries, then consider `splitChunks`/cache group changes or shared vendor extraction  | Splitting small shared modules that add request overhead                    |
| Retained modules          | Start with emitted CJS/barrel/side-effects rows sorted by gzip size                                               | Deleting source that is already eliminated by the bundler                   |
| Build-time cost           | Use loader/plugin/directories timing and optimize the measured slow path                                          | Build-performance advice when the user asked only about shipped bundle size |

Recommendation rules:

- Prefer `gzipSize` for shipped-user cost and `parsedSize` for parse/execute or code-volume discussions.
- For Webpack/Rspack chunk recommendations, distinguish initial/entry chunks from async chunks. A large async chunk is usually lower priority than a large initial chunk unless the user asks about that route or interaction.
- For package replacement advice, require direct dependency evidence or clear ownership. Do not recommend replacing an indirect package just because it appears in `packageGraph`.
- For duplicate-package advice, mention compatibility risk when versions cross major/minor boundaries or when packages may ship resources as side effects.
- For retained-module advice, include the category (`cjs`, `barrel`, `side-effects`) and the largest concrete paths before suggesting config or source changes.
- Stop when the likely savings are below the user's stated goal or clearly smaller than another measured bucket.

## Similar Packages

Use direct dependency package data to inspect similar packages. Start with `packages direct-dependencies` or `query packages_direct_dependencies`, then check known package families and other potentially similar packages.

Suggested flow:

1. Fetch direct dependency package data with `packages direct-dependencies` or `query packages_direct_dependencies`. Use `--filter` fields for package name, version, issuer/dependency relation, and size when available.
2. Treat this direct dependency list as the replacement-candidate set. Do not make replacement recommendations from indirect package-only evidence.
3. Check the known families below. The presence of one package from a family is fine; only consider replacement when multiple packages from the same family are present.
4. After known-family checks, inspect the direct dependency list for other potentially similar packages not listed below. Treat these as candidates only when package purpose overlaps clearly; avoid speculative replacement advice.
5. Use `packages similar` or `query packages_similar` as an additional signal, not the only source of evidence.

Similar package families:

1. `lodash`, `lodash-es`
   - Consider migrating from `lodash` to `lodash-es` for better tree-shaking support when both are present.
2. `dayjs`, `moment`, `date-fns`, `js-joda`
   - Consider replacing `moment` with `dayjs` for smaller bundle size when both are present and project requirements allow it.
3. `antd`, `material-ui`, `semantic-ui-react`, `arco-design`
4. `axios`, `node-fetch`
5. `redux`, `mobx`, `zustand`, `recoil`, `jotai`
6. `chalk`, `colors`, `picocolors`, `kleur`
7. `fs-extra`, `graceful-fs`

If there are no similar packages, simply say there are no similar packages. Do not list packages that merely exist in the project.

Keep the response simple: name only coexisting known-family packages or other direct-dependency candidates with clear overlap, explain why coexistence is worth reviewing, and give one replacement direction if the evidence supports it.

## Media Asset Analysis

Use `assets media` or `bundle optimize` when checking oversized image, font, or video assets. Return recommendations only for assets that are actually oversized or relevant to the user's question.

Image thresholds:

- Mobile: one image file should ideally be under `60 KB`; Base64 SVG should ideally be under `7 KB`.
- PC: one image file should ideally be under `200 KB`; Base64 SVG should ideally be under `20 KB`.

Image recommendations:

- Compress large images with image compression tools such as `@rsbuild/plugin-image-compress` (`svgo` for SVG and `@napi-rs/image` for other images).
- Optimize SVG paths with tools such as SVGO.
- Consider whether SVG is necessary for the asset.
- Choose formats by compression characteristics:
  - PNG works best for images with few colors and sharp boundaries, such as text or simple patterns.
  - JPG works best for natural images with gradients and irregular transitions, such as landscapes and portraits.
  - Base64 is suitable for important small images that should avoid extra requests and render immediately. Base64 increases binary size by about one third, but after gzip the increase is usually no more than about 10%.

Font thresholds:

- Prefer `.woff2`.
- Keep a single font file under `100 KB` when possible.
- Keep total font size under `300 KB` for the page, and under `200 KB` for mobile when possible.
- Avoid font formats other than `ttf`, `woff`, and `woff2` unless there is a compatibility requirement.

Font recommendations:

- Prefer system fonts when custom fonts are not required.
- Use `font-display: swap` or `@font-face unicode-range` for more efficient loading.
- Ensure server-side Gzip or Brotli compression is enabled.
- Consider variable fonts when they replace multiple weight or width files.

Video thresholds:

- Keep a single video file under `500 KB` when possible.
- Keep total video resources loaded on a page under `1 MB` when possible.

Video recommendations:

- Compress video files with tools such as HandBrake or FFmpeg.
- Use MP4 (H.264) as the compatibility default.
- Use WebM (VP9) when modern-browser compression benefits justify it.
- Lazy-load non-critical videos.
- Use HLS or DASH for long videos.
- Remove unused videos.
- Tune `preload`:
  - `none`: do not download until playback starts; useful for videos unlikely to be played.
  - `metadata`: downloads metadata only, often around 3% of file size.
  - `auto`: downloads the full video; use only when playback is very likely.

## Bundle Optimize

Use `bundle optimize` / `build optimize` as an aggregate optimization pass. It can combine evidence from:

- Duplicate package rules (`getRuleInfo` / `errors list` / rule details).
- Similar package checks (`packages similar` / `query packages_similar`).
- Media asset checks (`assets media`).
- Chunk checks (`chunks list`, `chunks large`, or chunk details) for oversized resources and `splitChunks` recommendations.

Do not run `bundle optimize` / `build optimize` in the default analysis path. Use it only for a user-requested optimization deep dive or when the compact default evidence set is missing required fields.

When using it, keep output compact with `--compact`, narrow `--filter` fields, and pagination options such as `--side-effects-page-size 10`. If the command still returns thousands of lines, stop and switch to narrower supporting commands.

Do not treat aggregate output as enough by itself when the recommendation needs concrete evidence. Fetch the narrow supporting data before recommending a config or dependency change.

## Build Performance

Use these as short recommendation candidates when Rsdoctor evidence points to build-time cost, loader cost, too many modules, or slow dev rebuilds. Source: [Rsbuild build performance guide](https://rsbuild.rs/zh/guide/optimization/build-performance).

- Start with build performance analysis. Use measured bottlenecks before recommending config changes. Use Rsdoctor loader costs data.
- General improvements: upgrade Rsbuild, enable `performance.buildCache` for faster rebuilds, reduce module count, and keep Tailwind CSS v3 `content` narrow and correct.
- Tooling choices: prefer SWC over Babel transforms, avoid Less-heavy pipelines when possible, and prefer faster minification such as Rsbuild/Rspack SWC minification over Terser when compatible.
- Sass handling: do not send already-built `node_modules/**/*.css` through `sass-loader`; prefer third-party `dist/*.css` outputs when available. Compile third-party `.scss` / `.sass` only when Sass source features are required, such as variables, mixins, functions, or theme customization, and use an allowlist for those packages instead of all `node_modules`.
- Less projects: if many Less files are present, consider `@rsbuild/plugin-less` parallel compilation.
- Development mode: consider `dev.lazyCompilation`, Rspack `experiments.nativeWatcher`, cheaper or disabled dev source maps, and a narrower development Browserslist.
- Rsdoctor loader evidence: if `sass-loader` time is concentrated in third-party package directories and those packages ship CSS artifacts, recommend importing the CSS artifact or narrowing Sass rule `include` to app source plus specific allowlisted theme packages.
- Call out tradeoffs: development Browserslist and source map changes can make dev output differ from production or reduce debugging detail.

## Retained Module Tree-shaking Analysis

Use `tree-shaking retained-modules` for first-pass tree-shaking evidence when the goal is to find retained emitted modules by reason category. Prefer it over broad `tree-shaking summary` when the user asks for top retained modules, CommonJS retention, barrel imports, side effects, or gzip-size priority.

Recommended first-pass command shape:

```bash
rsdoctor-agent tree-shaking retained-modules \
  --data-file dist/rsdoctor-data.json \
  --emitted-only \
  --category cjs,barrel,side-effects \
  --sort gzipSize \
  --limit 10 \
  --filter id,path,packageName,version,category,size,chunks,bailoutReason,recommendation
```

Guidance:

1. Keep `--emitted-only` by default so findings map to shipped bundle impact.
2. Use `--category cjs,barrel,side-effects` for optimization scans; narrow `--category` when the user asks about one class.
3. Sort by `gzipSize` for bundle impact, unless the user asks for source or parsed size.
4. Keep `--limit` bounded. Use `--limit 10` for default analysis. Increase to `50` only for user-requested deep dives.
5. Do not add `--compact`; `tree-shaking retained-modules` output size is controlled with `--limit` and `--filter`.
6. Report rows as `Path | Package | Category | Gzip/Parsed Size | Chunks | Bailout | Recommendation`.
7. Treat results as first-pass evidence. Use `modules issuer` only after the user asks to trace who imported a retained module.

## Common Questions

### Why is a module not tree-shaken?

Example: "Why is `node_modules/rc-tree/lib/util.js` not tree-shaken?"

- Start with `tree-shaking retained-modules` filtered to id, path, package, category, size, chunks, bailout reason, and recommendation when the module appears in emitted output.
- Use `tree-shaking summary` only when retained modules do not include the needed field or the question needs broader aggregate context.
- Return the module's `bailoutReason`.
- Explain the bailout in plain language.
- Show `issuerPath` only when the user asks for chain tracing or when it is necessary to explain the issue.

### Who imported a module?

Example: "Who imported `lodash-es/constant.js`?"

- Use module lookup by path, then issuer/import-chain data.
- Show the dependency chain using arrow notation or a tree.

### Show modules with side effects

Example: "Show all modules with side effects."

- Prefer `tree-shaking retained-modules --emitted-only --category side-effects` for emitted side-effect modules.
- Fall back to `tree-shaking summary` or the relevant module-side-effects command only when retained-module output is insufficient.
- Filter to module id, path, package, size, chunks, bailout reason, and recommendation.
- List modules with non-empty `bailoutReason` containing `side_effects`.
- Use `--limit 10` for default output. Increase only after user confirmation.
- If falling back to `tree-shaking summary` or `modules side-effects`, use `--page-size 10` or `--side-effects-page-size 10`, keep the same narrow fields, and stop expanding when one command exceeds `5k` tokens or `500 KB` raw output.
- Sort by size, give priority to the largest emitted modules.

### Why is a package duplicated?

Example: "Why is package X duplicated?"

- Use duplicate package rule data (`E1001` / `E1002`) and package graph fields.
- Show which chunks and modules contain the duplicate versions.
- Explain the dependency path if the user asks to continue chain tracing.

### Which modules are not tree-shaken because of side effects?

- Use the E1007 rule results directly to identify modules that are not tree-shaken due to side effects. By `tree-shaking summary`.
- If further details are needed, you may also use `tree-shaking retained-modules --emitted-only --category side-effects` and filter to module id, path, package, size, chunks, bailout reason, and recommendation.
- List modules with `bailoutReason` containing `side_effects`.
- Use `--limit 10` by default and the same `5k` token / `500 KB` raw-output stop rule for fallback commands.
- Show `issuerPath` when needed to identify the import source.

## Output Style

- For dependency chains, use a tree or arrow notation.
- For module details, use a table or key-value list.
- For explanations, use concise, plain language.
- Avoid listing all packages or assets when the finding is empty.
