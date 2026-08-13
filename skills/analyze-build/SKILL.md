---
name: analyze-build
description: Use when summarizing Rstack build health, errors, chunks, packages, bundle opportunities, or build-wide tree-shaking evidence from an Rsdoctor artifact.
---

# Analyze an Rstack build

1. Call `project_status` to establish available contexts and latest build observations. Analysis may still proceed from an explicit artifact when no context exists.
2. Obtain the explicit Rsdoctor `dataFile`. If it is missing, identify the product and inspect the matching `@rsdoctor/rspack-plugin` or `@rsdoctor/webpack-plugin` version before offering a capture. Use `RSDOCTOR_OUTPUT=json` only when the plugin version is at least `1.5.11`. For a missing, unknown, or older plugin, follow the `rsdoctor-analysis` Generation Gate: install/register the plugin when missing, configure `output.mode='brief'` with JSON output, and build with `RSDOCTOR=true` without `RSDOCTOR_OUTPUT`. Use `rs build` for an application or `rs lib` for a library, include `RSTACK_CONTEXT=1`, and ask before installing, configuring, building, or capturing.
3. When a context exists, call `product_roots` with the same `contextId` and `dataFile`. Use context-bound claims only when `artifactBinding` is `exact`; report `mismatch` or `explicit-unverified` as artifact-only evidence.
4. Call `rsdoctor_analyze` with the narrowest suitable tool: `build_summary`, `errors_list`, `chunks_list`, `bundle_optimize`, one `tree_shaking_*` view, or one `packages_*` view.
5. Treat omitted sections as unavailable. Reserve zero or healthy labels for evidence the tool actually returned.
6. Call `report_link` only when an optional navigable report would materially help.

Never require a GUI or infer source execution or repository-wide dead code from an artifact.

If Rstack Context is unavailable, use the `rsdoctor-analysis` skill with the explicit artifact instead.
