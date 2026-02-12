# ProvidedExports Troubleshooting (Rspack + Mock-heavy tests)

Use this reference when mock behavior changes after migrating to Rstest.

## When to suspect this

- Tests import and mock a re-export module (for example `foo-dom` re-exporting from `foo-core`).
- Mock appears to be ignored after migration.
- Failures are concentrated in module-mock tests, especially with `rs.mock('re-export-module', ...)`.
- Runtime behavior suggests code is resolved from source module, not the re-export module.

## Why it happens

Rspack may optimize re-exports with `optimization.providedExports`.
After optimization, runtime can bypass the re-export layer, so your mock target no longer matches what is actually executed.

## Migration-safe handling order

1. Temporarily disable `providedExports` to stabilize migration.
2. Migrate tests until green.
3. Re-enable `providedExports` and re-run tests.
4. If failures return, either keep `providedExports: false` temporarily or change mocks to the actual resolved source module.

## Temporary config snippet

```ts
export default defineConfig({
  tools: {
    rspack: {
      optimization: {
        providedExports: false,
      },
    },
  },
});
```

## Mock target adjustment example

If code imports from `react-router-dom` but runtime resolves to `react-router`, mock `react-router`:

```ts
rs.mock('react-router', () => ({
  useParams: () => ({ id: 'mocked-id' }),
}));
```

## Migration summary requirements

If this workaround is used, record:

- where `providedExports` was changed,
- whether the change is temporary or permanent,
- which tests/modules still rely on it,
- next cleanup action (re-enable and retest scope).
