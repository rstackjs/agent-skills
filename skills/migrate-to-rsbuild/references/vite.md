# Vite -> Rsbuild Migration Checklist

Use this reference when the source project is Vite.

## Checklist

Copy this checklist and check off items as you complete them:

- [ ] Step 0: Read official guide (https://rsbuild.rs/guide/migration/vite) ⛔ BLOCKING
- [ ] Step 1: Inventory Vite-specific behavior
  - [ ] Record plugins + non-default config
  - [ ] Record env/base-path/HTML-transform assumptions
- [ ] Step 2: Execute migration by official guide
  - [ ] Apply guide steps with minimal scope
  - [ ] Map plugin-dependent behavior
- [ ] Step 3: Verify behavior
  - [ ] Dev pass without errors
  - [ ] Build pass without errors
  - [ ] Run type check if required
- [ ] Step 4: Cleanup and summarize
  - [ ] Remove Vite-only deps/config after verification
  - [ ] Summarize remaining manual follow-ups
