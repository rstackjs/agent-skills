# Codex CLI eval workflow

Use this workflow when Codex CLI executes the evals. It adapts `skill-creator`'s evaluation loop without depending on Claude Code commands, hooks, or automatic skill discovery.

## 1. Preflight and record controls

Confirm the harness before running cases:

```bash
command -v codex
codex --version
codex exec --help
```

Record the CLI version, executor model, grader model, sandbox, approval behavior, network availability, and relevant config in the run metadata. Pin the executor and grader models explicitly, and use the same respective values for every matched run.

Prepare one controlled `CODEX_HOME` for the whole matched evaluation and authenticate it using a supported secure method before starting any run. It must not contain user skills, plugins, config, or rules. Use this same clean home for every configuration so the candidate skill is available only through the immutable snapshot named in the `with_skill` prompt. Keep `--ignore-user-config` as defense in depth when the installed CLI supports it, and use `--ephemeral` to prevent session reuse.

```bash
export EVAL_CODEX_HOME="$(mktemp -d)"
export EVAL_EXECUTOR_MODEL="executor-model-id"
export EVAL_GRADER_MODEL="grader-model-id"
chmod 700 "$EVAL_CODEX_HOME"
# Authenticate this isolated home without copying credentials into eval artifacts.
CODEX_HOME="$EVAL_CODEX_HOME" codex login --device-auth
test -z "$(find "$EVAL_CODEX_HOME" -type f -name SKILL.md -print -quit)"
```

Do not use `--dangerously-bypass-approvals-and-sandbox` merely to make an eval pass. Select the least-permissive sandbox that still represents the skill's real task. If a task genuinely requires network access or broader writes, record that as part of the controlled setup. For networked `workspace-write` evals, explicitly pass `-c sandbox_workspace_write.network_access=true`; omit it for offline evals. Keep this override identical across every matched run instead of relying on an ambient default.

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

Create every `workspace/` from the same verified fixture state. Never let paired runs share a mutable checkout. Build executor workspaces from the fixture allowlist rather than copying the repository wholesale. Copy the target skill into `skill-snapshot/` for `with_skill`; do not point the executor at a live skill that may change while runs are in progress.

The baseline run directory must not contain `skill-snapshot/`, and neither its workspace nor the controlled `CODEX_HOME` may contain the target skill. Verify both the fixture equality and skill absence before execution:

```bash
WITH_SKILL_RUN="/absolute/path/to/with-skill-run"
WITHOUT_SKILL_RUN="/absolute/path/to/without-skill-run"
TARGET_SKILL="target-skill-name"

diff -qr --exclude=.git \
  "$WITH_SKILL_RUN/workspace" \
  "$WITHOUT_SKILL_RUN/workspace"
test ! -e "$WITHOUT_SKILL_RUN/skill-snapshot"
test ! -e "$WITHOUT_SKILL_RUN/workspace/skills/$TARGET_SKILL"
test ! -e "$WITHOUT_SKILL_RUN/workspace/.agents/skills/$TARGET_SKILL"
test -z "$(find "$EVAL_CODEX_HOME" "$WITHOUT_SKILL_RUN/workspace" \
  -type f -name SKILL.md -path "*/$TARGET_SKILL/*" -print -quit)"
```

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

The baseline prohibition is defense in depth. The clean `CODEX_HOME`, fixture-only workspace, and pre-execution checks are the isolation boundary. Keep every other instruction equivalent.

## 4. Run Codex

Write the selected prompt to a file outside the executor workspace, then run a fresh process:

```bash
CODEX_HOME="$EVAL_CODEX_HOME" codex exec \
  --ephemeral \
  --ignore-user-config \
  --skip-git-repo-check \
  --json \
  --color never \
  --model "$EVAL_EXECUTOR_MODEL" \
  --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  --cd <absolute-run-dir>/workspace \
  --output-last-message <absolute-run-dir>/final.txt \
  - < <absolute-run-dir>/executor-prompt.txt \
  > <absolute-run-dir>/events.jsonl \
  2> <absolute-run-dir>/stderr.log
```

The command above is the network-enabled variant. Remove the `-c sandbox_workspace_write.network_access=true` line when the eval is intentionally offline. Use the same explicit executor model and network setting for every configuration. Do not use `codex exec resume`; each run must be independent.

Record process start, end, duration, and exit code in `timing.json`. Current Codex JSONL emits authoritative usage on `turn.completed`; extract and sum it rather than estimating from text:

```bash
jq -s '
  [.[] | select(.type == "turn.completed") | .usage] as $usage
  | if
      ($usage | length) == 0
      or any(
        $usage[];
        (type != "object")
        or (.input_tokens | type != "number")
        or (.cached_input_tokens | type != "number")
        or (.output_tokens | type != "number")
      )
    then {
      input_tokens: null,
      cached_input_tokens: null,
      output_tokens: null,
      total_tokens: null
    }
    else
      ($usage | map(.input_tokens) | add) as $input
      | ($usage | map(.output_tokens) | add) as $output
      | {
          input_tokens: $input,
          cached_input_tokens: ($usage | map(.cached_input_tokens) | add),
          output_tokens: $output,
          total_tokens: ($input + $output)
        }
    end
' <absolute-run-dir>/events.jsonl
```

If the installed CLI does not expose those fields, store `null` or mark tokens as not recorded; output characters are not token counts.

A nonzero exit, interrupted stream, or absent final message is a harness failure. Preserve its logs, repair the harness if possible, and rerun from a fresh fixture copy under a new run number.

## 5. Grade without leaking the condition

Run deterministic checks first. Examples include parsing JSON, checking required files and content, running a build, or inspecting a machine-readable artifact. Save the exact command, exit status, and relevant output as evidence.

Use a separate Codex process only for assertions that require semantic judgment. Give it the task prompt, assertions, pristine fixture or source evidence, executor transcript, and produced workspace. Do not tell it whether the run is `with_skill` or `without_skill`.

Run the grader from a read-only directory and constrain its final response with `assets/grading.schema.json`:

```bash
CODEX_HOME="$EVAL_CODEX_HOME" codex exec \
  --ephemeral \
  --ignore-user-config \
  --skip-git-repo-check \
  --json \
  --color never \
  --model "$EVAL_GRADER_MODEL" \
  --sandbox read-only \
  --cd <absolute-grading-input-dir> \
  --output-schema <evaluator-skill-path>/assets/grading.schema.json \
  --output-last-message <absolute-run-dir>/grading.json \
  - < <absolute-run-dir>/grader-prompt.txt \
  > <absolute-run-dir>/grader-events.jsonl \
  2> <absolute-run-dir>/grader-stderr.log
```

The grader prompt should require it to inspect durable outputs rather than trust the executor's claims, use the same pass/fail burden for every configuration, cite concrete evidence, and reproduce every supplied assertion text exactly once. Merge deterministic results into the same `grading.json` shape if both grading methods are used.

JSON Schema validation cannot express that the grader returned the complete assertion set or that `summary` is derived from the expectation booleans. After schema validation and before aggregation, reject missing, duplicate, reordered, or rewritten assertions and any aggregate mismatch:

```bash
jq -e \
  --slurpfile definitions skills-test/<name>/evals/evals.json \
  --argjson eval_id <eval-id> '
  ($definitions[0].evals[] | select(.id == $eval_id) | .assertions) as $expected
  | (.expectations | map(.text)) as $actual
  | (.expectations | length) as $total
  | ([.expectations[] | select(.passed)] | length) as $passed
  | ($total - $passed) as $failed
  | ($passed / $total) as $pass_rate
  | (
      ($actual == $expected)
      and (.summary.total == $total)
      and (.summary.passed == $passed)
      and (.summary.failed == $failed)
      and (((.summary.pass_rate - $pass_rate) | fabs) < 1e-9)
    )
' <absolute-run-dir>/grading.json
```

## 6. Aggregate and diagnose

After every run has valid, invariant-checked `grading.json` and `timing.json`, use the provider-neutral aggregation and viewer utilities from `skill-creator`. Run the module from the dependency directory. Verify generated metadata before reporting it because placeholder model names or run counts are not evidence:

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
