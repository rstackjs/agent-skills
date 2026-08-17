---
name: assess-change-impact
description: Use when estimating artifact-scoped dependents, affected product roots, or bundled chunks for one Rstack module.
---

# Assess artifact module impact

1. Call `project_status` and select the context whose package root, product, environment, and target match the build. Deduplicate repeated runs by `contextId`.
2. Confirm the subject is an artifact module ID, exact path/name, or unique suffix. Route function, class, export, and other source-symbol questions to source analysis.
3. Obtain the explicit Rsdoctor `dataFile`. If it is missing, inspect the matching Rsdoctor plugin version before offering a capture. Use `RSDOCTOR_OUTPUT=json` only when the plugin version is at least `1.5.11`. For a missing, unknown, or older plugin, follow the `rsdoctor-analysis` Generation Gate: install/register the plugin when missing, configure `output.mode='brief'` with JSON output, and build with `RSDOCTOR=true` without `RSDOCTOR_OUTPUT`. Use `rs build` for an application or `rs lib` for a library, include `RSTACK_CONTEXT=1`, and ask before installing, configuring, building, or capturing.
4. Call `module_impact` with `direction: "dependents"` and an optional `maxDepth` from 1 to 16.
5. Report visited dependents, `totalVisited` versus `returned`, reached product roots by kind, distinct chunks, truncation, bounds, and provenance.

Describe only the explicit artifact graph. Source-only, test-only, runtime-created, and external consumers may be unobserved.

The MCP is intentionally limited to the checkout containing the Codex project/session root and has no workspace argument. For an external checkout, ask the user to start a new Codex session rooted at that checkout.
