---
title: API Reference
---

# API Reference

## Case Utilities

### `camelCase(input: string): string`

Converts a string to camelCase.

```ts
import { camelCase } from 'string-kit';

camelCase('hello world');  // 'helloWorld'
camelCase('foo-bar');      // 'fooBar'
camelCase('snake_case');   // 'snakeCase'
```

### `kebabCase(input: string): string`

Converts a string to kebab-case.

```ts
import { kebabCase } from 'string-kit';

kebabCase('hello world');  // 'hello-world'
kebabCase('fooBar');       // 'foo-bar'
kebabCase('snake_case');   // 'snake-case'
```

### `snakeCase(input: string): string`

Converts a string to snake_case.

```ts
import { snakeCase } from 'string-kit';

snakeCase('hello world');  // 'hello_world'
snakeCase('fooBar');       // 'foo_bar'
snakeCase('foo-bar');      // 'foo_bar'
```

## Truncate Utilities

### `truncate(input: string, maxLength: number): string`

Truncates a string to a maximum length, appending an ellipsis if truncated.

```ts
import { truncate } from 'string-kit';

truncate('hello world', 5);  // 'hello...'
truncate('hello world', 20); // 'hello world'
```

### `ellipsis(input: string, maxLength: number): string`

Truncates a string and always appends an ellipsis if it exceeds `maxLength`. Reserves three characters for the ellipsis.

```ts
import { ellipsis } from 'string-kit';

ellipsis('hello world', 8);  // 'hello...'
ellipsis('hello world', 20); // 'hello world'
```
