---
name: rstack-eco-ci-debug
description: Debug Rstack ecosystem CI failures and attribute the real source PR. Use when investigating Rspack eco-ci red suites, rstack-ecosystem-ci runs, suite green/red pivots, downstream regression attribution, or @rspack-canary/core reproduction windows.
---

# Rstack Eco CI Debug

Use this skill to debug Rstack ecosystem CI failures without over-blaming the first Rspack commit that appears red in status data.

This version covers the Rspack stack.

## Preconditions

- Require the user to provide the local Rspack checkout path before inspecting Rspack commits or source. Do not assume a machine-specific path.
- If a local `rstack-ecosystem-ci` checkout is available, use its `data/rspack.json` as the first local status source. Otherwise use the ecosystem CI site and GitHub Actions.
- Fetch the local Rspack repo before resolving commits:

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

## Rspack Eco CI Workflow

1. Identify the latest completed Rspack eco-ci run and the previous completed Rspack commit run.
2. List failed suites, failed count, run URL or run id, and the tested Rspack commit.
3. For each failed suite, find the green-to-red pivot in the visible history.
4. Pull logs for the current failure and the candidate pivot failure.
5. Compare failure signatures before attributing a root cause.
6. If the signature changed, search forward or binary-search red rows until the current signature appears.
7. Inspect the candidate Rspack PR diff only after the signature points to it.
8. Check whether the downstream project changed in the same window.

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

## PR Source Attribution

Use this process when a suite becomes red after a specific Rspack PR.

1. Record the surface pivot from eco-ci status data.
2. Verify the failure signature from logs.
3. Inspect the surface pivot PR diff and classify whether it plausibly touches the failing area.
4. Build a timeline across three streams:
   - Rspack PR merge order.
   - Rspack release/canary versions and contained commits.
   - Downstream project PRs, dependency updates, snapshots, and test/config changes.
5. Check whether the downstream project upgraded to a Rspack version in a known bad window.
6. Reproduce enough combinations to decide whether the failure comes from Rspack, downstream, or their interaction.
7. Report both surface attribution and actual source if they differ.

Recommended conclusion shape:

```text
Surface attribution: <PR shown by eco-ci pivot>
Actual source: <real PR, downstream PR, or version window>
Reason: <concise technical cause>
Confidence: high | medium | low
Notes: <why the surface PR is or is not responsible>
```

## Reproduce Combination Relationships

Use combination testing to separate Rspack changes from downstream changes.

Start with four conceptual combinations:

```text
old downstream + old Rspack
old downstream + new Rspack
new downstream + old Rspack
new downstream + new Rspack
```

Keep the downstream command fixed and use the narrowest failing command possible.

### Use @rspack-canary/core for Rspack Windows

Use `@rspack-canary/core` when release versions are too coarse to locate the Rspack-side regression or fix window.

Prefer workspace-level overrides in pnpm workspaces:

```yaml
overrides:
  '@rspack/core': 'npm:@rspack-canary/core@<canary-version>'
```

Or install directly for non-workspace reproductions:

```bash
pnpm add -D @rspack/core@npm:@rspack-canary/core@<canary-version>
```

After every version switch, verify the package actually resolved:

```bash
pnpm why @rspack/core --depth 0
```

If the override is not effective, inspect the workspace root configuration, lockfile, and package manager version before trusting the result.

### Canary Bisect Loop

1. Pick a known-good canary and a known-bad canary.
2. Order canaries by publish time or their embedded Rspack commit order.
3. Switch only `@rspack/core`; keep downstream code unchanged.
4. Run the same minimal failing command.
5. Record:

```text
canary version | Rspack commit | result | failure signature
```

6. Map the first bad or first fixed canary commit to a PR:

```bash
git -C <rspack-path> show <sha>
git -C <rspack-path> branch -r --contains <sha>
gh pr view <pr-number> --repo web-infra-dev/rspack
```

7. Confirm the candidate PR by reading its diff and checking that the failure signature matches the affected area.

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
