---
name: assess-change-impact
description: Use when estimating artifact-scoped dependents, affected product roots, or bundled chunks for one Rstack module.
---

# Assess artifact module impact

1. Call `project_status` and select the context whose package root, product, environment, and target match the build. Deduplicate repeated runs by `contextId`.
2. Confirm the subject is an artifact module ID, exact path/name, or unique suffix. Route function, class, export, and other source-symbol questions to source analysis.
3. Obtain the explicit Rsdoctor `dataFile`. If missing, offer the matching `RSTACK_CONTEXT=1 RSDOCTOR=true RSDOCTOR_OUTPUT=json rs build` or `rs lib` capture and ask before running it.
4. Call `module_impact` with `direction: "dependents"` and an optional `maxDepth` from 1 to 16.
5. Report visited dependents, `totalVisited` versus `returned`, reached product roots by kind, distinct chunks, truncation, bounds, and provenance.

Describe only the explicit artifact graph. Source-only, test-only, runtime-created, and external consumers may be unobserved.
