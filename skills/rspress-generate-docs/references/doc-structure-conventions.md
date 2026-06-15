# Documentation structure conventions

Rspress generates navigation automatically when `rspress.config.ts` does not define `nav` or `sidebar`. Control the result with `_nav.json` (top navbar) and `_meta.json` (sidebar).

- Place `_nav.json` at the docs root (or at the i18n language root such as `docs/en/`).
- Place `_meta.json` inside each subdirectory that needs explicit sidebar labels, order, or grouping.
- For clickable directories, add an `index.mdx` (or `index.md`) inside the directory.
- In leaf directories with only files, `_meta.json` can be omitted; Rspress sorts alphabetically. Prefix filenames with numbers such as `1-introduction.mdx` to customize order.

## Example 1: simple Guide + API site

```text
docs/
├── _nav.json
├── guide/
│   ├── _meta.json
│   ├── index.mdx
│   ├── getting-started.mdx
│   └── configuration.mdx
└── api/
    ├── _meta.json
│   ├── index.mdx
    └── commands.mdx
```

`docs/_nav.json`:

```json
[
  { "text": "Guide", "link": "/guide/", "activeMatch": "/guide/" },
  { "text": "API", "link": "/api/", "activeMatch": "/api/" }
]
```

`docs/guide/_meta.json`:

```json
[
  { "type": "file", "name": "index", "label": "Overview" },
  "getting-started",
  "configuration"
]
```

`docs/api/_meta.json`:

```json
[{ "type": "file", "name": "index", "label": "Overview" }, "commands"]
```

## Example 2: site with grouped sections

A larger site can use `dir-section-header` to group related directories in the sidebar.

```text
docs/
├── _nav.json
├── guide/
│   ├── _meta.json
│   ├── start/
│   │   ├── index.mdx
│   │   ├── introduction.mdx
│   │   └── getting-started.mdx
│   ├── basic/
│   │   ├── index.mdx
│   │   └── auto-nav-sidebar.mdx
│   └── advanced/
│       └── custom-theme.mdx
└── api/
    ├── _meta.json
    ├── index.mdx
    └── config/
        ├── _meta.json
        ├── index.mdx
        └── build.mdx
```

`docs/guide/_meta.json`:

```json
[
  { "type": "dir-section-header", "name": "start", "label": "Getting Started" },
  { "type": "dir-section-header", "name": "basic", "label": "Features" },
  { "type": "dir-section-header", "name": "advanced", "label": "Advanced" }
]
```

`docs/api/_meta.json`:

```json
[
  { "type": "section-header", "label": "Overview" },
  { "type": "file", "name": "index", "label": "API Overview" },
  { "type": "section-header", "label": "Config" },
  { "type": "dir", "name": "config", "label": "Config Options" }
]
```

## Example 3: i18n layout

For multilingual sites, place `_nav.json` inside each language root and keep the same directory shape across locales.

```text
docs/
├── en/
│   ├── _nav.json
│   ├── guide/
│   └── api/
└── zh/
    ├── _nav.json
    ├── guide/
    └── api/
```
