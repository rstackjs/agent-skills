---
name: migrate-webpack-to-rsbuild
description: Migrate webpack projects to Rsbuild. Use when a user asks to replace webpack with Rsbuild and complete migration safely.
---

# webpack to Rsbuild Migration

## Workflow

1. **Confirm current setup**
   - Read `package.json` to confirm webpack dependencies and scripts.
   - Locate existing webpack config files such as `webpack.config.(js|ts|mjs|cjs)` and related custom build scripts.

2. **Use the official migration guide as the source of truth**
   - Core migration steps must be taken directly from:
     - https://rsbuild.rs/guide/migration/webpack

3. **Execute migration with minimal deviation**
   - Follow the guide to replace dependencies, update npm scripts, and create `rsbuild.config.ts`.
   - Migrate only required webpack customizations to Rsbuild/Rspack equivalents (for example `tools.rspack`, `source.entry`, and relevant Rsbuild plugins).

4. **Validate behavior after migration**
   - Run dev server to verify the project starts without errors.
   - Run build command to verify the project builds successfully.
   - If issues remain, compare old webpack config with the migration guide and complete missing mappings.
