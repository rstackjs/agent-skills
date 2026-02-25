# Rstest Compatibility Pitfalls (Vitest/Jest Migration)

Use this reference when migration passes static replacement but runtime tests still fail due to Rspack-specific runtime behavior that is not covered by general migration docs.

For general migration pitfalls (globals mode, setup adapters, mock factory/hoisting, path resolution), use the official Vitest migration guide first:
https://rstest.rs/guide/migration/vitest

## Re-export mock target mismatch under Rspack

When runtime resolves through source module instead of re-export module, migrated mocks may appear ignored.

- First follow `references/provided-exports-troubleshooting.md`.
- If needed, temporarily stabilize build optimization and re-target mock to the actually resolved module.
