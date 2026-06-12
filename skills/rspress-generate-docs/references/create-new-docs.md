# Create New Docs

Use this path when the current project has no existing Rspress documentation site.

1. **Understand the project from source**
   - Read the root `README.md` and main `package.json`.
   - Identify the project type: library, CLI tool, application, plugin, monorepo package, etc.
   - Read public source entry points, exported types, examples, and representative tests to understand the user-facing surface.
   - Determine the target audience and what to document: getting started, configuration, API reference, CLI commands, examples, migration notes, or plugin usage.

2. **Choose the docs site location**
   - If the repository already has a conventional docs directory (`docs/`, `doc/`, `website/`, `site/`), prefer reusing it.
   - Otherwise, propose a short list of options to the user, such as `website/`, `docs/`, or `site/`, and ask which to use.
   - For monorepos, place the docs site so it can reference workspace packages without crossing too many directory boundaries.

3. **Scaffold Rspress v2**
   - Check the create package major before running the scaffold:

     ```bash
     npm view create-rspress@latest version
     ```

   - If the version is `2.x`, scaffold with:

     ```bash
     npm create rspress@latest
     ```

   - If `latest` is not `2.x`, do not use a v1 scaffold. Use a current 2.x create package instead, such as `npm create rspress@2`, or pin a known 2.x version.
   - Prefer the detected package manager for installs and scripts (`pnpm create rspress@latest`, `yarn create rspress@latest`, etc.).
   - If the project uses Rslib, follow the Rslib + Rspress integration guide instead of the generic scaffold:
     - <https://rslib.rs/guide/advanced/rspress.md>

4. **Replace starter content**
   - Remove placeholder pages that do not describe the project.
   - Write source-backed pages from the project README, package exports, public types, examples, and tests.
   - Add `title` and `description` frontmatter to each page.
   - Configure navigation with `_meta.json` where the generated structure needs explicit labels or order. See [doc-structure-conventions.md](doc-structure-conventions.md) for examples.

5. **Wire project commands**
   - Add or reuse scripts for docs development and build, such as `docs:dev` and `docs:build`, following the repo's package manager and workspace conventions.
   - Keep generated build output out of source control unless the repository already commits it.
