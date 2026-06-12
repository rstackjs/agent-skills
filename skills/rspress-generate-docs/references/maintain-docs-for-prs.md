# Maintain Docs For PRs

Use this path when a Rspress v2 docs site already exists.

1. **Connect docs work to the change**
   - If a PR already exists, read its title, description, linked issues, and the full PR diff.
   - If no PR exists yet, inspect the current branch diff against the base branch using `git merge-base` and `git diff`.
   - Identify user-facing changes: new APIs, config options, CLI flags, plugins, behavior changes, migration notes, deprecations, examples, or breaking changes.
   - Use the PR title or conventional commit category as one signal, but also exercise independent judgment about whether the change affects users.
   - If the change has no user-facing impact, report that no docs update is needed and explain why.

2. **Update the right pages**
   - Modify existing pages before adding new pages when the change belongs in an established guide or API reference.
   - Add new pages only for new workflows or concepts that need their own navigation entry.
   - Keep examples minimal, runnable, and version-accurate.
   - Add or update `description` frontmatter for every touched or created doc page.
   - Update `_meta.json` whenever a new page should appear in sidebar or navigation. See [doc-structure-conventions.md](doc-structure-conventions.md) for examples.

3. **Respect existing docs conventions**
   - Match the site's language, tone, directory structure, i18n layout, frontmatter style, and MDX component patterns.
   - For i18n sites, update all required locales or explicitly note which locale remains pending.
   - Prefer first-class Rspress options and documented theme APIs over custom workarounds.

4. **Validate the documentation**
   - Run the docs build from the Rspress project directory or through the repo's root script.
   - If docs build is expensive or unavailable, at least validate changed Markdown/MDX structure, links, imports, navigation files, and frontmatter.
