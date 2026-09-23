---
name: rsbuild-docs
description: 'Use when the user asks about Rsbuild — configuration, plugins, dev server, build optimization, CSS/styling, HTML template, static assets, CLI, JavaScript API, SSR, environment variables, code splitting, migration from webpack/Vite/CRA/Vue CLI, or any Rsbuild-related question. Also use when troubleshooting Rsbuild errors, HMR issues, or build performance problems.'
---

# Rsbuild Docs Assistant

Answer Rsbuild questions by fetching the relevant documentation pages from rsbuild.rs — not the entire docs.

## Steps

### 1. Fetch the documentation index

Fetch the index to discover available pages and their descriptions:

```
https://rsbuild.rs/llms.txt
```

The index format:

```
## Section Name
- [Page Title](/path/to/page.md): brief description
```

### 2. Identify the relevant page(s)

Use the quick topic map below to narrow down candidates, then confirm against the index descriptions.

**Quick topic map:**

| User asks about                                                                          | Look in section                 |
| ---------------------------------------------------------------------------------------- | ------------------------------- |
| What is Rsbuild / getting started / glossary                                             | `Guide` → `start/`              |
| React / Vue / Preact / Svelte / Solid setup                                              | `Guide` → `framework/`          |
| CLI, dev server, output files, static assets, HTML, TypeScript, Web Workers, WASM        | `Guide` → `basic/`              |
| Configure Rspack / Rsbuild / SWC                                                         | `Guide` → `configuration/`      |
| CSS, CSS Modules, CSS-in-JS, Tailwind, UnoCSS                                            | `Guide` → `styling/`            |
| Aliases, env vars, HMR, browserslist, Module Federation, SSR, testing, multi-environment | `Guide` → `advanced/`           |
| Code splitting, bundle size, build performance, inline assets                            | `Guide` → `optimization/`       |
| Migrate from webpack / CRA / Vue CLI / Vite                                              | `Guide` → `migration/`          |
| Debug mode, build profiling, Rsdoctor                                                    | `Guide` → `debug/`              |
| FAQ, common errors, HMR issues                                                           | `Guide` → `faq/`                |
| Upgrading Rsbuild versions                                                               | `Guide` → `upgrade/`            |
| `dev.*` config (assetPrefix, hmr, lazyCompilation, proxy, etc.)                          | `Config` → `dev/`               |
| `resolve.*` config (alias, conditionNames, dedupe, extensions)                           | `Config` → `resolve/`           |
| `source.*` config (entry, define, decorators, include/exclude)                           | `Config` → `source/`            |
| `output.*` config (distPath, filename, externals, sourceMap, minify, cssModules, target) | `Config` → `output/`            |
| `html.*` config (template, title, favicon, meta, tags, mountId)                          | `Config` → `html/`              |
| `server.*` config (port, host, https, proxy, cors, publicDir)                            | `Config` → `server/`            |
| `security.*` config (nonce, SRI)                                                         | `Config` → `security/`          |
| `tools.*` config (rspack, postcss, swc, cssLoader, bundlerChain)                         | `Config` → `tools/`             |
| `performance.*` config (chunkSplit, buildCache, bundleAnalyze, removeConsole)            | `Config` → `performance/`       |
| `moduleFederation.*` config                                                              | `Config` → `module-federation/` |
| Framework plugins (React, Vue, Svelte, Solid, Preact)                                    | `Plugin` → `list/`              |
| Styling plugins (Sass, Less, Stylus), Babel, SVGR                                        | `Plugin` → `list/`              |
| Writing custom plugins, plugin hooks, plugin API                                         | `Plugin` → `dev/`               |
| JavaScript API, Rsbuild instance, types, dev server API                                  | `API`                           |

### 3. Fetch the specific page(s)

Construct the URL by removing the `.md` extension from the path in the index, then prepend the base URL:

```
https://rsbuild.rs{path_without_md_extension}
```

**Examples:**

- `/guide/start/quick-start.md` → `https://rsbuild.rs/guide/start/quick-start`
- `/config/output/filename.md` → `https://rsbuild.rs/config/output/filename`
- `/plugins/list/plugin-react.md` → `https://rsbuild.rs/plugins/list/plugin-react`

Fetch 1–3 pages most relevant to the question.

### 4. Answer the question

Answer based on the fetched content. If the answer spans multiple topics (e.g., config + plugin), fetch both relevant pages. Do not load more than 3 pages per question.

## Important notes

- Always fetch the index first — never guess page paths from memory
- If the index descriptions are insufficient to identify the right page, fetch the most likely candidate and check its content
- If the fetch fails, inform the user and fall back to your existing knowledge, noting it may be outdated
- Rsbuild is powered by Rspack (not webpack directly) — keep this distinction clear when answering
