# Common Analysis Patterns

Use this reference for common Rspack/Webpack bundle analysis questions after locating `rsdoctor-data.json`.

## Similar Packages

Use direct dependency package data to inspect similar packages. Start with `packages direct-dependencies` or `query packages_direct_dependencies`, then check known package families and other potentially similar packages.

Suggested flow:

1. Fetch direct dependency package data with `packages direct-dependencies` or `query packages_direct_dependencies`. Use `--filter` fields for package name, version, issuer/dependency relation, and size when available.
2. Treat this direct dependency list as the replacement-candidate set. Do not make replacement recommendations from transitive package-only evidence.
3. Check the known families below. The presence of one package from a family is fine; only consider replacement when multiple packages from the same family are present.
4. After known-family checks, inspect the direct dependency list for other potentially similar packages not listed below. Treat these as candidates only when package purpose overlaps clearly; avoid speculative replacement advice.
5. Use `packages similar` or `query packages_similar` as an additional signal, not the only source of evidence.

Similar package families:

1. `lodash`, `lodash-es`, `string_decode`
   - Consider migrating from `lodash` to `lodash-es` for better tree-shaking support when both are present.
2. `dayjs`, `moment`, `date-fns`, `js-joda`
   - Consider replacing `moment` with `dayjs` for smaller bundle size when both are present and project requirements allow it.
3. `antd`, `material-ui`, `semantic-ui-react`, `arco-design`
4. `axios`, `node-fetch`
5. `redux`, `mobx`, `Zustand`, `Recoil`, `Jotai`
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

- Generate font subsets with tools such as Glyphhanger or Font Subsetter.
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

Do not treat aggregate output as enough by itself when the recommendation needs concrete evidence. Fetch the narrow supporting data with `--filter` before recommending a config or dependency change.

## Common Questions

### Why is a module not tree-shaken?

Example: "Why is `node_modules/rc-tree/lib/util.js` not tree-shaken?"

- Use `tree-shaking summary` with a filter that keeps module path, bailout reason, and issuer/import-chain fields.
- Return the module's `bailoutReason`.
- Explain the bailout in plain language.
- Show `issuerPath` only when the user asks for chain tracing or when it is necessary to explain the issue.

### Who imported a module?

Example: "Who imported `lodash-es/constant.js`?"

- Use module lookup by path, then issuer/import-chain data.
- Show the dependency chain using arrow notation or a tree.

### List modules in a chunk

Example: "List all modules in chunk `123`."

- Use chunk lookup by id.
- Return module paths in a compact table or list.
- Include size fields only if the user asks about weight or optimization priority.

### Show modules with side effects

Example: "Show all modules with side effects."

- Use `tree-shaking summary` or the relevant module-side-effects command.
- Filter to module path and bailout reason.
- List modules with non-empty `bailoutReason` containing `side_effects`.

### Why is a package duplicated?

Example: "Why is package X duplicated?"

- Use duplicate package rule data (`E1001` / `E1002`) and package graph fields.
- Show which chunks and modules contain the duplicate versions.
- Explain the dependency path if the user asks to continue chain tracing.

### Which modules are not tree-shaken because of side effects?

- Use `tree-shaking summary`.
- Filter to module path, bailout reason, and issuer path.
- List modules with `bailoutReason` containing `side_effects`.
- Show `issuerPath` when needed to identify the import source.

## Output Style

- For dependency chains, use a tree or arrow notation.
- For module details, use a table or key-value list.
- For explanations, use concise, plain language.
- Avoid listing all packages or assets when the finding is empty.
