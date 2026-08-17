# Rstack Context skill evaluation

## Setup

- Date: 2026-08-14
- Candidate: `codex/rstack-context-plugin`
- Executor runs: not yet recorded
- Deterministic validation: plugin launcher contract and skill schema validation

## Current result

The tracked evaluation set defines nine representative and boundary workflows: stored failures, monorepo context selection, unused candidates, dead-code evidence axes, snapshot regression, missing-artifact recovery, related-test fanout gating, external-checkout root binding, and standalone Rstest config adoption.

Matched Codex/Claude benchmark runs have not yet been recorded for this repository revision. No pass-rate, token, or timing claim is made. The deterministic plugin contract first failed against the previous skill wording because it did not require selected-file counts, fanout warnings, leaf-source preference, or Rstack adoption of standalone Rstest config; it passes after the scoped guidance update. This is a structural gate, not a behavioral reliability claim.

## Iteration decision

Dogfood showed three general gaps worth preserving as eval boundaries: preflight related-test selection before consent-gated execution, project-root binding for MCP, and explicit adoption of standalone Rstest config. Rerun evals 1, 7, 8, and 9 as matched fresh Codex sessions before publishing reliability claims.
