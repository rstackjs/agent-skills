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
- [Rstest Skills](#rstest-skills)
- [Contributing](#contributing)
- [License](#license)

## Usage

Install any skill with:

```bash
npx skills add rstackjs/agent-skills --skill <skill-name>
```

## Rspack Skills

### rspack-v2-upgrade

```bash
npx skills add rstackjs/agent-skills --skill rspack-v2-upgrade
```

Use when upgrading a Rspack 1.x project to v2, including dependency and configuration updates.

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

Use when upgrading a Rsbuild 1.x project to v2, including dependency and configuration updates.

### migrate-cra-to-rsbuild

```bash
npx skills add rstackjs/agent-skills --skill migrate-cra-to-rsbuild
```

Migrate Create React App (CRA) or CRACO projects to Rsbuild. Use when a user asks to replace react-scripts or CRACO with Rsbuild and complete the migration safely.

### migrate-webpack-to-rsbuild

```bash
npx skills add rstackjs/agent-skills --skill migrate-webpack-to-rsbuild
```

Migrate webpack projects to Rsbuild. Use when a user asks to replace webpack with Rsbuild and complete migration safely.

### migrate-vite-to-rsbuild

```bash
npx skills add rstackjs/agent-skills --skill migrate-vite-to-rsbuild
```

Migrate Vite projects to Rsbuild. Use when a user asks to replace Vite with Rsbuild and complete migration safely.

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

## Rstest Skills

### migrate-to-rstest

```bash
npx skills add rstackjs/agent-skills --skill migrate-to-rstest
```

Migrate Jest or Vitest tests to Rstest. Use when a user asks to migrate Jest/Vitest tests to Rstest, follow migration guides, update test files, or validate the migration.

## Contributing

Contributions are welcome! Feel free to open an [issue](https://github.com/rstackjs/agent-skills/issues) or submit a [pull request](https://github.com/rstackjs/agent-skills/pulls).

## License

[MIT](./LICENSE)
