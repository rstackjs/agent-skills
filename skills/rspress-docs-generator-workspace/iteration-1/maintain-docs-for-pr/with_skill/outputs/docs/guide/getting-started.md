---
title: Getting Started
---

# Getting Started

Install the package:

```bash
npm install format-bytes-project
```

Use the `camelCase` utility:

```ts
import { camelCase } from 'format-bytes-project';

camelCase('hello world'); // 'helloWorld'
```

Use the `formatBytes` utility:

```ts
import { formatBytes } from 'format-bytes-project';

formatBytes(1024);              // '1 KB'
formatBytes(1048576);           // '1 MB'
formatBytes(1536, { decimals: 1 }); // '1.5 KB'
```
