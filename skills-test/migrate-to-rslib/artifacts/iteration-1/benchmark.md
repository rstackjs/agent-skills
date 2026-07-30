# migrate-to-rslib smoke benchmark

| Configuration | Assertion pass rate | Mean time | Mean tokens |
| ------------- | ------------------: | --------: | ----------: |
| With skill    |                100% |    190.9s |     488,838 |
| Without skill |                 90% |    172.9s |     455,063 |
| Delta         |               +0.10 |    +18.0s |      +33775 |

Smoke scope: two evals, one valid run per configuration per eval. The displayed means and deltas are descriptive only; they do not estimate reliability or variance.

## Analyst notes

- The skill passed all 10 deterministic assertions; the baseline passed 9 of 10.
- The only differentiating assertion was the tsc migration requirement to retain tsconfig.build.json through source.tsconfigPath. The baseline produced valid bundleless output but deleted that file and recreated the relevant compiler options elsewhere.
- All five tsup assertions passed in both configurations, so this case did not discriminate skill value.
- The valid with-skill runs averaged 18.0 seconds and 33,775 tokens more than baseline, but one run per configuration per eval is insufficient for reliability or variance claims.
- The first tsc matched pair was excluded after a transient npm registry/DNS failure invalidated the with-skill run; replacement run-2 used fresh fixtures for both configurations.
- Watch-mode checks in the with-skill runs completed but emitted sandbox EMFILE watcher-limit warnings.
