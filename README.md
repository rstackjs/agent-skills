# Agent Skills

<p>
  <a href="https://discord.gg/XsaKEEk4mW"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat-square&logo=discord&colorA=564341&colorB=EDED91" alt="discord channel" /></a>
  <a href="https://github.com/rstackjs/agent-skills/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" /></a>
  <a href="https://github.com/rstackjs/agent-skills"><img src="https://img.shields.io/github/stars/rstackjs/agent-skills?style=flat-square&colorA=564341&colorB=EDED91" alt="stars" /></a>
  <a href="https://github.com/rstackjs/agent-skills/issues"><img src="https://img.shields.io/github/issues/rstackjs/agent-skills?style=flat-square&colorA=564341&colorB=EDED91" alt="issues" /></a>
</p>

A collection of Agent Skills for [Rstack](https://rspack.rs/guide/start/ecosystem#rstack).

> AI-powered skills for debugging, tracing, upgrading, and analyzing Rstack projects.

## Table of Contents

- [Usage](#usage)
- [Rspack Skills](#rspack-skills)
- [Rsbuild Skills](#rsbuild-skills)
- [Rslib Skills](#rslib-skills)
- [Rspress Skills](#rspress-skills)
- [Rsdoctor Skills](#rsdoctor-skills)
- [Rstest Skills](#rstest-skills)
- [Rslint Skills](#rslint-skills)
- [Storybook Skills](#storybook-skills)
- [Contribution Workflow Skills](#contribution-workflow-skills)
- [Contributing](#contributing)
- [License](#license)

## Usage

We recommend installing this repository as an [Agent Plugin](https://agent-plugins.org/). The Rstack Agent Plugin follows the open, vendor-neutral Agent Plugins 1.0 standard and works with compatible agent clients, including VS Code, GitHub Copilot, Codex, Cursor, and more.

### Codex

```bash
codex plugin marketplace add rstackjs/agent-skills
codex plugin add rstack@rstack
```

### VS Code

Run **Chat: Install Plugin From Source**, then enter:

```text
https://github.com/rstackjs/agent-skills
```

### Cursor

```bash
git clone https://github.com/rstackjs/agent-skills.git ~/.cursor/plugins/local/rstack
```

### GitHub Copilot

```bash
copilot plugin marketplace add rstackjs/agent-skills
copilot plugin install rstack@rstack
```

### Claude Code

```bash
claude plugin marketplace add rstackjs/agent-skills
claude plugin install rstack@rstack
```

### Individual skills

Install any skill with:

```bash
npx skills add rstackjs/agent-skills --skill <skill-name>
```

## Rspack Skills

### rspack-best-practices

```bash
npx skills add rstackjs/agent-skills --skill rspack-best-practices
```

Configure, review, or troubleshoot Rspack builds, including loaders, CSS, assets, type checking, bundle optimization, and profiling.

### rspack-v2-upgrade

```bash
npx skills add rstackjs/agent-skills --skill rspack-v2-upgrade
```

Use when upgrading a Rspack 1.x project to v2, including dependency and configuration updates.

### rspack-debugging

```bash
npx skills add rstackjs/agent-skills --skill rspack-debugging
```

Debug native Rspack crashes, segmentation faults, deadlocks, or stuck builds with LLDB and matching debug symbols.

### rspack-tracing

```bash
npx skills add rstackjs/agent-skills --skill rspack-tracing
```

Capture or analyze Rspack build traces to locate slow compiler phases, plugins, loaders, or the last events before a build failure.

### rspack-split-chunks

```bash
npx skills add rstackjs/agent-skills --skill rspack-split-chunks
```

Diagnose or tune Rspack splitChunks for duplicate modules, route over-fetching, cache groups, caching, or oversized chunks.

## Rsbuild Skills

### rsbuild-best-practices

```bash
npx skills add rstackjs/agent-skills --skill rsbuild-best-practices
```

Configure, review, or troubleshoot Rsbuild applications, including build/dev commands, assets, type checking, and bundle optimization.

### rsbuild-v2-upgrade

```bash
npx skills add rstackjs/agent-skills --skill rsbuild-v2-upgrade
```

Use when upgrading a Rsbuild 1.x project to v2, including dependency and configuration updates.

### migrate-to-rsbuild

```bash
npx skills add rstackjs/agent-skills --skill migrate-to-rsbuild
```

Migrate webpack, Vite, create-react-app (CRA/CRACO), or Vue CLI projects to Rsbuild.

## Rslib Skills

### rslib-best-practices

```bash
npx skills add rstackjs/agent-skills --skill rslib-best-practices
```

Configure, review, or troubleshoot Rslib library builds, output formats, declarations, dependency handling, and integrations.

### rslib-modern-package

```bash
npx skills add rstackjs/agent-skills --skill rslib-modern-package
```

Design, modernize, or review JS/TS npm packages using an opinionated Rslib baseline for ESM, exports, types, dependencies, and release readiness.

### migrate-to-rslib

```bash
npx skills add rstackjs/agent-skills --skill migrate-to-rslib
```

Migrate tsc or tsup library projects to Rslib.

## Rspress Skills

### rspress-docs-generator

```bash
npx skills add rstackjs/agent-skills --skill rspress-docs-generator
```

Create a Rspress v2 docs site or maintain existing Rspress v2 documentation for project changes.

### rspress-best-practices

```bash
npx skills add rstackjs/agent-skills --skill rspress-best-practices
```

Configure, review, or troubleshoot Rspress v2 sites, including content conventions, navigation, MDX, assets, search, and deployment.

### rspress-v2-upgrade

```bash
npx skills add rstackjs/agent-skills --skill rspress-v2-upgrade
```

Migrate Rspress projects from v1 to v2. Use when a user asks to upgrade Rspress, follow the v1-to-v2 guide, update packages/configs/themes, or validate the upgrade.

### rspress-custom-theme

```bash
npx skills add rstackjs/agent-skills --skill rspress-custom-theme
```

Customize Rspress v2 themes with CSS variables, class overrides, Layout slots, icons, or component ejection.

### rspress-description-generator

```bash
npx skills add rstackjs/agent-skills --skill rspress-description-generator
```

Generate missing description frontmatter for Rspress Markdown/MDX pages, including new docs pages and site-wide SEO metadata updates.

```md
---
description: A concise summary of the page content for SEO and AI consumption.
---

# Page Title
```

## Rsdoctor Skills

### rsdoctor-analysis

```bash
npx skills add rstackjs/agent-skills --skill rsdoctor-analysis
```

Analyze Rspack/Webpack bundles from local Rsdoctor build data. Provides intelligent analysis of chunk, module, package, and loader data. Provides evidence-based conclusions and actionable optimization recommendations.

Use when you need to analyze bundle composition, identify duplicate packages, detect similar packages, find large chunks, analyze side effects modules, or get comprehensive bundle optimization recommendations.

## Rstest Skills

### migrate-to-rstest

```bash
npx skills add rstackjs/agent-skills --skill migrate-to-rstest
```

Migrate Jest, Vitest, or Playwright Test to Rstest while preserving test discovery, assertions, mocks, snapshots, and coverage.

### rstest-debugging

```bash
npx skills add rstackjs/agent-skills --skill rstest-debugging
```

Diagnose Rstest startup, build, runtime, logging, memory, or performance problems using traces and comparable measurements.

### rstest-best-practices

```bash
npx skills add rstackjs/agent-skills --skill rstest-best-practices
```

Set up, write, or review Rstest tests and configuration, including environments, mocks, snapshots, coverage, and CI.

## Rslint Skills

### migrate-to-rslint

```bash
npx skills add rstackjs/agent-skills --skill migrate-to-rslint
```

Migrate ESLint or other lint tools to Rslint. Use when replacing ESLint flat config, lint scripts, VS Code ESLint settings, inline directives, rules, presets, plugins, or lint dependencies with Rslint equivalents.

## Storybook Skills

### storybook-rsbuild

```bash
npx skills add rstackjs/agent-skills --skill storybook-rsbuild
```

Set up or migrate Storybook to Rsbuild, configure rsbuildFinal, or integrate with Rslib, Modern.js, or Rspack.

## Contribution Workflow Skills

Skills in this section are internal contribution workflow Skills intended for Rstack repository maintainers and developers, not end users. Set `INSTALL_INTERNAL_SKILLS=1` when installing them.

### create-draft-release-notes

```bash
INSTALL_INTERNAL_SKILLS=1 npx skills add rstackjs/agent-skills --skill create-draft-release-notes
```

Create or update draft GitHub release notes, or output organized Markdown when draft creation is unavailable. Use for release notes, draft releases, release PR checks, npm staged publishing checks, and optional highlights.

### release-blog-writer

```bash
INSTALL_INTERNAL_SKILLS=1 npx skills add rstackjs/agent-skills --skill release-blog-writer
```

Write or revise release blog posts for product releases, with guidance for structure, tone, headings, examples, and links.

### rstack-docs-writer

```bash
INSTALL_INTERNAL_SKILLS=1 npx skills add rstackjs/agent-skills --skill rstack-docs-writer
```

Write or revise Markdown and MDX documentation, including READMEs, guides, and Rspress-based docs.

### mdx-to-markdown

```bash
INSTALL_INTERNAL_SKILLS=1 npx skills add rstackjs/agent-skills --skill mdx-to-markdown
```

Convert MDX to portable Markdown with MDX syntax cleanup and link/code block normalization.

### pr-creator

```bash
INSTALL_INTERNAL_SKILLS=1 npx skills add rstackjs/agent-skills --skill pr-creator
```

Create a pull request using repository branch rules, title conventions, templates, and concise English descriptions.

### rstack-repo-maintain

```bash
INSTALL_INTERNAL_SKILLS=1 npx skills add rstackjs/agent-skills --skill rstack-repo-maintain
```

Audit or modernize Rstack repository infrastructure, package manifests, build/test tooling, CI, and release configuration against maintained baselines.

### rstack-eco-ci-debug

```bash
INSTALL_INTERNAL_SKILLS=1 npx skills add rstackjs/agent-skills --skill rstack-eco-ci-debug
```

Triage Rstack ecosystem CI (eco-ci, rstack-ecosystem-ci), including daily multi-ecosystem status, green-to-red pivots, and Rspack canary bisects. Attribute failures to upstream or downstream changes while checking for flaky runs.

### rstack-skill-evaluator

```bash
INSTALL_INTERNAL_SKILLS=1 npx skills add rstackjs/agent-skills --skill rstack-skill-evaluator
```

Benchmark and iteratively improve agent skills using matched skill-guided and baseline runs with Codex CLI or Claude Code.

## Contributing

Contributions are welcome! Feel free to open an [issue](https://github.com/rstackjs/agent-skills/issues) or submit a [pull request](https://github.com/rstackjs/agent-skills/pulls).

## License

[MIT](./LICENSE)
