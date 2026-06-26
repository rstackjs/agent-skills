# Automation Daily Triage

Use this reference for recurring/daily Rstack eco-ci automation runs and latest-status monitoring tasks.

## Trigger

Read this file before inspecting runs when the request:

- Mentions daily triage, automation, latest/today's `<project>` eco-ci status, or `/goal`.
- Provides an automation id, automation memory path, or last-run timestamp.
- Requires sending or delivering the report to a user/chat.
- Asks for all currently failing suites in the latest completed `<project>` eco-ci run.

For a single job, PR, suite, or local reproduction request, use the local quick path in `SKILL.md` instead.

## Process

1. Read the automation memory first. Use it to distinguish reused signatures from new suites or changed signatures.
2. Identify the target project, then the latest completed `<project>-ecosystem-ci-from-commit` run and the previous completed run. Do not use in-progress runs. For Rspack, prefer `scripts/rspack-status.sh --repo <ecosystem-ci-path>` from the skill directory when a local `rstack-ecosystem-ci` checkout is available, or pass a local `rspack.json` snapshot path directly. For other projects, inspect the matching status JSON from the local checkout, a local `<project>.json` snapshot, or the matching workflow history directly.
3. List every currently failing suite, job URL, run URL, and tested commit.
4. Compare latest vs previous completed run:
   - `reused`: same suite and same failure signature as memory/current sampled log.
   - `new-suite`: suite is failing now but was not failing in the previous completed run.
   - `new-signature`: suite was already failing, but the current failure signature changed.
   - `recovered`: suite was failing previously but is no longer current; mention only in the summary.
5. For reused suites, sample the current log enough to confirm the signature still matches memory before reusing the conclusion.
6. For `new-suite` or `new-signature`, run Phase 1. Run Phase 2 only when Phase 1 finds a non-flaky candidate target project PR or version window with enough evidence.
7. If the automation asks to comment on PRs, read `pr-report-comment.md` and comment only when its guardrails are satisfied. Otherwise include `no PR comment: <reason>` in the report.
8. If the automation asks to deliver the report, send it only after the report content is final.
9. Update automation memory with:
   - current run time,
   - latest and previous run ids/URLs,
   - current failing suite set,
   - per-suite signature and attribution,
   - delivery message id, if any,
   - PR comment links, if any.

## Report Notes

Use the triage report contract from `SKILL.md`, with these daily-specific fields:

```text
Scope: latest completed status.
Current run/job: <latest completed run-url>, testing <sha> — "<commit msg>".
Comparison baseline: previous completed run <run-url>, testing <sha>.
Failing suites in scope: <suite list>.
Delta: <new-suite/new-signature/recovered/unchanged summary>.
PR comments: <posted links or "none: <reason>">.
```

Every currently failing suite still gets its own short section. Do not include recovered suites as failing-suite sections.
