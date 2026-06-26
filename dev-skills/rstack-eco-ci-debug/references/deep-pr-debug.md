# Deep PR Debug Tool

Use this tool after a candidate source PR is identified and the user needs the technical reason for the eco-ci failure.

The goal is to connect three things:

- The PR code change.
- The suite project failure signature.
- The runtime or build behavior that changed.

## Inputs

Collect these before starting:

- Candidate PR number and commit SHA.
- Failing suite name.
- Current failure log URL or saved log.
- First-bad failure log, if different from current.
- Flaky/pre-existing signature check result from Phase 1.
- For config-gated hypotheses, generated suite project config evidence from Phase 1, usually from [rsbuild-config-debug.md](rsbuild-config-debug.md) for Rsbuild-based suites.
- Local target project checkout path.
- Suite project checkout path, if reproduction or source reading is needed.

## Review the PR

Fetch and inspect the PR in the local target project checkout:

```bash
git -C <target-path> fetch origin main --tags
gh pr view <pr-number> --repo <project-repo> --json number,title,author,mergedAt,url,headRefOid,mergeCommit
git -C <target-path> show --stat <sha>
git -C <target-path> show --find-renames --find-copies <sha>
```

Focus on changed code paths that can affect the failure signature. Ignore unrelated cleanup unless it changes behavior near the failing path.

## Connect Logs to Code

1. Extract the terminal failure block from the log.
2. Identify the failing command and assertion or stack frame.
3. Locate the suite project code that produced the assertion or runtime path.
4. Confirm the same signature was not already known as flaky or pre-existing before the candidate PR. If it was, stop and return `not caused` or `inconclusive`.
5. For config-gated hypotheses in Rsbuild-based suites, read [rsbuild-config-debug.md](rsbuild-config-debug.md) and use its output before claiming the PR is active in the failing path.
6. Trace from suite project behavior into the target project APIs, plugin hooks, generated output, source maps, loaders, or runtime modules.
7. Match the PR diff to the changed behavior.

Use short log snippets only:

```text
<command or assertion>
<2-5 key lines of failure>
```

## When Diff and Logs Are Not Enough

This tool is for analysis: connect the PR diff to the failure signature through code and logs. If the mechanism still cannot be explained from code review and log inspection alone, do not run canary tests here. Instead, return to Phase 1 and gather before/after evidence with a clear test plan. Use the canary date bisect tool only when the target project is Rspack.

## Diagnosis Rules

- State what changed mechanically, not only which PR changed.
- Separate confirmed evidence from inference.
- Use "likely" when the exact internal transition is inferred from diff plus logs.
- Do not claim root cause from temporal order alone.
- Do not claim root cause when the same signature was previously observed before the candidate PR, unless there is evidence the PR changed the signature or made the failure deterministic.
- Do not claim a config-gated PR as the cause when generated config evidence shows the relevant option or path is disabled or absent.
- If the PR only exposed a suite project fragile assertion, say so.
- If the suite project changed independently, include that interaction.

## Output Format

```text
Candidate PR: <pr-number> <title>
Suite: <suite>
Verdict: caused | likely caused | not caused | inconclusive
Failure signature: <short signature>
Flaky/config checks: <not pre-existing | pre-existing | feature enabled | feature disabled | not applicable>
Mechanism: <3-5 sentence explanation of how the PR change caused the observed behavior>
Evidence:
- <log URL or run id>
- <commit or file references>
- <reproduction result if available>
Confidence: high | medium | low
Next action: <fix in target project | fix suite project expectation | gather more evidence>
```
