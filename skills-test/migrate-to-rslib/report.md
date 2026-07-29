# migrate-to-rslib evaluation report

## Outcome

The current `migrate-to-rslib` skill passed all 10 deterministic assertions across two smoke-eval cases. The matched no-skill baseline passed 9 of 10.

This is a single-run smoke evaluation, not a reliability benchmark. It supports a narrow conclusion: the skill preserved the requested behavior in both fixtures and added one observable advantage in the `tsc` migration.

- **Date**: 2026-07-29
- **Executor**: Codex CLI `0.145.0` with `gpt-5.6-terra`
- **Skill snapshot**: `c426a8b3d2e9c12303490754faa2fcd2f6cacace`
- **Design**: two matched cases, one valid run per configuration per case
- **Controls**: `--ephemeral`, `--ignore-user-config`, `workspace-write`, non-interactive approval, network enabled

| Case               |   With skill | Without skill | Differentiator                                                                         |
| ------------------ | -----------: | ------------: | -------------------------------------------------------------------------------------- |
| `tsup-dual-format` |          5/5 |           5/5 | None in this fixture                                                                   |
| `tsc-bundleless`   |          5/5 |           4/5 | Only the skill-guided run retained `tsconfig.build.json` through `source.tsconfigPath` |
| Overall            | 10/10 (100%) |    9/10 (90%) | +10 percentage points                                                                  |

## What was tested

### `tsup-dual-format`

The fixture exposed ESM and CommonJS entry points and required declarations, JavaScript source maps, unchanged package exports, unchanged source files, runtime consumer checks, and removal of obsolete tsup setup only after a successful Rslib build.

Both configurations produced a valid migration and passed every check.

### `tsc-bundleless`

The fixture required bundleless ESM output, declarations, root and `./format` exports, a separate `tsc --noEmit` typecheck workflow, unchanged business logic, and continued use of `tsconfig.build.json`.

The skill-guided run followed the official tsc migration mapping: `bundle: false`, `dts: true`, and `source.tsconfigPath: './tsconfig.build.json'`. The baseline also built and ran successfully, but deleted `tsconfig.build.json` and recreated the relevant entry/compiler behavior in other configuration files. That was a legitimate failure against the explicit preservation requirement, even though its produced package remained functional.

Failed baseline assertion: `rslib.config.ts configures bundleless ESM output, declarations, and source.tsconfigPath for tsconfig.build.json`. Evidence: the bundleless ESM build and declarations succeeded, but `tsconfig.build.json` no longer existed and the config had no `source.tsconfigPath`.

## Deterministic verification

Each valid run was graded from its durable workspace rather than its final response. The grader:

- removed `dist` and ran a fresh `npm run build`;
- ran `npm run typecheck`;
- executed the relevant ESM and CommonJS consumers;
- checked that every `package.json#exports` target existed;
- inspected the required Rslib config mappings;
- compared source files byte-for-byte with the pristine fixture;
- compared package export paths with the pristine fixture.

The current official guides corroborate the evaluated mappings:

- [Migrate from tsup](https://rslib.rs/guide/migration/tsup)
- [Migrate from tsc](https://rslib.rs/guide/migration/tsc)

## Runtime metrics

Codex CLI `0.145.0` ran every valid executor with `gpt-5.6-terra`, `--ephemeral`, `--ignore-user-config`, and `workspace-write`.

| Configuration | Mean duration | Mean total tokens |
| ------------- | ------------: | ----------------: |
| With skill    |        190.9s |           488,838 |
| Without skill |        172.9s |           455,063 |
| Delta         |        +18.0s |           +33,775 |

The token values come from `turn.completed` usage events. With only one valid run per configuration per eval, the time/token difference is descriptive only and must not be treated as stable overhead.

## Findings

### Skill gaps

No correctness gap was demonstrated in the valid skill-guided runs. Both cases passed every deterministic assertion.

### Eval gaps

Eight of the ten assertions were non-discriminating because both configurations passed them. The entire observed pass-rate advantage comes from one `tsc` assertion. The `tsup` fixture proves basic correctness but does not demonstrate incremental value over normal Codex behavior. One valid run per cell is insufficient for reliability or variance claims.

### Harness failures

- The first `tsc-bundleless` with-skill run hit a transient npm registry/DNS failure, so it could not install `@rslib/core` or verify the build. Its exclusion record and failed-command evidence are preserved in the audit bundle.
- To keep the comparison paired, both `tsc-bundleless` configurations were recreated from the pristine fixture and rerun as `run-2`. Only those replacements were graded.
- The first static-viewer attempt exposed Python 3.9 incompatibility in the upstream viewer. It was rerun successfully with Python 3.12.
- Watch-mode verification completed in both with-skill cases but emitted sandbox `EMFILE` watcher-limit warnings.

### Iteration decision

No correctness edit to the target skill is justified from this smoke run. A reasonable future robustness improvement would be to add concise local mapping examples to the `tsc.md` and `tsup.md` references, especially `bundle: false`, `source.tsconfigPath`, declaration behavior, and preservation of `tsc --noEmit`. The current references require live official documentation as a blocking step, so more local detail would make the skill less dependent on network availability. That is a recommendation, not a proven failure in the valid runs.

For a stronger benchmark, add cases for custom entry topology, externals, JSX, asset copying, declaration edge cases, and conditional exports, then run at least three repetitions per configuration.

## Artifacts

- [Evaluation definitions](evals/evals.json)
- [Reconstructible fixtures](fixtures/)
- [Iteration 1 audit bundle](artifacts/iteration-1/README.md)
- [Aggregate benchmark](artifacts/iteration-1/benchmark.json)

The audit bundle preserves grading, timing, extracted `turn.completed` usage, executor summaries, source diffs, and the excluded run's failure evidence. Full event streams, dependency trees, build outputs, and the generated HTML viewer are intentionally omitted.
