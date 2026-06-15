# Truncate Utilities

Functions for truncating strings with ellipsis handling.

## truncate

Truncates a string to a maximum length, appending an ellipsis if truncated.

```ts
function truncate(input: string, maxLength: number): string
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | The string to truncate |
| `maxLength` | `number` | The maximum length of the output string |

### Returns

`string` — The truncated string, or the original if it fits within `maxLength`.

### Examples

```ts
import { truncate } from 'string-kit';

truncate('hello world', 5);   // 'hello...' (5 + 3 = 8 chars)
truncate('hello world', 20);  // 'hello world' (fits, no truncation)
truncate('hello world', 0);   // '...' (empty + ellipsis)
```

### Notes

The `truncate` function appends `...` (3 characters) to the sliced portion. The total output length will be `maxLength + 3` when truncation occurs. If you need the total output to be exactly `maxLength`, use `ellipsis` instead.

---

## ellipsis

Truncates a string and always appends an ellipsis if it exceeds maxLength. Reserves three characters for the ellipsis.

```ts
function ellipsis(input: string, maxLength: number): string
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | The string to truncate |
| `maxLength` | `number` | The maximum length of the output string |

### Returns

`string` — The truncated string with ellipsis, or the original if it fits within `maxLength`.

### Examples

```ts
import { ellipsis } from 'string-kit';

ellipsis('hello world', 8);   // 'hello...' (exactly 8 chars)
ellipsis('hello world', 20);  // 'hello world' (fits, no truncation)
ellipsis('hello world', 3);   // '...' (only room for ellipsis)
```

### Notes

The `ellipsis` function ensures the total output length never exceeds `maxLength`. It reserves 3 characters for `...`, so the content portion is at most `maxLength - 3` characters. When `maxLength` is less than 3, the result is still `...`.

## Comparison

| Function | Output length when truncated | Use when... |
|----------|------------------------------|-------------|
| `truncate` | `maxLength + 3` | You want up to `maxLength` content chars, ellipsis is extra |
| `ellipsis` | `maxLength` | You want the total output to fit within `maxLength` chars |
