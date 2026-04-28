---
name: rstack-skill-evaluator
description: Benchmark agent skills by generating eval cases, comparing skill-guided vs baseline runs, and recording artifacts under skills-test/{skill-name}.
metadata:
  dependencies: ['skill-creator']
  internal: true
---

# rstack-skill-evaluator

A thin repo-specific layer on top of `skill-creator`. For workflow (Test / Improve / Benchmark modes), JSON schemas, grading, and viewer details, defer to `skill-creator`'s own SKILL.md and `references/schemas.md`.

## Targeting a skill

If the user hasn't named a target, ask. Skills live under `skills/` (production) and `dev-skills/` (internal-only).

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

Committed Markdown summary of the latest run. At minimum cover: setup (model, skill version / commit ref, date), aggregate pass rate / tokens / wall time for `with_skill` vs `without_skill`, per-eval breakdown, and pointers to the raw artifacts.
