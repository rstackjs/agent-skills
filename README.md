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
- [Skills](#skills)
  - [Rspack](#rspack)
  - [Rsbuild](#rsbuild)
  - [Rspress](#rspress)
  - [Rsdoctor](#rsdoctor)
- [Contributing](#contributing)
- [License](#license)

## Usage

Install any skill with:

```bash
npx skills add rstackjs/agent-skills --skill <skill-name>
```

## Skills

### Rspack

| Skill              | Description                                                                      | Use When                                                 |
| ------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `rspack-debugging` | Debug crashes or deadlocks/hangs in Rspack builds using LLDB                     | Encountering "Segmentation fault" errors or build hangs  |
| `rspack-tracing`   | Diagnose Rspack build issues with crash identification and performance profiling | Build failures, slow builds, or performance optimization |

### Rsbuild

| Skill                | Description                            | Use When                                                               |
| -------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `rsbuild-v2-upgrade` | Migrate Rsbuild projects from v1 to v2 | Upgrading Rsbuild, updating configs/plugins, or validating the upgrade |

### Rspress

| Skill                | Description                            | Use When                                                                       |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `rspress-v2-upgrade` | Migrate Rspress projects from v1 to v2 | Upgrading Rspress, updating packages/configs/themes, or validating the upgrade |

### Rsdoctor

| Skill               | Description                                                   | Use When                                                                                                         |
| ------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `rsdoctor-analysis` | Analyze Rspack/Webpack bundles for insights and optimizations | Analyzing bundle composition, duplicates, large chunks, side-effect modules, or for optimization recommendations |

## Contributing

Contributions are welcome! Feel free to open an [issue](https://github.com/rstackjs/agent-skills/issues) or submit a [pull request](https://github.com/rstackjs/agent-skills/pulls).

## License

[MIT](./LICENSE)
