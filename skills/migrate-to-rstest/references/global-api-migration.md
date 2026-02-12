# Global API Migration

Use this reference when tests rely on globally available test APIs.

## Required replacements

- Replace global `jest.xxx` with `rstest.xxx`.
- If Vitest enables `globals: true`, replace global `vi.xxx` with `rstest.xxx`.
- If Vitest enables `globals: true`, replace global `vitest.xxx` with `rstest.xxx`.

## Scope

Apply this to test files and setup files where global runner APIs are used.

## Examples

```ts
// Jest
jest.fn() -> rstest.fn()
jest.spyOn(obj, 'm') -> rstest.spyOn(obj, 'm')
```

```ts
// Vitest (globals: true)
vi.fn() -> rstest.fn()
vitest.spyOn(obj, 'm') -> rstest.spyOn(obj, 'm')
```

## Notes

- Do not change assertion intent while replacing APIs.
- Keep replacements minimal and focused on runner API migration.
