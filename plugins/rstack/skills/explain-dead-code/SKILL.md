---
name: explain-dead-code
description: Use when explaining why one Rstack artifact module is reachable, conservatively preserved, retained, shipped, or apparently unused.
---

# Explain an artifact module

1. Call `project_status` and select the matching build context by package root, product, environment, and target.
2. Confirm the subject is an artifact module selector. Local symbols and exports require source analysis.
3. Obtain the explicit Rsdoctor `dataFile`; offer a consent-gated application or library capture if it is absent.
4. Call `dead_code_explain` with `contextId`, `dataFile`, and the module selector.
5. Lead with the returned classification: reachable, conservatively preserved, unreachable candidate, or insufficient evidence.
6. Show one shortest root-to-module path when present. Report production reachability, public contract, shipment, optimizer retention, truncation, bounds, provenance, and `artifactBinding`.
7. When test or runtime evidence helps, call `code_evidence` with the exact checkout-relative path and matching artifact selector. If no relation was captured and the user approves running tests, call `test_snapshot` with `related: [path]` for that one source, then query its snapshot ID.
8. Keep statically related tests, exact-path test outcomes, and aggregate execution coverage independent. A source can be production-reachable but unobserved in one test run, or test-related without being executed.

Never infer local-symbol usage. Aggregate execution does not prove code is dead.

Rstest, Rslint, coverage, and Rsdoctor observations are independent optional evidence. A build-only or library-only repository can still answer artifact questions; report missing axes as unavailable without requiring full-stack adoption.
