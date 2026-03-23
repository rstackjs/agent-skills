# Rstest Compatibility Pitfalls (Vitest/Jest Migration)

Use this reference when migration passes static replacement but runtime tests still fail due to Rspack-specific runtime behavior that is not covered by general migration docs.

For general migration pitfalls (globals mode, setup adapters, mock factory/hoisting, path resolution), use the official Vitest migration guide first:
https://rstest.rs/guide/migration/vitest

## Re-export mock target mismatch under Rspack (legacy)

This issue was fixed in `rstest v0.9.3`.
Treat this section as a legacy note only for projects pinned to `rstest < 0.9.3`.

- Confirm the project is using `rstest < 0.9.3`, then upgrade to `rstest >= 0.9.3` before debugging mock behavior further.
