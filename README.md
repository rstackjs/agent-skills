# Agent Skills

A collection of Agent Skills for [Rstack](https://rspack.rs/guide/start/ecosystem#rstack).

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

## Rsdoctor Skills

### rsdoctor-analysis

```bash
npx skills add rstackjs/agent-skills --skill rsdoctor-analytics
```

Analyze Rspack/Webpack bundles from local Rsdoctor build data. Zero-dependency JS CLI for chunk/module/package/loader insights. Provides evidence-based conclusions and actionable optimization recommendations.

Use when you need to analyze bundle composition, identify duplicate packages, detect similar packages, find large chunks, analyze side effects modules, or get comprehensive bundle optimization recommendations.

## License

MIT licensed.
