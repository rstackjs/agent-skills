## rstest-cdp (agent-invoked CLI)

This package ships a CDP debug CLI designed for AI agents.
Treat it as a portable artifact: deterministic, easy to invoke, minimal surface area.

How it is used:

- External agent generates a Plan JSON and calls: `node packages/rstest-cdp/dist/rstest-cdp.cjs --plan <path|->`
- This repo focuses on keeping the CLI contract stable; the skill runbook lives in `skills/rstest-cdp/`.

## Project structure (start here)

- Entrypoint: `packages/rstest-cdp/src/cli.ts`
- CLI orchestration + output writing: `packages/rstest-cdp/src/index.ts`
- Plan parsing/validation + runner args normalization: `packages/rstest-cdp/src/plan.ts`
- CDP session + sourcemap mapping + breakpoint resolution: `packages/rstest-cdp/src/session.ts`
- Generated plan JSON Schema (do not edit): `packages/rstest-cdp/schema/plan.schema.json`
- Schema generator: `packages/rstest-cdp/scripts/genPlanSchema.mts`

## Output contract (do not break)

- stdout: a single JSON `DebugResult` (machine-readable)
  - Core fields: `status`, `results`, `errors` (always present)
  - `meta` field: diagnostic info, only included with `--debug` flag
- stderr: runner output + optional debug logs (`--debug`)
- stable ordering, explicit timeouts, no randomness

## Do

- Keep diffs small and localized to `packages/rstest-cdp/`.
- Treat input from files / CDP / subprocess as `unknown`, then validate/narrow.
- Keep the CLI deterministic (timeouts explicit, stable ordering).
- Rebuild after changes; do not edit `dist/*` by hand.

## Don't

- Don't print non-JSON to stdout (breaks callers).
- Don't add heavy dependencies without approval.

## Commands

```bash
pnpm --filter rstest-cdp typecheck
pnpm --filter rstest-cdp build
pnpm --filter rstest-cdp dev
pnpm --filter rstest-cdp gen:schema
pnpm --filter @agent-skills/e2e test
```
