---
name: rstest-cdp
description: Debug a failing rstest test via Node inspector (CDP) by setting sourcemap-mapped breakpoints and evaluating expressions at specific source locations. Use when a test fails and logs are insufficient; you need in-scope values at an exact line/column.
compatibility: Requires Node >=18.12, npx, and permission to run the project's test command (pnpm/npm) in the target workspace.
---

# rstest-cdp

This skill uses the `rstest-cdp` CLI as a black box. You generate a JSON plan, run the CLI once, then iterate by updating the plan.

## Quick start

1. Identify the failing test file and the project root (where the test config lives).
2. Choose a source location to inspect (absolute `sourcePath` + `line` + optional `column`).
3. Decide what to inspect (`expressions[]`).
4. Run:

```bash
npx rstest-cdp --plan - <<'EOF'
{
  "runner": {
    "cmd": "pnpm",
    "args": ["rstest", "run", "-c", "rstest.config.ts", "--include", "test/foo.test.ts"],
    "cwd": "/abs/path/to/project",
    "env": {}
  },
  "tasks": [
    {
      "sourcePath": "/abs/path/to/project/src/foo.ts",
      "line": 42,
      "column": 0,
      "expressions": ["value", "typeof value"]
    }
  ]
}
EOF
```

5. Parse stdout as JSON (`DebugResult`). Do not treat stderr as JSON.

## Inputs to collect (minimum)

- `projectRoot`: absolute path (becomes `runner.cwd`)
- `testFile`: relative/absolute path used by `--include <file>` (must be exactly one)
- `config` (optional): e.g. `-c rstest.config.ts` if required
- `breakpointLocation`:
  - `sourcePath`: absolute path to original source file (not built output)
  - `line`: 1-based line number
  - `column` (optional): 0-based column number
- `expressions`: variable names / property paths / small probes to evaluate at pause

Optional:

- `condition`: only collect values on matching hits
- `hitLimit`: raise if the breakpoint can trigger many times

## Plan format

The plan is a JSON object:

- `runner` (required)
  - `cmd` (string): executable (e.g. `pnpm`, `npm`, `node`)
  - `args` (string[]): command arguments; MUST include exactly one `--include <file>` (or `--include=<file>`)
  - `cwd` (string): project root
  - `env` (object, optional): string-to-string environment variables
- `tasks` (required, non-empty array)
  - `id` (optional): stable identifier; if omitted, the CLI assigns `task-<n>`
  - `sourcePath` (required): absolute source path
  - `line` (required): 1-based line
  - `column` (optional): 0-based column (default 0)
  - `expressions` (optional): array of JS expressions evaluated in the paused frame
  - `condition` (optional): JS expression; only record values when truthy
  - `hitLimit` (optional, min 1): max hits allowed for this task

## Core workflow

### 1) Pick the right breakpoint

Prefer one of:

- Immediately before the failing assertion/throw
- Immediately after the value-under-test is computed
- The boundary between parsing/normalization and assertion

If a line has no emitted code (e.g. type-only, blank, comments), move to a nearby executable line.

### 2) Start with small expressions

Use 3-8 simple probes first:

- `value`, `typeof value`, `value?.prop`, `Array.isArray(value)`
- `Object.keys(obj)` (or a limited slice)
- `JSON.stringify(value)` only if you expect it to be small

Then iterate: add deeper probes only after you see the shape.

### 3) Run once (no watch loop)

- The CLI runs the plan, prints JSON on stdout, and forwards runner output to stderr.
- Iterate by editing the plan and rerunning.

### 4) Interpret output and report back

Read these fields:

- `status`: `'full_succeed' | 'partial_succeed' | 'failed'`
- `results[]`: per task values (`expression` -> evaluated value)
- `errors[]`: why execution failed
- `meta.forwardedArgs`: the final runner invocation (useful to confirm forced single-worker/inspector flags)
- `meta.mappingDiagnostics[]`: why a breakpoint mapping failed (sourcemap issues, source mismatch, etc.)

When replying to the user, include:

- The breakpoint location you used
- Key evaluated values (and what they imply about the bug)
- If failed: the top `errors[]` and the most relevant `mappingDiagnostics[]` reason(s)

## Troubleshooting

### Plan validation fails

- Ensure `tasks` is non-empty
- Ensure `runner.cmd`, `runner.args`, `runner.cwd` are present
- Ensure `line` is 1-based and `column` is 0-based
- Ensure `env` values are strings (no numbers/booleans)

### Runner args error: include missing/multiple

- The runner command MUST include exactly one `--include <file>` (or `--include=<file>`)
- Remove any extra `--include` occurrences

### Breakpoint not resolved

Try:

- A nearby executable line
- Confirm `sourcePath` is absolute and points to the original source under `runner.cwd`
- Confirm the project emits sourcemaps for the test run

### Breakpoint resolved but never hit

Try:

- Move the breakpoint earlier in the flow
- Increase `hitLimit` if it triggers many times
- Add a `condition` to narrow to the relevant test case/input

### Expression evaluation fails

Try:

- Evaluate the parent object first (`obj`, then `obj?.field`)
- Replace complex expressions with small safe probes
- Avoid mutating expressions; keep them read-only
