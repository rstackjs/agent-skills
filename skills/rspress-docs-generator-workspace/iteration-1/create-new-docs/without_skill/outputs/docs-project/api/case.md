# Case Utilities

Functions for converting strings between common naming conventions.

## camelCase

Converts a string to camelCase.

```ts
function camelCase(input: string): string
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | The string to convert |

### Returns

`string` — The camelCase version of the input.

### Examples

```ts
import { camelCase } from 'string-kit';

camelCase('hello world');     // 'helloWorld'
camelCase('hello-world');     // 'helloWorld'
camelCase('hello_world');     // 'helloWorld'
camelCase('Hello World');     // 'helloWorld'
```

---

## kebabCase

Converts a string to kebab-case.

```ts
function kebabCase(input: string): string
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | The string to convert |

### Returns

`string` — The kebab-case version of the input.

### Examples

```ts
import { kebabCase } from 'string-kit';

kebabCase('hello world');     // 'hello-world'
kebabCase('helloWorld');      // 'hello-world'
kebabCase('hello_world');     // 'hello-world'
kebabCase('Hello World');     // 'hello-world'
```

---

## snakeCase

Converts a string to snake_case.

```ts
function snakeCase(input: string): string
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | The string to convert |

### Returns

`string` — The snake_case version of the input.

### Examples

```ts
import { snakeCase } from 'string-kit';

snakeCase('hello world');     // 'hello_world'
snakeCase('helloWorld');      // 'hello_world'
snakeCase('hello-world');     // 'hello_world'
snakeCase('Hello World');     // 'hello_world'
```
