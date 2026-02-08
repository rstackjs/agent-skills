# rstest-cdp

[CDP](https://chromedevtools.github.io/devtools-protocol/)-based debugger CLI for rstest, designed for use by [skills/rstest-cdp](../../skills/rstest-cdp/SKILL.md).

Important: This CLI is intended to be invoked by AI agents, not for direct human use. Agents use the skill definition to generate plans and interpret results automatically.

This package provides a command-line tool that helps debug Rstest test cases by:

- Running a single test file in a single worker under the Node inspector (CDP)
- Setting sourcemap-mapped breakpoints via instrumentation breakpoints (handles timing/race conditions)
- Evaluating expressions to inspect intermediate variables

Note: Browser mode debugging is not supported yet.

## Usage

```bash
# Build first
pnpm --filter rstest-cdp build

# Read plan from a file
node ./packages/rstest-cdp/dist/rstest-cdp.cjs --plan plan.json

# Read plan from stdin (using heredoc)
node ./packages/rstest-cdp/dist/rstest-cdp.cjs --plan - <<'EOF'
{
  "runner": {
    "cmd": "pnpm",
    "args": ["rstest", "run", "--include", "test/example.test.ts"],
    "cwd": "/path/to/project"
  },
  "tasks": [
    {
      "sourcePath": "/path/to/project/src/example.ts",
      "line": 42,
      "column": 0,
      "expressions": ["value", "typeof value"]
    }
  ]
}
EOF

# Enable debug mode for diagnostic info (includes meta in output + stderr logs)
node ./packages/rstest-cdp/dist/rstest-cdp.cjs --debug --plan plan.json
```

### CLI args

- `-p, --plan <path>`: Path to plan JSON file (or `-` for stdin). Required.
- `--output <path>`: Write JSON output to file (or `-` for stdout).
- `--breakpoint-timeout <ms>`: Timeout for resolving breakpoints (default: `20000`).
- `--inactivity-timeout <ms>`: Timeout between breakpoint hits (default: `40000`).
- `--debug`: Enable debug logging.

## Output

The CLI outputs a JSON `DebugResult` to stdout.

With `--debug`, additional diagnostic metadata is included under `meta`.

## Commands (development)

```bash
pnpm --filter rstest-cdp build
pnpm --filter rstest-cdp dev
pnpm --filter rstest-cdp gen:schema
pnpm --filter rstest-cdp typecheck
```

## Plan schema

The plan JSON Schema is generated from Valibot schemas and committed at `schema/plan.schema.json`.
