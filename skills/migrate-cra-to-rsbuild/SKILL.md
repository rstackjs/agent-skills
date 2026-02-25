---
name: migrate-cra-to-rsbuild
description: Migrate Create React App (CRA) or CRACO projects to Rsbuild. Use when a user asks to replace react-scripts or CRACO with Rsbuild and complete the migration safely.
---

# CRA to Rsbuild Migration

## Workflow

1. **Confirm current setup**
   - Read `package.json` to confirm whether the project uses `react-scripts` (CRA) or `@craco/craco` (CRACO).
   - Locate existing config files such as `craco.config.(js|ts|mjs|cjs)` and any custom webpack overrides.

2. **Use the official migration guide as the source of truth**
   - Core migration steps must be taken directly from:
     - https://rsbuild.rs/guide/migration/cra

3. **Execute migration with minimal deviation**
   - Follow the guide to update dependencies and scripts.
   - Apply Rsbuild config changes according to the guide’s instructions.
   - If the project has CRACO-only customizations, map them to Rsbuild/Rspack equivalents after finishing the baseline guide steps.

4. **Validate behavior after migration**
   - Run dev server to verify the project starts up without errors.
   - Run build commands to verify the project builds successfully.
