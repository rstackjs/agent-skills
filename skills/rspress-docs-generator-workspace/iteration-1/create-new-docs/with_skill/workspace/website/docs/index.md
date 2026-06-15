---
title: string-kit
---

# string-kit

A small collection of string utilities for everyday use.

## Installation

```bash
npm install string-kit
```

## Quick Start

```ts
import { camelCase, kebabCase, snakeCase, truncate, ellipsis } from 'string-kit';

camelCase('hello world'); // 'helloWorld'
kebabCase('hello world'); // 'hello-world'
snakeCase('hello world'); // 'hello_world'
truncate('hello world', 5); // 'hello...'
ellipsis('hello world', 8); // 'hello...'
```
