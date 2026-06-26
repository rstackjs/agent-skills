# PR Report Comment Tool

Use this tool to comment on a merged target project PR only when the eco-ci failure is strictly attributed to that PR.

## Guardrails

- Do not comment if attribution is ambiguous, only temporal, or based only on a surface green-to-red pivot.
- Do not comment if a suite project PR, dependency bump, release window, flaky network issue, or changed failure signature is still a plausible cause.
- Do not comment when the same failure signature appeared before the candidate PR, unless you have evidence that the PR made the flaky failure deterministic or changed its signature.
- Do not comment on config-gated PRs until generated config evidence proves the failing case enables the relevant option or path. For Rsbuild-based suites, read [rsbuild-config-debug.md](rsbuild-config-debug.md) when the hypothesis depends on generated Rsbuild/Rspack config.
- Verify the PR is merged before commenting.
- Ask the user for explicit approval before posting. A draft is safe; an actual GitHub comment is not.
- Include the marker at the beginning of the comment:

```text
<agent: daily-job <project> eco-ci>
```

## Required Evidence Before Commenting

Collect and state these facts first:

- The failing suite name.
- The eco-ci run URL or run id.
- The tested commit.
- The failure signature from GitHub Actions logs.
- The first bad commit or PR, with a visible success-to-failure pivot or equivalent canary bisect proof.
- A check that the same signature was not already known as flaky or pre-existing.
- For config-gated hypotheses, evidence from generated suite project config that the relevant option or path is actually enabled.
- Why other plausible causes were ruled out.

If any item is missing, do not post. Continue investigation or provide a draft-only note.

## Comment Workflow

1. Check PR metadata:

```bash
gh pr view <pr-number> --repo <project-repo> --json number,title,state,mergedAt,author,url,headRefOid,mergeCommit
```

2. Refuse to post if `mergedAt` is empty.
3. Prepare a concise English comment with:
   - The required marker.
   - A clear statement that the daily AI eco-ci triage found the failure.
   - The exact suite that failed.
   - The evidence link or run id.
   - The checks that ruled out flake/pre-existing signatures and disabled feature config, when relevant.
   - A short diagnosis, not a full postmortem.
4. Ask the user to approve posting.
5. Post only after approval:

```bash
gh pr comment <pr-number> --repo <project-repo> --body-file <comment-file>
```

## Comment Template

```md
<agent: daily-job <project> eco-ci>

Daily AI eco-ci triage found that this PR is the current best-attributed source of the `<suite>` suite failure in `rstack-ecosystem-ci`.

Evidence:

- Eco-ci run: <run-url-or-id>
- Tested commit: <sha>
- Failure signature: <short-log-or-assertion-summary>
- Flaky/pre-existing check: <same signature not found before candidate | evidence>
- Final config check: <feature enabled | not applicable>

This attribution is based on <success-to-failure pivot | canary bisect | matching current and first-bad signatures> after ruling out <flaky/pre-existing/suite-project/config-gated alternatives>. Please take a look when you have time.
```

If the result is a correction rather than a blame comment, say so explicitly:

```md
<agent: daily-job <project> eco-ci>

Correction from daily AI eco-ci triage: this PR was initially a surface pivot in the eco-ci data, but deeper investigation does not strictly attribute the failure to this PR.

Actual source appears to be <actual-source-summary>. This PR is likely not responsible for the `<suite>` failure.
```
