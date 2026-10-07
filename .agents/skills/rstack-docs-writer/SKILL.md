---
name: rstack-docs-writer
description: Write or revise Markdown and MDX documentation, including READMEs, guides, and Rspress-based docs.
metadata:
  internal: true
---

# Rstack docs writer

Follow the project's existing documentation conventions.

## Writing

- Explain user-facing behavior concisely, adding details and examples only when they help users configure or use the feature.
- Keep common abbreviations such as `dev server`.
- Keep documentation in sync across locales when changing content. Use English as the default language unless the project specifies another.
- Use sentence-case headings.

## Page descriptions

Rspress reuses a page's frontmatter `description` in search metadata and `llms.txt`. Write it to help readers and agents choose the right page for a task.

- Read the page's headings, relevant content, and limitations before summarizing it. Describe the page's scope, not just its first paragraph, one example, or an isolated warning.
- Name the concrete API, technology, or task and the topics that distinguish this page. Include version requirements, experimental status, or environment restrictions when they affect applicability.
- Distinguish related pages, such as build cache configuration versus the plugin cache API, or stats configuration versus the Stats object API.
- Use a concise, complete plain-text sentence. Avoid truncated text, marketing language, and generic templates such as "setup, configuration, integration details, and best practices." Do not add unsupported topics or filler to meet a character count.
- Match the page's language. Keep translated descriptions equivalent in scope while checking each locale's actual content.
- During description audits, revise existing misleading, generic, or truncated descriptions as well as filling gaps. Preserve descriptions that already identify the page clearly.
- If the underlying content is outdated or contradictory, flag or address that issue within the task's scope; do not invent current behavior in the description.

Examples:

| Page             | Description                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| JSON guide       | Import JSON files using default imports, named imports where supported, and import attributes.    |
| Stats hooks      | Customize stats generation and text output with StatsFactory and StatsPrinter hooks.              |
| Plugin cache API | Cache data across compilations in JavaScript plugins with getCache, cache identifiers, and etags. |

Edit descriptions in page frontmatter rather than generated indexes. For `llms.txt` updates, inspect the generated index to confirm the revised descriptions appear correctly. Keep index restructuring separate unless it is part of the requested task.

## Heading anchors

- Prefer Rspress's default anchors for headings in the default locale; preserve intentional existing custom IDs.
- Determine generated anchors from heading `id` attributes: run the project's docs dev command and inspect the rendered browser DOM, or run its docs build command and inspect the generated HTML.
- Match headings in other locales to the default locale's anchors, using the project's locale mapping to pair pages. Add custom IDs where defaults differ; remove redundant IDs only if anchors stay unchanged.
- Escape custom IDs in MDX: `## Localized heading \{#default-locale-anchor}`.
- When anchors change, update corresponding IDs across locales and affected Markdown links and JSX `href` attributes. Check target pages before replacing hashes.
- Check changed links against their target headings.
