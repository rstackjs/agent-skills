# AGENTS.md

This file provides guidance to AI coding agents working with code in this repository.

## Repository Overview

A collection of Agent Skills for the Rspack ecosystem (Rspack, Rsbuild, Rslib, Rstest, Rsdoctor). Skills are packaged instructions and scripts that extend agent capabilities for debugging, profiling, and development workflows.

## Stack

This project uses Rstack CLI as its JS toolchain:

- Read the docs linked from `node_modules/rstack/docs/llms.txt` when needed
- Online docs: https://rstack.rs/llms.txt
- Run `rs -h` for CLI help

## Project Structure

```
agent-skills/
├── skills/              # Skills directory, contains all Skills
├── .agents/skills/      # Developer-facing Skills for Rstack repository maintenance
├── packages/            # Source code projects for complex scripts
├── scripts/             # Project-level configurations and tools
│   └── config/          # Shared library and TypeScript configurations
├── .rstack/hooks/       # Repository Git hooks
├── rstack.config.mts    # Lint, formatting, and staged-file configuration
├── pnpm-workspace.yaml  # pnpm workspace configuration
├── pnpm-lock.yaml       # Dependency lock file
├── package.json         # Project configuration file
└── README.md            # Project documentation
```

### Directory Explanations

- **skills/**: Contains all Skills, each Skill is an independent folder
  - Each Skill includes `SKILL.md` (required), `scripts/` (optional), `references/` (optional), `assets/` (optional)
- **.agents/skills/**: Contains Skills used for Rstack repository maintenance
  - These Skills are primarily for repository developers and maintainers, not end users
- **packages/**: Contains source code for complex scripts that need compilation
  - Corresponds to Skills with the same name in the skills directory
  - Compiled by Rslib through Rstack CLI and output to the corresponding `skills/{skill-name}/scripts/` directory
- **scripts/config/**: Contains project-level common configurations
  - `lib.ts`: shared Rslib options, typed through `rstack/lib`
  - `tsconfig.json`: TypeScript base configuration

## Creating a New Skill

Create the Skill directory manually with the standard structure:

```
{skill-name}/
├── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable scripts
├── references/       # Optional: reference documentation
└── assets/           # Optional: templates, resource files
```

Write the Skill content with the use cases, workflow, examples, and links to detailed references when needed.

`SKILL.md` frontmatter field requirements:

- **name** (required): unique Skill identifier, maximum 64 characters, lowercase letters/numbers/hyphens only, and must not start or end with a hyphen.
- **description** (required): feature description and trigger scenarios, maximum 1024 characters. Include concrete trigger keywords, such as "when user encounters segmentation fault in Rspack".
- **metadata.internal** (optional): set to `true` only for Rstack maintainer/developer Skills that should be hidden from normal discovery and installation.

### User-facing Skills

Use this for installable Skills intended for Rspack ecosystem users.

- Place the Skill in `skills/{skill-name}/`.
- Reference bundled scripts, references, and assets with paths relative to the
  Skill root. Do not rely on client-specific environment variables or
  installation layouts.

Start `SKILL.md` with YAML frontmatter:

```yaml
---
name: my-skill
description: Feature description and trigger scenarios, which is key for Agents to determine whether to use this Skill
---
```

### Contribution Workflow Skills

Use this for internal contribution workflow Skills intended for Rstack repository maintainers and developers, not end users.

- Place the Skill in `.agents/skills/{skill-name}/`.
- Register the Skill in `skills.json` with `"local:*"` so it resolves to the repo-owned Skill source.
- Add `metadata.internal: true` so the Skill is hidden from normal discovery and installation.

```json
{
  "skills": {
    "my-internal-skill": "local:*"
  }
}
```

```yaml
---
name: my-internal-skill
description: Internal workflow for repository maintainers
metadata:
  internal: true
---
```

Skills marked with `metadata.internal: true` are only visible and installable when `INSTALL_INTERNAL_SKILLS=1` is set.

## Writing Skill Scripts

### Simple Scripts

For simple scripts (such as single-file scripts), create them directly in the Skill's own `scripts/` directory.

Example:

```javascript
// skills/my-skill/scripts/simple.js or .agents/skills/my-skill/scripts/simple.js
console.log('Hello from simple script');
```

### Complex Scripts (Requiring Bundling)

For complex scenarios requiring dependencies, TypeScript, etc.:

#### 1. Create a Project with the Same Name in packages Directory

```
packages/my-skill/
├── package.json
├── rstack.config.ts
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
    "build": "rs lib",
    "test": "rs test"
  },
  "devDependencies": {
    "@rstackjs/config": "workspace:*",
    "rstack": "^0.7.2"
  },
  "dependencies": {
    // Your dependencies
  }
}
```

#### 3. Configure rstack.config.ts

```typescript
import { basename, join } from 'node:path';
import { define } from 'rstack';
import { baseConfig } from '@rstackjs/config/lib.ts';

const pkgName = basename(import.meta.dirname);

define.lib({
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
import { describe, it, expect } from 'rstack/test';
import { myFunction } from './index';

describe('myFunction', () => {
  it('should work correctly', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

Run tests from the package directory:

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
- [vercel-labs/skills](https://github.com/vercel-labs/skills)
- [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Rspack Documentation](https://rspack.rs)
- [Rspress Documentation](https://rspress.rs)
- [Rsbuild Documentation](https://rsbuild.rs)
- [Rslib Documentation](https://rslib.rs)
- [Rstest Documentation](https://rstest.rs)
- [Rsdoctor Documentation](https://rsdoctor.rs)
- [Rslint Documentation](https://rslint.rs)
- [Rstack CLI Documentation](https://rstack.rs)
