# migrate-to-rsbuild Skill Evaluation Report

## Overview

- **Date**: 2026-04-16
- **Skill**: `migrate-to-rsbuild`
- **Test cases**: 3 evals with real project files (webpack, Vite, CRA)
- **Iteration**: 2 (real-project file manipulations)

## Test Cases

| Eval | Name                    | Source Framework | Key Requirements                                                   |
| ---- | ----------------------- | ---------------- | ------------------------------------------------------------------ |
| 1    | webpack-react-migration | webpack + React  | Preserve `@app`/`@shared` aliases, keep old config until verified  |
| 2    | vite-react-migration    | Vite + React     | Preserve `@`/`@components` aliases, keep old config until verified |
| 3    | cra-react-migration     | CRA + React      | Follow official CRA guide, keep `react-scripts` until verified     |

## Benchmark Results

| Metric    | With Skill       | Without Skill    | Delta   |
| --------- | ---------------- | ---------------- | ------- |
| Pass Rate | 91.7%            | 93.3%            | -0.17   |
| Time      | 198.3s ± 19.7s   | 217.9s ± 15.5s   | -19.6s  |
| Tokens    | 136,056 ± 62,100 | 179,037 ± 27,673 | -42,981 |

## Per-Eval Detailed Results

### Eval 1: webpack-react-migration

| Assertion                                            | With Skill | Without Skill |
| ---------------------------------------------------- | ---------- | ------------- |
| Created rsbuild.config.js                            | PASS       | PASS          |
| Added @rsbuild/core and @rsbuild/plugin-react        | PASS       | PASS          |
| Preserved @app and @shared aliases                   | PASS       | PASS          |
| Did not delete webpack.config.js before verification | PASS       | PASS          |
| Provided MIGRATION_SUMMARY.md                        | PASS       | PASS          |

**Observation**: Both configurations performed well. The with-skill run was slightly faster (182.7s vs 207.8s) and used fewer tokens (170,793 vs 217,442).

### Eval 2: vite-react-migration

| Assertion                                         | With Skill | Without Skill |
| ------------------------------------------------- | ---------- | ------------- |
| Created rsbuild.config.js                         | PASS       | PASS          |
| Added @rsbuild/core and @rsbuild/plugin-react     | PASS       | PASS          |
| Preserved @ and @components aliases               | PASS       | PASS          |
| Did not delete vite.config.js before verification | PASS       | PASS          |
| Provided MIGRATION_SUMMARY.md                     | PASS       | FAIL          |

**Observation**: With-skill completed faster (178.9s vs 236.6s) but used more tokens (190,478 vs 159,743). Baseline omitted the migration summary.

### Eval 3: cra-react-migration

| Assertion                                        | With Skill | Without Skill |
| ------------------------------------------------ | ---------- | ------------- |
| Created rsbuild.config.js                        | PASS       | PASS          |
| Added @rsbuild/core and @rsbuild/plugin-react    | PASS       | PASS          |
| Did not remove react-scripts before verification | FAIL       | PASS          |
| Provided MIGRATION_SUMMARY.md                    | PASS       | PASS          |

**Observation**: This is the critical failure. The with-skill agent removed `react-scripts` from `package.json` despite the skill explicitly instructing to keep old dependencies until dev/build verification passes. The baseline correctly preserved it. Time was comparable (233.3s vs 209.3s), but with-skill used dramatically fewer tokens (47,896 vs 159,925).

## Key Findings

1. **Core migration mechanics are solid**: All runs successfully created valid `rsbuild.config.js`, added correct Rsbuild dependencies, and preserved resolve aliases.

2. **"Validate before cleanup" is not robust enough**: The most important failure was in eval-3, where the with-skill run prematurely removed `react-scripts`. This indicates the skill's phrasing around keeping old tooling until verification is not strong enough to resist the agent's tendency to clean up eagerly.

3. **Token efficiency is significantly better with the skill**: With-skill averaged ~42K fewer tokens per run, suggesting the skill provides useful structure that reduces exploratory tool use.

4. **Baseline quality is high for simple migrations**: Without the skill, agents can still figure out basic migrations, but they occasionally miss structured outputs (e.g., migration summary in eval-2) or skip verification sequencing.

## Files

- Eval outputs: `skills-test/migrate-to-rsbuild/migrate-to-rsbuild-workspace/iteration-1/eval-{1,2,3}/`
- Benchmark: `skills-test/migrate-to-rsbuild/migrate-to-rsbuild-workspace/iteration-1/benchmark.json`
- Eval definitions: `skills-test/migrate-to-rsbuild/evals/evals.json`
