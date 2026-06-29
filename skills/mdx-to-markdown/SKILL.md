---
name: mdx-to-markdown
description: Convert `.mdx` to portable `.md`, cleaning MDX components, anchors, code titles, table-of-contents links, and root-relative docs links.
---

# MDX to Markdown

## Overview

Use this skill to produce plain Markdown from MDX without requiring the target renderer to understand MDX imports, JSX components, Rspress anchors, or code-block metadata.

## Workflow

1. Identify the source `.mdx` and target `.md` path. If the user gives only a source path, default the output to the same path with `.md`.
2. Inspect the MDX for non-Markdown constructs:
   - YAML frontmatter.
   - top-level `import` lines.
   - custom components such as `<BlogAuthors />` and `<PackageManagerTabs />`.
   - heading anchors like `### Title \{#title}`.
   - standalone HTML anchors like `<a id="title"></a>`.
   - fenced code block titles such as a JavaScript fence with `title="env.js"`.
   - HTML image wrappers such as centered `<div><img ... /></div>`.
3. Run the helper script when the requested conversion matches the default rules:

   ```bash
   node /path/to/skills/mdx-to-markdown/scripts/convert_mdx_to_markdown.mjs input.mdx output.md
   ```

4. Review the result with `rg` and a short diff. Confirm that no MDX-only syntax remains.
5. Apply any user-requested follow-up edits, such as removing a generated table of contents or changing link policy.

## Default Conversion Rules

- Drop YAML frontmatter and top-level MDX imports.
- Remove `<BlogAuthors />`.
- Expand `<PackageManagerTabs command="add pkg -D" />` to a `bash` code block using `pnpm add pkg -D`.
- Convert centered HTML image blocks into Markdown image syntax.
- Remove Rspress heading anchor suffixes while keeping the heading text.
- Remove standalone `<a id="..."></a>` anchor lines.
- Remove table-of-contents links that target in-page anchors, preserving the list text.
- Convert code-fence titles or standalone bold filename captions into the first line of the code block as a comment, for example:

  ```js
  // hello.js
  export function greet(name) {
    return `Hello, ${name}!`;
  }

  console.log(greet('world'));
  ```

- Convert code blocks that contain markers such as `// [!code highlight]` to `diff` code blocks, remove the marker, and prefix highlighted lines with `+`.
- Prefix Markdown links whose target starts with `/` using the current repository's site domain. Infer the product from the input file's Git repository, remote, package name, or path segment:
  - `rspack` -> `rspack.rs`
  - `rsbuild` -> `rsbuild.rs`
  - `rspress` -> `rspress.rs`
  - `rslib` -> `rslib.rs`
  - `rsdoctor` -> `rsdoctor.rs`
  - `rstest` -> `rstest.rs`
- Add `/zh` to the prefix when the MDX path contains a `zh` path segment. For example, a Chinese Rspack document converts `/guide/optimization/tree-shaking` to `https://rspack.rs/zh/guide/optimization/tree-shaking`.
- Use `--link-prefix <prefix>` only when the inferred domain is wrong or the user explicitly requests a custom prefix.

## Validation Checklist

Run targeted checks after conversion:

````bash
rg -n '<BlogAuthors|PackageManagerTabs|title="|\\{#|^<a id="|\\]\(/|!code highlight|^\*\*[^*]+\*\*$' output.md
rg -n '^```' output.md | wc -l
````

The first command should return no matches unless the user intentionally kept that syntax. The fence count should be even.

## Resources

- `scripts/convert_mdx_to_markdown.mjs`: deterministic converter for the common Rspack/Rstack release-blog MDX pattern.
