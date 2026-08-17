# CRA / CRACO -> Rsbuild Migration Checklist

Use this reference when the source project is Create React App (`react-scripts`) or CRACO.

## Checklist

Copy this checklist and check off items as you complete them:

- [ ] Step 0: Read official guide (https://rsbuild.rs/guide/migration/cra) ⛔ BLOCKING
- [ ] Step 1: Inventory CRA/CRACO-specific behavior
- [ ] Step 2: Execute migration by official guide
  - [ ] Apply guide steps with minimal scope
  - [ ] Map CRA/CRACO custom behavior
- [ ] Step 3: Apply CRACO-specific follow-up (conditional)
  - [ ] If CRACO is used, verify overrides are preserved or intentionally removed
- [ ] Step 4: Verify behavior
  - [ ] Dev pass without errors
  - [ ] Build pass without errors
  - [ ] Run type check if required
- [ ] Step 5: Cleanup and summarize
  - [ ] Remove CRA/CRACO-only deps/config after verification
  - [ ] Summarize remaining manual follow-ups
