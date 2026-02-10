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
- [Rspress Skills](#rspress-skills)
- [Rsdoctor Skills](#rsdoctor-skills)
- [Contributing](#contributing)
- [License](#license)

## Usage

Install any skill with:

```bash
npx skills add rstackjs/agent-skills --skill <skill-name>
```

## Rspack Skills

### rspack-debugging

```bash
npx skills add rstackjs/agent-skills --skill rspack-debugging
```

Helps Rspack users and developers debug crashes or deadlocks/hangs in the Rspack build process using LLDB.

Use this Skill when users encounter "Segmentation fault" errors during Rspack builds or when the build progress gets stuck.

### rspack-tracing

```bash
npx skills add rstackjs/agent-skills --skill rspack-tracing
```

Comprehensive guide and toolkit for diagnosing Rspack build issues. Quickly identify where crashes/errors occur, or perform detailed performance profiling to resolve bottlenecks.

Use when the user encounters build failures, slow builds, or wants to optimize Rspack performance.

## Rsbuild Skills

### rsbuild-v2-upgrade

```bash
npx skills add rstackjs/agent-skills --skill rsbuild-v2-upgrade
```

Migrate Rsbuild projects from v1 to v2. Use when a user asks to upgrade Rsbuild, follow the v1-to-v2 guide, update configs/plugins, or validate the upgrade.

## Rspress Skills

### rspress-v2-upgrade

```bash
npx skills add rstackjs/agent-skills --skill rspress-v2-upgrade
```

Migrate Rspress projects from v1 to v2. Use when a user asks to upgrade Rspress, follow the v1-to-v2 guide, update packages/configs/themes, or validate the upgrade.

## Rsdoctor Skills

### rsdoctor-analysis

```bash
npx skills add rstackjs/agent-skills --skill rsdoctor-analysis
```

Analyze Rspack/Webpack bundles from local Rsdoctor build data. Provides intelligent analysis of chunk, module, package, and loader data. Provides evidence-based conclusions and actionable optimization recommendations.

Use when you need to analyze bundle composition, identify duplicate packages, detect similar packages, find large chunks, analyze side effects modules, or get comprehensive bundle optimization recommendations.

## Contributing

Contributions are welcome! Feel free to open an [issue](https://github.com/rstackjs/agent-skills/issues) or submit a [pull request](https://github.com/rstackjs/agent-skills/pulls).

## License

[MIT](./LICENSE)
