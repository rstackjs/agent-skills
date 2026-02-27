# Vue CLI -> Rsbuild Migration Checklist

Use this reference when the source project is Vue CLI (`@vue/cli-service`).

## Checklist

Copy this checklist and check off items as you complete them:

- [ ] Step 0: Read official guide (https://rsbuild.rs/guide/migration/vue-cli) ⛔ BLOCKING
- [ ] Step 1: Inventory Vue CLI-specific behavior
  - [ ] Record `vue.config.*` customizations (`configureWebpack`, `chainWebpack`, `devServer`, `css.loaderOptions`, `publicPath`)
  - [ ] Record Vue CLI plugins (`@vue/cli-plugin-*`) and any plugin-dependent behavior
- [ ] Step 2: Execute migration by official guide
  - [ ] Apply guide steps with minimal scope
  - [ ] Map Vue CLI config/plugin behavior
- [ ] Step 3: Verify behavior
  - [ ] Dev pass without errors
  - [ ] Build pass without errors
  - [ ] Run type check if required
- [ ] Step 4: Cleanup and summarize
  - [ ] Remove Vue CLI-only deps/config after verification
  - [ ] Summarize remaining manual follow-ups
