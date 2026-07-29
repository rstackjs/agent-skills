---
name: rstack-skill-evaluator
description: Benchmark and iteratively improve agent skills with Codex CLI or Claude Code by generating eval cases, comparing skill-guided vs baseline runs, grading outcomes, and recording actionable reports under skills-test/{skill-name}.
metadata:
  dependencies: ['skill-creator']
  internal: true
---

# Rstack Skill Evaluator

A repo-specific compatibility layer on top of `skill-creator`. Reuse its Test / Improve / Benchmark concepts, JSON schemas, grading guidance, and eval viewer, but select the executor for the current environment.

## Select the executor

- When the user requests Codex or `codex` is the available CLI, read [references/codex-cli.md](references/codex-cli.md) and follow it. Its instructions override Claude-specific commands and subagent mechanics in `skill-creator`.
- Otherwise, follow `skill-creator` directly.

Do not invoke `skill-creator/scripts/run_eval.py`, `run_loop.py`, or `improve_description.py` in Codex mode. Those scripts shell out to `claude -p` and test Claude-specific skill discovery. Provider-neutral utilities such as `quick_validate.py`, `aggregate_benchmark.py`, and `eval-viewer/generate_review.py` can be reused after validating the installed dependency version.

## Targeting a skill

If the user hasn't named a target, ask. Skills live under `skills/` (production) and `.agents/skills/` (internal-only).

Before editing an existing skill, snapshot it so the next iteration can compare the candidate against the previous version. Keep the snapshot and all raw run data outside tracked artifact paths.

## Minimum eval rules

Use these rules for a basic eval unless the user requests a larger benchmark:

1. Define at least two realistic cases: one representative workflow and one boundary, failure, or constraint case. Prefer a third case when the skill has multiple distinct modes.
2. Give each case 2-5 outcome-focused assertions that can be verified from files, command results, or other durable evidence. Do not reward an agent merely for saying it succeeded.
3. Run every case as a matched pair on fresh, identical fixture copies: `with_skill` and `without_skill`. When improving an existing skill, also compare the candidate against the snapshotted previous version when that is the more useful baseline.
4. Keep the task prompt and runtime controls identical across configurations. The only intended difference is access to the target skill. Do not expose assertions, expected grader decisions, or another run's outputs to the executor.
5. Use a fresh session for every run. Pin and record the CLI version, model, sandbox, approval, network, and relevant config. Never reuse a mutated working copy.
6. Grade both configurations with the same checks. Prefer deterministic scripts for objective assertions; use an independent grader only for semantic checks, and require concrete evidence for every pass.
7. Treat CLI crashes, timeouts, missing fixtures, and auth failures as harness failures, not skill failures. Fix or clearly report the harness problem before drawing skill conclusions.
8. One run per configuration is a smoke eval. Use at least three repetitions before making claims about reliability, variance, token cost, or wall-time improvements.

An eval is useful when it can reveal a decision: keep the candidate, revise a general instruction or bundled resource, strengthen a weak assertion, or repair the harness. Do not fit the skill narrowly to exact fixture names or expected strings.

## Artifact layout

For skill `<name>`, two paths are tracked in git; everything else under `skills-test/` is gitignored:

```plaintext
+--------------------------------------+----------------------------------+
|  Tracked path                        |  Purpose                         |
+--------------------------------------+----------------------------------+
|  skills-test/<name>/evals/evals.json |  eval definitions                |
|  skills-test/<name>/report.md        |  human-readable run summary      |
+--------------------------------------+----------------------------------+
```

Workspaces, raw run outputs, and fixtures may live anywhere — under `skills-test/<name>/` or an OS scratch dir — as long as `report.md` references the path so a reader can find them.

## `report.md`

Write a committed Markdown summary of the latest run. At minimum include:

- setup: date, executor, CLI version, model, skill version or commit ref, run count, and relevant runtime controls;
- aggregate pass rate and, when actually captured, token and wall-time results for `with_skill` vs its baseline;
- a per-eval breakdown with failed assertions and evidence;
- findings separated into **skill gaps**, **eval gaps**, and **harness failures**;
- an iteration decision: the general change to make, the evidence supporting it, and which evals must be rerun;
- pointers to raw artifacts.

Never invent missing model, token, or timing data. Mark it as not recorded. After changing the target skill, rerun the affected cases plus at least one unaffected or held-out case, then replace `report.md` with the latest evidenced result and keep prior raw iterations available for comparison.
