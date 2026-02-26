---
name: migrate-vite-to-rsbuild
description: Migrate Vite projects to Rsbuild. Use when a user asks to replace Vite with Rsbuild and complete migration safely.
---

# Vite to Rsbuild Migration

## Workflow

1. **Confirm current setup**
   - Read `package.json` to confirm Vite dependencies and scripts.
   - Locate existing Vite config files such as `vite.config.(js|ts|mjs|cjs)` and project entry structure (`index.html`, `src/main.*`).

2. **Use the official migration guide as the source of truth**
   - Core migration steps must be taken directly from:
     - https://rsbuild.rs/guide/migration/vite

3. **Execute migration with minimal deviation**
   - Follow the guide to replace dependencies, update scripts, and create `rsbuild.config.ts`.
   - Migrate Vite config, plugin replacements, and Vite-specific usage according to the guide.

4. **Validate behavior after migration**
   - Run dev server to verify the project starts without errors.
   - Run production build and preview to verify output is successful.
   - If issues remain, compare the old Vite config with the migration guide and complete missing mappings.
