---
name: rstack-eco-ci-debug
description: Debug Rstack ecosystem CI failures and attribute the real source PR or downstream change. Always use this skill when the user mentions Rspack eco-ci, rstack-ecosystem-ci, a suite turning red, a downstream regression, a green-to-red pivot, canary bisect, @rspack-canary/core, or daily eco-ci triage — even if they only ask "why is this suite failing", "which PR broke it", or "is this Rspack's fault". Use it to avoid over-blaming the first Rspack commit that appears red in status data.
compatibility:
  - gh CLI authenticated for web-infra-dev/rspack and rstackjs/rstack-ecosystem-ci
  - Local Rspack checkout (for commit/PR inspection and canary mapping)
  - Local downstream project checkout (for pnpm.overrides reproduction)
---

# Rstack Eco CI Debug

Use this skill to debug Rstack ecosystem CI failures without over-blaming the first Rspack commit that appears red in status data.

This version covers the Rspack stack.

## Preconditions

Before starting, ask the user which local checkout paths they have available. Do not assume machine-specific paths.

- **Local Rspack checkout** — required for inspecting commits, resolving canary SHAs, and reviewing PR diffs. Ask for it before running any `git -C <rspack-path>` command.
- **Local downstream project checkout** — required when using `pnpm.overrides` to test specific Rspack versions (for example, during canary bisect). Ask for it before modifying `pnpm-workspace.yaml`, `package.json`, or lockfiles.
- **Local `rstack-ecosystem-ci` checkout** — optional. If available, use its `data/rspack.json` as the first local status source. Otherwise use the ecosystem CI site and GitHub Actions.

Fetch the local Rspack repo before resolving commits:

```bash
git -C <rspack-path> fetch origin main --tags
```

- Treat GitHub Actions job logs as the source of truth for failure signatures.
- Do not modify project files unless the user explicitly asks for a fix.

## Investigation Model

Rspack eco-ci runs a downstream project matrix against a freshly built Rspack artifact. A suite turning red means that a specific combination failed:

```text
current downstream project state + tested Rspack artifact
```

It does not automatically mean the visible Rspack pivot PR is the true root cause. Downstream dependency updates, snapshot changes, test logic changes, and Rspack release/canary windows can all create misleading pivots.

Always distinguish:

- `Surface attribution`: the Rspack commit/PR where status data first shows the suite red.
- `Actual source`: the PR, version window, or downstream change that actually introduced the failing condition.
- `Failure signature`: the stable error text, command, assertion diff, stack, or log block used to compare runs.

## Optional Tools

Read the linked reference before using any of these tools. Do not ask the user generically "which tool do you want"; instead, suggest the specific tool that matches the situation. Only invoke a tool when its strict trigger conditions are met; do not run it "just in case".

- **Canary date bisect** — use in Phase 1 only when the Rspack commit window is too coarse to attribute a PR and downstream causes have already been ruled out. Trigger this when **all** of the following are true:
  - The green-to-red pivot spans **more than 3 Rspack commits** or crosses a release/canary boundary.
  - The failure signature is stable across the red rows in that window.
  - The same Rspack commit does **not** appear in both green and red runs (which would indicate a downstream cause).
  Do **not** trigger when the pivot is a single commit or when the surface PR diff already explains the signature.
  Read [references/canary-date-bisect.md](references/canary-date-bisect.md) and ask the user for the local downstream checkout path and the narrowest failing command.

- **Deep PR debug** — use in Phase 2 only after a specific Rspack source PR or version window has been identified and the user wants the technical reason behind the failure. Trigger this when **all** of the following are true:
  - The user asks "why did this PR break it", "what is the mechanism", or "how should we fix it".
  - The actual source is a Rspack PR or Rspack version window (not a downstream test change, snapshot update, or dependency bump).
  - Phase 1 has already produced evidence linking the PR to the failure signature.
  Do **not** run deep PR debug on downstream PRs; in those cases, Phase 1 output plus a short note about the downstream change is enough.
  Read [references/deep-pr-debug.md](references/deep-pr-debug.md) automatically once a candidate PR is accepted for deep inspection.

- **PR report comment** — use only after strict attribution identifies a merged Rspack PR as the cause and the user wants to notify the PR author. Trigger this only when:
  - The failure is confidently attributed to a merged PR (not just a surface pivot).
  - Downstream changes, dependency bumps, release windows, and flaky signals have been ruled out.
  - The user gives explicit approval to post to GitHub.
  Read [references/pr-report-comment.md](references/pr-report-comment.md) and prepare a draft comment first; do not post without approval.

## Two-Phase Debug Workflow

Eco-ci debugging has two phases. Do not mix them up.

### Phase 1: PR Location

Goal: identify the actual source PR, date window, or downstream change that caused the suite to become red.

#### Fast-Exit Checks

Run these checks first before doing deep pivot analysis. If any check fires with high confidence, produce the Phase 1 output immediately and skip unnecessary steps.

1. **Same Rspack commit, different outcome**
   - If the exact same tested Rspack commit appears in both a green run and a red run of the same suite, the cause is **not** that Rspack commit.
   - Stop and attribute the failure to a downstream change, test expectation change, dependency update, or environment difference between the two runs.
   - Output example: `Actual source: downstream/test change (same Rspack SHA <sha> succeeded in run <green-id> and failed in run <red-id>)`.

2. **Surface PR diff is unrelated to the failure signature**
   - After fetching the surface PR, if its changed files and diff have no plausible connection to the observed error text, assertion, stack frame, or generated output, treat the surface PR as innocent.
   - Shift focus to downstream changes or an earlier Rspack commit that actually touched the failing path.
   - Output example: `Actual source: not surface PR #<n> (diff only touches <unrelated-paths>; failure signature is <signature>)`.

3. **Failure signature directly maps to surface PR changed files**
   - If the error text, failing command, or changed generated output directly involves files or APIs modified by the surface PR, the surface PR is likely the actual source.
   - Move to a lightweight Phase 2 to confirm the mechanism; do not spend time hunting alternative culprits.
   - Output example: `Actual source: surface PR #<n> (failure signature <signature> matches changed files <paths>)`.

Only continue with the full process below if none of the fast-exit checks gives a clear answer.

Use these evidence sources:

- Eco-ci status data, including current failed runs and previous green runs.
- GitHub Actions logs for current failure and candidate pivot failure.
- Rspack commit history, release tags, and canary versions.
- Downstream project history, dependency updates, snapshots, and test/config changes.
- `@rspack-canary/core` overrides in the downstream repo when the date or PR window is still too coarse.

Process:

1. Identify the latest completed Rspack eco-ci run and the previous completed Rspack commit run.
2. List failed suites, failed count, run URL or run id, and the tested Rspack commit.
3. For each failed suite, find the green-to-red pivot in the visible history. If the same tested Rspack commit appears in both green and red runs, apply fast-exit check #1 and stop.
4. Pull logs for the current failure and the candidate pivot failure.
5. Compare failure signatures before attributing a root cause. After inspecting the surface PR diff, apply fast-exit checks #2 and #3 when the relationship between the diff and the signature is clear.
6. If the signature changed, search forward or binary-search red rows until the current signature appears.
7. Check whether the downstream project changed in the same window.
8. Reproduce enough combinations to decide whether the failure comes from Rspack, downstream, or their interaction.
9. If release versions or eco-ci rows are too coarse, ask whether to run the canary date bisect tool.

Phase 1 output:

```text
Surface attribution: <PR shown by eco-ci pivot>
Actual source: <real PR, downstream PR, or version window>
Failure signature: <short signature>
Evidence: <run URLs, logs, canary results, or green/red pivots>
Confidence: high | medium | low
Notes: <why surface attribution is or is not responsible>
```

Only move to Phase 2 when there is a specific source PR or version window with enough evidence to inspect deeply.

### Phase 2: Deep Root Cause Debug

Goal: explain why the identified PR caused the observed behavior.

Use this phase after Phase 1 has identified a candidate source. Read [references/deep-pr-debug.md](references/deep-pr-debug.md) when the user asks for root cause, mechanism, or a fix direction.

Process:

1. Review the candidate PR metadata, commit, and diff.
2. Re-read the concrete failure log block and failing downstream assertion or stack.
3. Locate the downstream code path that produces the failure.
4. Trace from downstream behavior into Rspack APIs, plugin hooks, loaders, generated output, source maps, runtime modules, or diagnostics.
5. Compare before/after behavior when needed, using canaries or local builds.
6. State the mechanical behavior change, not only the PR number.
7. Separate confirmed evidence from inference.

Phase 2 output:

```text
Candidate PR: <pr-number> <title>
Suite: <suite>
Verdict: caused | likely caused | not caused | inconclusive
Mechanism: <3-5 sentence explanation>
Evidence: <log URLs, code refs, reproduction results>
Confidence: high | medium | low
Next action: <fix in Rspack | fix downstream expectation | gather more evidence>
```

Use `gh` for specific job logs when available:

```bash
gh run view --job <job-id> --repo rstackjs/rstack-ecosystem-ci --log
```

For noisy logs, first isolate likely terminal failure blocks:

```bash
gh run view --job <job-id> --repo rstackjs/rstack-ecosystem-ci --log \
  | grep -E -i -C 3 'error|fail|panic|✖' \
  | head -200
```

Fall back to full logs when the filtered output misses the real failure.

## Reproduce Combination Relationships

Use combination testing in Phase 1 to separate Rspack changes from downstream changes.

Start with four conceptual combinations:

```text
old downstream + old Rspack
old downstream + new Rspack
new downstream + old Rspack
new downstream + new Rspack
```

Keep the downstream command fixed and use the narrowest failing command possible.

For finer Rspack windows, ask whether to use the canary date bisect tool, then follow [references/canary-date-bisect.md](references/canary-date-bisect.md).

### Downstream Interaction Check

If the downstream project changed during the same window, test these pairs when practical:

```text
old downstream + bad-window Rspack
old downstream + fixed Rspack
new downstream + bad-window Rspack
new downstream + fixed Rspack
```

This prevents wrongly attributing a downstream dependency/snapshot update to a later unrelated Rspack PR.

## Reporting Requirements

Keep reports compact and evidence-based:

- Name every currently failing suite.
- Include run URL or run id and tested Rspack commit when available.
- State whether each suite is newly investigated or reused from a matching known signature.
- Include the first visible start commit when there is a clear green-to-red pivot.
- Say when a failure predates the visible window.
- Include short log snippets only when they directly identify the failure.
- When surface attribution is misleading, explicitly say the surface PR is likely innocent and explain why.
