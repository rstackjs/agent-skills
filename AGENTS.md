# AGENTS.md

This file provides guidance to AI coding agents working with code in this repository.

## Repository Overview

A collection of Agent Skills for the Rspack ecosystem (Rspack, Rsbuild, Rslib, Rstest, Rsdoctor). Skills are packaged instructions and scripts that extend agent capabilities for debugging, profiling, and development workflows.

## Project Structure

```
agent-skills/
├── skills/              # Skills directory, contains all Skills
├── packages/            # Source code projects for complex scripts
├── scripts/             # Project-level configurations and tools
│   └── config/          # Common configurations (rslib, tsconfig, etc.)
├── biome.json           # Biome code formatting configuration
├── pnpm-workspace.yaml  # pnpm workspace configuration
├── pnpm-lock.yaml       # Dependency lock file
├── package.json         # Project configuration file
└── README.md            # Project documentation
```

### Directory Explanations

- **skills/**: Contains all Skills, each Skill is an independent folder
  - Each Skill includes `SKILL.md` (required), `scripts/` (optional), `references/` (optional), `assets/` (optional)
- **packages/**: Contains source code for complex scripts that need compilation
  - Corresponds to Skills with the same name in the skills directory
  - Compiled by Rslib and output to the corresponding `skills/{skill-name}/scripts/` directory
- **scripts/config/**: Contains project-level common configurations
  - `rslib.config.ts`: Rslib base configuration
  - `tsconfig.json`: TypeScript base configuration

## Creating a New Skill

### 1. Initialize Skill Template

Execute in the `skills/` directory:

```bash
cd skills
npx skills init my-skill
```

This will generate a `SKILL.md` file with YAML front-matter and Markdown content.

### 2. Configure Front-matter

Configure in the YAML front-matter at the top of the `SKILL.md` file:

```yaml
---
name: my-skill
description: Feature description and trigger scenarios, which is key for Agents to determine whether to use this Skill
---
```

**Field Descriptions**:

- **name** (required)
  - Unique identifier for the Skill
  - Maximum 64 characters
  - Only lowercase letters, numbers, and hyphens
  - Must not start or end with a hyphen
  - Example: `rspack-tracing`

- **description** (required)
  - Feature description and trigger scenarios
  - Maximum 1024 characters
  - Recommended to include trigger keywords, such as "when user encounters segmentation fault in Rspack"

### 3. Write Skill Content

Standard Skill structure:

```
my-skill/
├── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable scripts
├── references/       # Optional: reference documentation
└── assets/           # Optional: templates, resource files
```

Write in `SKILL.md`:

- **Use Cases**: Explain when to use this Skill
- **Workflow**: Detailed operation steps
- **Code Examples**: Provide code examples
- **Reference Documentation**: Link to detailed documentation in the `references/` directory

## Writing Skill Scripts

### Simple Scripts

For simple scripts (such as single-file scripts), create them directly in the `skills/{skill-name}/scripts/` directory.

Example:

```javascript
// skills/my-skill/scripts/simple.js
console.log('Hello from simple script');
```

### Complex Scripts (Requiring Bundling)

For complex scenarios requiring dependencies, TypeScript, etc.:

#### 1. Create a Project with the Same Name in packages Directory

```
packages/my-skill/
├── package.json
├── rslib.config.ts
├── tsconfig.json
└── src/
    └── index.ts
```

#### 2. Configure package.json

```json
{
  "name": "@rstackjs/my-skill",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "build": "rslib build",
    "test": "rstest"
  },
  "dependencies": {
    // Your dependencies
  }
}
```

#### 3. Configure rslib.config.ts

```typescript
import { basename, join } from 'node:path';
import { defineConfig } from '@rslib/core';
import { baseConfig } from '@rstackjs/config/rslib.config.ts';

const pkgName = basename(import.meta.dirname);

export default defineConfig({
  lib: [
    {
      ...baseConfig,
      output: {
        distPath: join(import.meta.dirname, `../../skills/${pkgName}/scripts`),
      },
    },
  ],
});
```

#### 4. Configure tsconfig.json

```json
{
  "extends": "@rstackjs/config/tsconfig",
  "compilerOptions": {},
  "include": ["src"]
}
```

#### 5. Write Source Code

Write code in `src/index.ts`:

```typescript
export function myFunction() {
  // Your logic
}
```

#### 6. Build Script

```bash
cd packages/my-skill
pnpm build
```

After building, the bundled files will be automatically output to the `skills/my-skill/scripts/` directory.

### Testing Scripts

Write tests using Rstest:

```typescript
// packages/my-skill/src/index.test.ts
import { describe, it, expect } from '@rstest/core';
import { myFunction } from './index';

describe('myFunction', () => {
  it('should work correctly', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

Run tests:

```bash
pnpm test
```

## Using Skills

Install a specific Skill:

```bash
npx skills add rstackjs/agent-skills --skill my-skill
```

## References

- [Agent Skills Specification](https://agentskills.io/specification)
- [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Rspack Documentation](https://rspack.rs)
- [Rslib Documentation](https://rslib.rs)
- [Rstest Documentation](https://rslib.rs)
