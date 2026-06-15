---
title: Getting Started
---

# Getting Started

## Installation

Install `string-kit` via your preferred package manager:

```bash
npm install string-kit
```

## Usage

Import the utilities you need:

```ts
import { camelCase, kebabCase, snakeCase, truncate, ellipsis } from 'string-kit';
```

## Case Utilities

Convert strings between different casing conventions:

```ts
camelCase('hello world');  // 'helloWorld'
kebabCase('hello world');  // 'hello-world'
snakeCase('hello world');  // 'hello_world'
```

## Truncate Utilities

Shorten strings with an ellipsis:

```ts
truncate('hello world', 5);  // 'hello...'
ellipsis('hello world', 8);  // 'hello...'
```

See the [API Reference](/api/) for full details on each function.
