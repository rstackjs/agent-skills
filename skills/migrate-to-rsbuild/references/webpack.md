# webpack -> Rsbuild Migration Checklist

Use this reference when the source project is webpack.

## Checklist

Copy this checklist and check off items as you complete them:

- [ ] Step 0: Read official guide (https://rsbuild.rs/guide/migration/webpack) ⛔ BLOCKING
- [ ] Step 1: Inventory webpack-specific customizations
  - [ ] Record config entry points + custom loaders/plugins
  - [ ] Record dev-server + output/base-path assumptions
- [ ] Step 2: Execute migration by official guide
  - [ ] Apply guide steps with minimal scope
  - [ ] Map required customizations
- [ ] Step 3: Verify behavior
  - [ ] Dev pass without errors
  - [ ] Build pass without errors
  - [ ] Run type check if required
- [ ] Step 4: Cleanup and summarize
  - [ ] Remove webpack-only deps/config after verification
  - [ ] Summarize remaining manual follow-ups
