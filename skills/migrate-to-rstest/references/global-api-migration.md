# Global API Migration

Use this reference when tests rely on globally available test APIs.

## Required replacements

- Replace global `jest.<api>` with global `rstest.<api>`.
- If Vitest enables `globals: true`, replace global `vi.<api>` with global `rs.<api>`.
- If Vitest enables `globals: true`, replace global `vitest.<api>` with global `rstest.<api>`.

## Scope

Apply this only to test files and setup files where runner APIs are used as globals.

## Examples

```ts
// Jest
jest.fn() -> rstest.fn()
jest.spyOn(obj, 'm') -> rstest.spyOn(obj, 'm')
```

```ts
// Vitest (globals: true)
vi.fn() -> rs.fn()
vitest.spyOn(obj, 'm') -> rstest.spyOn(obj, 'm')
```

## Notes

- `rs` and `rstest` are equivalent aliases in globals mode; keep `vi -> rs` and `vitest -> rstest` mapping order for consistency.
- Do not apply these replacements to import-style APIs; this reference is global-only.
- Do not change assertion intent while replacing APIs.
- Keep replacements minimal and focused on runner API migration.
