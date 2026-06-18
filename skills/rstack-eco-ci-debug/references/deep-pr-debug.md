# Deep PR Debug Tool

Use this tool after a candidate source PR is identified and the user needs the technical reason for the eco-ci failure.

The goal is to connect three things:

- The PR code change.
- The downstream failure signature.
- The runtime or build behavior that changed.

## Inputs

Collect these before starting:

- Candidate PR number and commit SHA.
- Failing suite name.
- Current failure log URL or saved log.
- First-bad failure log, if different from current.
- Local Rspack checkout path.
- Downstream checkout path, if reproduction or source reading is needed.

## Review the PR

Fetch and inspect the PR in the local Rspack checkout:

```bash
git -C <rspack-path> fetch origin main --tags
gh pr view <pr-number> --repo web-infra-dev/rspack --json number,title,author,mergedAt,url,headRefOid,mergeCommit
git -C <rspack-path> show --stat <sha>
git -C <rspack-path> show --find-renames --find-copies <sha>
```

Focus on changed code paths that can affect the failure signature. Ignore unrelated cleanup unless it changes behavior near the failing path.

## Connect Logs to Code

1. Extract the terminal failure block from the log.
2. Identify the failing command and assertion or stack frame.
3. Locate the downstream code that produced the assertion or runtime path.
4. Trace from downstream behavior into Rspack APIs, plugin hooks, generated output, source maps, loaders, or runtime modules.
5. Match the PR diff to the changed behavior.

Use short log snippets only:

```text
<command or assertion>
<2-5 key lines of failure>
```

## When Diff and Logs Are Not Enough

This tool is for analysis: connect the PR diff to the failure signature through code and logs. If the mechanism still cannot be explained from code review and log inspection alone, do not run canary tests here. Instead, return to Phase 1 and use the canary date bisect tool to gather before/after evidence with a clear test plan.

## Diagnosis Rules

- State what changed mechanically, not only which PR changed.
- Separate confirmed evidence from inference.
- Use "likely" when the exact internal transition is inferred from diff plus logs.
- Do not claim root cause from temporal order alone.
- If the PR only exposed a downstream fragile assertion, say so.
- If the downstream suite changed independently, include that interaction.

## Output Format

```text
Candidate PR: <pr-number> <title>
Suite: <suite>
Verdict: caused | likely caused | not caused | inconclusive
Failure signature: <short signature>
Mechanism: <3-5 sentence explanation of how the PR change caused the observed behavior>
Evidence:
- <log URL or run id>
- <commit or file references>
- <reproduction result if available>
Confidence: high | medium | low
Next action: <fix in Rspack | fix downstream expectation | gather more evidence>
```
