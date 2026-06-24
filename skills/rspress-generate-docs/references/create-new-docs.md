# Create New Docs

Use this path when the current project has no existing Rspress documentation site.

1. **Understand the project from source**
   - Read the root `README.md` and main `package.json`.
   - Identify the project type: library, CLI tool, application, plugin, monorepo package, etc.
   - Read public source entry points, exported types, examples, and representative tests to understand the user-facing surface.
   - Determine the target audience and what to document: getting started, configuration, API reference, CLI commands, examples, migration notes, or plugin usage.
   - Cross-check Rspress basics against the official docs when choosing structure or syntax:
     - Quick start: <https://rspress.rs/guide/start/getting-started>
     - Conventional route: <https://rspress.rs/guide/basic/conventional-route>
     - Frontmatter: <https://rspress.rs/guide/use-mdx/frontmatter>

2. **Choose the docs site location**
   - If the repository already has a conventional docs directory (`docs/`, `doc/`, `website/`, `site/`), prefer reusing it.
   - Otherwise, propose a short list of options to the user, such as `website/`, `docs/`, or `site/`, and ask which to use.
   - For monorepos, place the docs site so it can reference workspace packages without crossing too many directory boundaries.

3. **Scaffold Rspress v2**
   - See the official getting-started guide for the latest creation steps:
     - <https://rspress.rs/guide/start/getting-started>
   - Check the create package major before running the scaffold:

     ```bash
     npm view create-rspress@latest version
     ```

   - If the version is `2.x`, scaffold with the package manager used by the repo. Run one command that matches the detected package manager:

     ```bash
     # interactive (recommended for first-time setup)
     pnpm create rspress@latest
     yarn create rspress@latest
     npm create rspress@latest
     bun create rspress@latest

     # or non-interactive, e.g. for CI/automation
     pnpm dlx create-rspress@latest my-docs --template basic-theme --tools rslint,prettier
     yarn dlx create-rspress@latest my-docs --template basic-theme --tools rslint,prettier
     npx -y create-rspress@latest my-docs --template basic-theme --tools rslint,prettier
     bun x create-rspress@latest my-docs --template basic-theme --tools rslint,prettier
     ```

   - If `latest` is not `2.x`, do not use a v1 scaffold. Use a current 2.x create package with the detected package manager, such as `<package-manager> create rspress@2`, or pin a known 2.x version.
   - Prefer the detected package manager for installs and scripts. Do not introduce a second package manager or extra lockfile into an existing workspace.
   - Pick a template that matches the project:
     - `basic` — minimal site with the default theme.
     - `basic-theme` — adds a `theme/` folder for customization.
     - `i18n` — multilingual English/Chinese setup.
     - `i18n-theme` — multilingual setup with a theme folder.
   - If the project uses Rslib, follow the Rslib + Rspress integration guide instead of the generic scaffold:
     - <https://rslib.rs/guide/advanced/rspress.md>

4. **After scaffolding**
   - Install dependencies and verify the dev server starts:

     ```bash
     cd <docs-project>
     <package-manager> install
     <package-manager> run dev
     ```

   - Check the current Node.js requirement from the official Rspress docs or the installed `rspress` / `@rspress/core` package's `engines.node` field. Compare it with the repo's configured Node version and surface any mismatch before proceeding.
   - Default build output goes to `doc_build/`. Keep it out of source control unless the repository already commits it.

5. **Replace starter content**
   - Remove placeholder pages that do not describe the project.
   - Write source-backed pages from the project README, package exports, public types, examples, and tests.
   - Add `title` and `description` frontmatter to each page.
   - Configure navigation with `_nav.json` (top navbar) and `_meta.json` (sidebar) where the generated structure needs explicit labels or order. See [doc-structure-conventions.md](doc-structure-conventions.md) for examples.
   - Follow official Rspress guidance for content features before inventing custom patterns:
     - MDX and React components: <https://rspress.rs/guide/use-mdx/components>
     - Code blocks: <https://rspress.rs/guide/use-mdx/code-blocks>
     - Links: <https://rspress.rs/guide/use-mdx/link>
     - Static assets: <https://rspress.rs/guide/basic/static-assets>

6. **Wire project commands**
   - Add or reuse scripts for docs development and build, such as `docs:dev` and `docs:build`, following the repo's package manager and workspace conventions.
