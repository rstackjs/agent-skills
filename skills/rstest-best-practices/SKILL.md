---
name: rstest-best-practices
description: Set up, write, or review Rstest tests and configuration, including environments, mocks, snapshots, coverage, CI, and worker pool performance tuning.
---

# Rstest best practices

Apply these rules when setting up, writing, or reviewing Rstest projects.

## Workflow

- Inspect the existing package manager, dependency policy, module mode, build configuration, test layout, and framework conventions before editing.
- Add `@rstest/core`, a package-local test script, and a config file whose extension matches the package's module mode.
- Reuse existing build configuration only when doing so lowers maintenance cost and remains compatible. An adapter is optional; use an independent Rstest config when adapter integration is incompatible or disproportionately costly, and explicitly reproduce required aliases, plugins, defines, environments, and externals.
- Configure test discovery, environment, and setup files intentionally. Do not enable `passWithNoTests` unless an empty test set is an expected and documented state.
- Verify test discovery with `rstest list`, then run focused tests, the full suite, and the project's existing build or type-check command.

## Configuration and environments

- Use `defineConfig` from `@rstest/core` and a config file extension compatible with the package's module mode.
- Prefer explicit imports from `@rstest/core` over `globals: true`.
- Use `setupFiles` for shared matchers and cleanup; use `plugins`, `resolve`, or `source` for ordinary build integration and low-level `tools` only when necessary.
- Set `include` explicitly when the package's test layout is non-standard; do not assume the default discovery pattern.
- Use `node` for server/SSR tests or install `happy-dom` or `jsdom` for a simulated DOM. Use Browser Mode for component tests that execute in a real browser. For end-to-end tests that drive a running app from a Node worker, use [Rstest's Playwright integration](https://rstest.rs/guide/basic/e2e-testing).
- For React or Vue component tests, register the matching build plugin, use the corresponding Testing Library, and centralize matcher extension and cleanup in a setup file.
- Use multiple test projects only when environments or configurations genuinely differ; keep global options such as reporters, coverage, pool, isolation, and bail at the root.

## Test writing

- Prefer small tests that verify one public behavior; use `.skip` or `.todo` intentionally and never commit `.only`.
- Keep test APIs and test files in the same module system as the project; do not mix ESM/CJS assumptions without verifying the runtime and bundler behavior.
- Prefer `await expect(promise).resolves...` and `.rejects...` over `try/catch` patterns that can miss assertions.
- Use `includeSource` only for small utilities, guard tests with `import.meta.rstest`, and define it as `false` in production builds.

## Mocking

- Use `rs.fn()` for functions, `rs.spyOn()` for object methods, and `rs.mock()` factories for modules; mock external boundaries rather than the subject under test.
- Choose `clearMocks`, `resetMocks`, or `restoreMocks` according to whether calls, implementations, or original methods must be restored between tests.
- Match the mock to how the code loads the dependency. Use `rs.mock()` for an ESM import and `rs.mockRequire()` for a CommonJS `require()`. For a partial ESM mock, import the real exports with `import * as actual from './api' with { rstest: 'importActual' }` and spread `actual` in the synchronous factory.
- Module mocks replace runtime behavior but do not necessarily remove the real dependency from the Rspack build graph. Use aliases or narrowly scoped externals only when the build still traverses an unwanted or unavailable dependency, and verify the runtime externalization format.

## Snapshots and coverage

- Keep snapshots small and deterministic: use inline snapshots for short output, file snapshots for large structured output, and serializers for paths or unstable data. Review every update.
- Enable coverage with `--coverage` or `coverage.enabled`.
- Choose a coverage provider supported by the installed Rstest version and add its package explicitly; do not copy a V8 or Istanbul provider choice without checking project needs.
- If thresholds apply to the whole source tree, set `coverage.include` to its source globs and check that an untested source file appears in the report. By default, coverage includes only tested files.

## Running and CI

- Use `rstest` for a single run; `rstest run` is an optional explicit equivalent. Use `rstest --watch` or `rstest watch` only for local development.
- Use `rstest list --filesOnly` for file discovery and `rstest list` for test names. Use positional filters or `-t` for focused runs, `-u` for intentional snapshot updates, and `-c` for a non-default config.
- For sharded CI, run each shard with the blob reporter, collect the blobs in `.rstest-reports/`, and run `rstest merge-reports` from the project root with the desired reporters (such as JUnit).
- If passing-test logs are too noisy, consider `silent: 'passed-only'`; disable it temporarily when diagnosing setup or runtime output.

## Worker pool performance

- In Rstest v0.12.0 and later, try a VM pool when many test files spend much of their time starting workers or compiling the same dependencies. Each file gets a fresh VM context in a reused worker. Setup files still run for each test file.
- Start with a CLI trial on a passing suite: `rstest run --pool.type vmForks --bail 1` for child processes or `rstest run --pool.type vmThreads --bail 1` for worker threads.
- If the trial fails or tests become flaky, remove the trial flags and rerun the same tests with the original pool. Consult [VM pool behavior](https://rstest.rs/config/test/pool#vm-pool-behavior) when investigating a VM-only failure.
- If the trial passes, drop the trial's `--bail 1` and compare repeated full-suite runs with the same worker count and cache conditions. Set `pool.type` in the root config only if the suite stays green and the speedup is repeatable within the project's memory budget.

## First-line debugging

- Start with a focused repro and `--reporter=verbose`; use `--printConsoleTrace` for noisy or unclear console output.
- Use `DEBUG=rstest` and inspect `dist/.rstest-temp/.rsbuild/` to verify final Rstest/Rsbuild/Rspack configuration and generated build output.
- Use breakpoints through the Rstest VS Code extension or a JavaScript Debug Terminal for runtime failures.
- Use `rstest-debugging` for systematic startup, build, runtime, logging, memory, or performance diagnosis.

## Documentation

- For the latest Rstest docs, read https://rstest.rs/llms.txt
