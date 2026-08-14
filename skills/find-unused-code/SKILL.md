---
name: find-unused-code
description: Use when listing or prioritizing artifact-scoped Rstack modules that are unreachable from observed product and contract roots.
---

# Find unused-code candidates

1. Call `project_status` and select the matching build context. Deduplicate repeated runs by `contextId`.
2. Obtain the explicit Rsdoctor `dataFile`; offer the matching consent-gated application or library capture if absent.
3. Call `product_roots` with `contextId` and `dataFile`, then report production, published-contract, and conservative roots plus graph issues.
4. Call `unused_candidates` with the same inputs and an optional `limit` from 1 to 100. Prefer project-owned source modules. If `ownership.project` is zero, stop without paging and say the artifact has no project-owned candidate.
5. Follow `nextCursor` only for a requested exhaustive inventory. Reuse unchanged filters.
6. Call `dead_code_explain` for the strongest candidate. Add `code_evidence` when compatible test or execution evidence helps prioritize it. If no relation was captured and the user approves running tests, call `test_snapshot` with `related: [path]` for that one source, then reuse its snapshot ID.
7. Keep statically related tests, exact-path test outcomes, and aggregate execution coverage independent. `unrelated` is meaningful only for an isolated one-source relation capture; it is still not deletion proof.
8. Report root exhaustion, state axes, truncation, bounds, provenance, and artifact binding.

Call every result an **artifact-scoped unreachable module candidate**. Completely unimported files are outside the artifact graph, and no candidate is deletion proof.

Rstest, Rslint, coverage, and Rsdoctor observations are independent optional evidence. Do not install, configure, or run a missing producer just to fill an axis; report it as unavailable and continue with the evidence that exists.
