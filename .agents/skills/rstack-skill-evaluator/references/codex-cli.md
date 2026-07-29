# Codex CLI eval workflow

Use this workflow when Codex CLI executes the evals. It adapts `skill-creator`'s evaluation loop without depending on Claude Code commands, hooks, or automatic skill discovery.

## 1. Preflight and record controls

Confirm the harness before running cases:

```bash
command -v codex
codex --version
codex exec --help
```

Record the CLI version, model, sandbox, approval behavior, network availability, and relevant config in the run metadata. Use the same values for every matched run. Prefer `--ignore-user-config` to reduce user plugin and configuration leakage, and `--ephemeral` to prevent session reuse.

Do not use `--dangerously-bypass-approvals-and-sandbox` merely to make an eval pass. Select the least-permissive sandbox that still represents the skill's real task. If a task genuinely requires network access or broader writes, record that as part of the controlled setup.

## 2. Prepare evals and isolated runs

Keep tracked definitions at `skills-test/<name>/evals/evals.json`. Follow the upstream schema and include a stable `eval_name`, realistic prompt, expected outcome, fixture reference, and assertions.

Use this raw workspace shape so the upstream aggregator and viewer can discover results:

```plaintext
<workspace>/iteration-N/
└── eval-<id>-<name>/
    ├── eval_metadata.json
    ├── with_skill/
    │   └── run-1/
    │       ├── workspace/
    │       ├── skill-snapshot/
    │       ├── events.jsonl
    │       ├── final.txt
    │       ├── stderr.log
    │       ├── timing.json
    │       └── grading.json
    └── without_skill/
        └── run-1/
            └── ...
```

Create every `workspace/` from the same verified fixture state. Never let paired runs share a mutable checkout. Copy the target skill into `skill-snapshot/` for `with_skill`; do not point the executor at a live skill that may change while runs are in progress.

For an improvement iteration, preserve the previous skill as `old_skill` or another clearly named configuration. Compare candidate and previous snapshots using the same rules; keep `without_skill` when measuring the skill's absolute value is still useful.

## 3. Executor prompts

The executor receives the task, allowed inputs, and output location. It must not receive assertions, `expected_output`, grader instructions, baseline results, or the report.

### `with_skill`

```text
You are an isolated skill-eval executor.

Before starting the task, read <absolute-run-dir>/skill-snapshot/SKILL.md completely. Follow that skill and only the directly relevant resources it references. Treat the snapshot as read-only.

Work only inside the current working directory. Do not inspect eval definitions, assertions, grading files, reports, or sibling run directories. Complete the task as a real user request, verify the resulting artifacts, and leave all task changes in the current working directory. In the final response, concisely state what changed, what validation ran, and any uncertainty or blocker.

Task:
<eval prompt exactly as written in evals.json>
```

### `without_skill`

```text
You are an isolated baseline skill-eval executor.

Solve the task using normal Codex capabilities. Do not search for, read, install, or invoke the target skill or another copy of it.

Work only inside the current working directory. Do not inspect eval definitions, assertions, grading files, reports, or sibling run directories. Complete the task as a real user request, verify the resulting artifacts, and leave all task changes in the current working directory. In the final response, concisely state what changed, what validation ran, and any uncertainty or blocker.

Task:
<eval prompt exactly as written in evals.json>
```

The prohibition in the baseline prompt prevents an installed user or project copy of the target skill from contaminating the control run. Keep every other instruction equivalent.

## 4. Run Codex

Write the selected prompt to a file outside the executor workspace, then run a fresh process:

```bash
codex exec \
  --ephemeral \
  --ignore-user-config \
  --skip-git-repo-check \
  --json \
  --color never \
  --sandbox workspace-write \
  --cd <absolute-run-dir>/workspace \
  --output-last-message <absolute-run-dir>/final.txt \
  - < <absolute-run-dir>/executor-prompt.txt \
  > <absolute-run-dir>/events.jsonl \
  2> <absolute-run-dir>/stderr.log
```

Add `--model <model>` when pinning a model. Use the same explicit value for the matched pair. Do not use `codex exec resume`; each run must be independent.

Record process start, end, duration, and exit code in `timing.json`. Current Codex JSONL emits authoritative usage on `turn.completed`; extract and sum it rather than estimating from text:

```bash
jq -s '
  [.[] | select(.type == "turn.completed") | .usage] as $usage
  | ($usage | map(.input_tokens // 0) | add // 0) as $input
  | ($usage | map(.output_tokens // 0) | add // 0) as $output
  | {
      input_tokens: $input,
      cached_input_tokens: ($usage | map(.cached_input_tokens // 0) | add // 0),
      output_tokens: $output,
      total_tokens: ($input + $output)
    }
' <absolute-run-dir>/events.jsonl
```

If the installed CLI does not expose those fields, store `null` or mark tokens as not recorded; output characters are not token counts.

A nonzero exit, interrupted stream, or absent final message is a harness failure. Preserve its logs, repair the harness if possible, and rerun from a fresh fixture copy under a new run number.

## 5. Grade without leaking the condition

Run deterministic checks first. Examples include parsing JSON, checking required files and content, running a build, or inspecting a machine-readable artifact. Save the exact command, exit status, and relevant output as evidence.

Use a separate Codex process only for assertions that require semantic judgment. Give it the task prompt, assertions, pristine fixture or source evidence, executor transcript, and produced workspace. Do not tell it whether the run is `with_skill` or `without_skill`.

Run the grader from a read-only directory and constrain its final response with `assets/grading.schema.json`:

```bash
codex exec \
  --ephemeral \
  --ignore-user-config \
  --skip-git-repo-check \
  --json \
  --color never \
  --sandbox read-only \
  --cd <absolute-grading-input-dir> \
  --output-schema <evaluator-skill-path>/assets/grading.schema.json \
  --output-last-message <absolute-run-dir>/grading.json \
  - < <absolute-run-dir>/grader-prompt.txt \
  > <absolute-run-dir>/grader-events.jsonl \
  2> <absolute-run-dir>/grader-stderr.log
```

The grader prompt should require it to inspect durable outputs rather than trust the executor's claims, use the same pass/fail burden for every configuration, and cite concrete evidence. Merge deterministic results into the same `grading.json` shape if both grading methods are used.

## 6. Aggregate and diagnose

After every run has valid `grading.json` and `timing.json`, use the provider-neutral aggregation and viewer utilities from `skill-creator`. Run the module from the dependency directory. Verify generated metadata before reporting it because placeholder model names or run counts are not evidence:

```bash
cd <skill-creator-path>

python -m scripts.aggregate_benchmark <workspace>/iteration-N \
  --skill-name <name> \
  --skill-path <path-to-skill>

python eval-viewer/generate_review.py \
  <workspace>/iteration-N \
  --skill-name <name> \
  --benchmark <workspace>/iteration-N/benchmark.json \
  --static <workspace>/iteration-N/review.html
```

If the installed upstream utility rejects the current layout or emits invalid metadata, preserve the error as a harness failure and build `benchmark.json` from `references/schemas.md` or summarize the validated `grading.json` files directly. A report with explicit unavailable metrics is better than a fabricated aggregate.

Analyze failures before editing:

- **Skill gap:** the candidate repeatedly makes a wrong decision that the baseline or previous version avoids, or the skill fails to guide an important case.
- **Eval gap:** an assertion is unverifiable, passes both clearly good and bad outputs, leaks its answer through the task, or is too flaky to support a decision.
- **Harness failure:** environment, fixture, authentication, timeout, sandbox, or collection logic invalidates the run.

Only skill gaps justify a skill change. Generalize the lesson into an instruction, example, reference, or reusable script; do not encode fixture-specific answers.

## 7. Close the iteration loop

For each proposed change, write down:

1. the observed failure and evidence;
2. the hypothesized skill-level cause;
3. the smallest general change expected to address it;
4. the affected evals and at least one unaffected or held-out regression case;
5. the result after rerunning matched fresh copies.

Update `skills-test/<name>/report.md` only from completed artifacts. Keep iterating while changes produce meaningful, repeatable improvements; stop when the candidate no longer improves the evidence, the remaining issue belongs to the eval or harness, or the user accepts the tradeoff.
