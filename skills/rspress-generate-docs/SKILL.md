---
name: rspress-generate-docs
description: Generate or maintain Rspress documentation for a project. Use whenever the user wants to create a new docs site from a project that has no documentation, automatically add docs for user-facing feature work or PRs, or migrate an existing Rspress v1 docs site to v2. Also use when the project uses Rslib and needs documentation integration.
---

# Rspress Generate Docs

Create and maintain Rspress documentation as part of normal project work. Prefer source-backed docs over generic prose: read the code, tests, examples, package metadata, and existing README before writing.

## Workflow

1. **Inspect the project**
   - Locate package files, source entry points, examples, tests, changelogs, and README files.
   - Search for Rspress config files: `rspress.config.ts`, `.js`, `.mjs`, or `.cjs`.
   - Inspect dependencies for `rspress`, `@rspress/core`, and `@rspress/plugin-*`.
   - Detect the package manager and workspace setup from lockfiles (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb`) and `pnpm-workspace.yaml`.
   - If a config exists, resolve the docs root from its `root` option; otherwise check common roots such as `docs/`, `doc/`, `website/`, and `site/`.

2. **Choose the correct path**
   - If no Rspress docs site exists, follow [Create New Docs](references/create-new-docs.md).
   - If a Rspress docs site exists and is v1, follow [Migrate Rspress v1](references/migrate-rspress-v1.md).
   - If a Rspress v2 docs site exists, follow [Maintain Docs For PRs](references/maintain-docs-for-prs.md).

3. **Validate before finishing**
   - Run the docs build from the Rspress project directory or through the repo's root script.
   - The build must pass as the primary success criterion.
   - Fix broken links, missing navigation entries, invalid frontmatter, and failed MDX imports before reporting completion.

## Reference

- [Documentation structure conventions](references/doc-structure-conventions.md) — how `_nav.json` and `_meta.json` work, with concrete examples for Guide/API sites, grouped sections, and i18n layouts.
- [Create New Docs](references/create-new-docs.md) — scaffold a Rspress v2 docs site from an undocumented project.
- [Maintain Docs For PRs](references/maintain-docs-for-prs.md) — update an existing Rspress v2 docs site for feature work.
- [Migrate Rspress v1](references/migrate-rspress-v1.md) — migrate an existing Rspress v1 docs site to v2.
