# Playwright migration deltas

Read this reference only when the migration request explicitly contains the keyword `playwright`. It covers Playwright Test E2E suites moving to `@rstest/playwright`; it is not a generic browser or DOM-testing guide.

## Contents

- [Version baseline](#version-baseline)
- [Default parity audit](#default-parity-audit)
- [Configuration and assertion timeouts](#configuration-and-assertion-timeouts)
- [Imports and `test.extend`](#imports-and-testextend)
- [Custom fixtures](#custom-fixtures)
- [`isolate: false`](#isolate-false)
- [Chrome in CI](#chrome-in-ci)
- [Migration checks](#migration-checks)

## Version baseline

This reference targets Rstest 0.12.0 or newer, including `definePlaywrightConfig` and configurable Playwright assertion timeouts. Follow the dependency install gate and verify the resolved `@rstest/core`, `@rstest/playwright`, and `playwright` versions against their peer ranges before using these APIs. See the [E2E testing guide](https://rstest.rs/guide/basic/e2e-testing).

For a target pinned to 0.11.9–0.11.x, keep shared options in `test.extend` and set runner/poll timeouts explicitly: the config helper is unavailable, and locator/page assertions default to 5 seconds independently of `expect.poll.timeout`. Use per-call matcher timeouts on that line. Do not apply the 0.12.0 examples without verifying an upgrade is compatible.

## Default parity audit

Use the legacy project's explicit configuration when present. Apply the defaults below only where the Playwright suite relied on framework defaults. The Rstest column assumes 0.12.0 or newer and distinguishes helper defaults from bare imports.

| Area                     | Native Playwright Test default                                                                             | Rstest / `@rstest/playwright` baseline                                                                             | Migration action                                                                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test timeout             | `30_000` ms                                                                                                | `30_000` with `definePlaywrightConfig`; otherwise `5_000`                                                          | Use the helper for default parity; preserve any explicit legacy timeout.                                                                                                           |
| Hook and fixture timeout | Test fixtures and `beforeEach` share the test timeout; `beforeAll`/`afterAll` default to 30 s              | `hookTimeout: 30_000` with the helper; otherwise `10_000`; test-scoped fixtures are bounded by the requesting test | The helper aligns values, not shared-budget accounting. Audit fixture-specific timeouts separately.                                                                                |
| `expect.poll`            | `5_000` ms with backoff intervals `[100, 250, 500, 1000]`                                                  | `5_000` ms with the helper; otherwise `1_000`; one `50` ms interval                                                | Preserve call-level timeouts; convert timing-sensitive `intervals` arrays manually because Rstest accepts one numeric `interval`.                                                  |
| Locator/Page matcher     | `5_000` ms                                                                                                 | Reads `expect.poll.timeout`: `5_000` with the helper; otherwise `1_000` in Node mode                               | Map Playwright's `expect.timeout` to `expect.poll.timeout`; preserve per-call overrides and audit the effect on polling assertions.                                                |
| Action/navigation        | No independent timeout; normally bounded by the 30 s test timeout                                          | Direct Playwright Library operations usually default to 30 s; Rstest's outer test timeout still applies            | The helper makes the effective default close. Map explicit `actionTimeout`/`navigationTimeout` with `context` or `page` default-timeout APIs.                                      |
| Worker count             | `50%` of logical CPUs                                                                                      | Non-watch runs use roughly logical CPUs minus one                                                                  | Set `pool.maxWorkers: '50%'`, or preserve the old explicit/CI worker count. More Rstest workers can increase browser launches, memory pressure, port collisions, and CI flakiness. |
| Browser lifetime         | One browser per Playwright worker; a worker may execute several files                                      | `isolate: true` gives each file a fresh Rstest worker and normally a fresh browser                                 | Enable `isolate: false` only after validating state cleanup when Playwright-style worker browser reuse is desired.                                                                 |
| Discovery                | Test glob is equivalent; root follows the config/`testDir`; `.gitignore` applies when `testDir` is omitted | Search starts from Rstest `root` and also excludes `dist`, caches, and selected dot directories                    | Translate `testDir`, `testMatch`, and `testIgnore` into explicit `root`/`include`/`exclude`, then compare manifests.                                                               |
| Reporter                 | `list` locally and `dot` on CI                                                                             | `default`; GitHub Actions also enables annotations                                                                 | Preserve explicit reporters when CI log volume, artifacts, or downstream parsing matters.                                                                                          |
| Slow-test reporting      | Reports up to five files slower than 5 minutes                                                             | `slowTestThreshold: 300` ms reports tests/suites                                                                   | Output can become much noisier. Change the threshold only for reporting parity; it does not affect execution.                                                                      |
| Artifact output          | `test-results`, per-test unique paths, preserved by default                                                | Rstest build output and Playwright traces use different directories; there is no `testInfo.outputPath()`           | Migrate custom artifact paths explicitly. Do not assume screenshots, videos, or attachments retain their old layout.                                                               |

For a suite that used Playwright defaults, start with an E2E-specific config:

```ts title="rstest.e2e.config.ts"
import { defineConfig } from '@rstest/core';
import { definePlaywrightConfig } from '@rstest/playwright/config';

export default defineConfig({
  extends: definePlaywrightConfig({}),
  pool: {
    maxWorkers: '50%',
  },
});
```

In a mixed unit/E2E workspace, add the helper to each Node.js E2E project's `extends`; its defaults apply to that project. Keep global execution strategy fields such as `pool` and `isolate` at the root. The helper does not change their defaults. Do not raise unit-test timeouts merely to match the E2E runner.

These defaults are already aligned and normally need no migration-only override: Chromium, headless mode, a `1280 x 720` viewport, downloads enabled, retry count `0`, no bail/global timeout, trace off, no automatic screenshot/video capture, file-level parallelism, in-file sequential tests, and per-test context/page cleanup. `@rstest/playwright` currently supports only Chromium even though Chromium is merely Playwright Test's default; Firefox/WebKit projects are a capability gap.

Audit the actual `playwright.config.*` for common explicit settings that are not framework defaults: `fullyParallel`, CI `forbidOnly`, CI retries/workers, `trace: 'on-first-retry'`, `webServer`, browser/device projects, `storageState`, `baseURL`, screenshot/video retention, project dependencies, custom snapshot paths, and `test.use()` overrides.

## Configuration and assertion timeouts

Put shared Playwright defaults in `definePlaywrightConfig`, translating supported `use` fields into the appropriate option group:

```ts title="rstest.e2e.config.ts"
import { defineConfig } from '@rstest/core';
import { definePlaywrightConfig } from '@rstest/playwright/config';

export default defineConfig({
  extends: definePlaywrightConfig({
    contextOptions: {
      baseURL: 'http://localhost:3000',
      viewport: { width: 1440, height: 900 },
    },
  }),
  expect: {
    poll: { timeout: 10_000 },
  },
});
```

Explicit Rstest fields override inherited helper defaults. The example gives both locator/page assertions and `expect.poll()` a 10-second timeout. Importing `test` or `expect` alone does not enable E2E defaults.

- Matcher `{ timeout }` overrides `expect.poll.timeout`, including for `.not` and `expect.soft`; the outer test or hook timeout can still expire first.
- Locator/page assertions retry every 50 ms. `expect.poll.interval` affects only `expect.poll()`, and `page.setDefaultTimeout()` affects Playwright operations rather than assertions.
- The helper accepts JSON-serializable values. Put functions such as `launchOptions.logger`, class instances, direct certificate `Buffer` values, and test/retry-dependent values in `test.extend` instead. Certificate `certPath`/`keyPath`/`pfxPath` options can be used in config.
- Rstest does not read `playwright.config.ts`. The helper configures supported Playwright fixture options; it does not implement Playwright Test's entire `use` or project model.

## Imports and `test.extend`

Replace the Playwright Test runner import with Rstest's Playwright entry point. Tests that use only config defaults can import `test` and `expect` directly from `@rstest/playwright`. For custom fixtures, non-serializable values, or shared overrides, use one extended test module:

```ts
// e2e-test.ts
import { test as baseTest, type PlaywrightOptions } from '@rstest/playwright';

export { expect } from '@rstest/playwright';

export const test = baseTest.extend({
  playwright: {
    browserName: 'chromium',
    contextOptions: {
      viewport: { width: 1440, height: 900 },
    },
  } satisfies PlaywrightOptions,
});
```

Import that shared API in every test that needs its overrides:

```ts
import { expect, test } from './e2e-test';
```

Overriding the `playwright` fixture replaces the entire value; it does not merge with config defaults or a previous extension. Repeat every shared option the override must preserve, including `baseURL`, tracing, and launch options.

An extended test object is immutable: only tests registered through the returned object receive its overrides and custom fixtures. When tests need those overrides, do not leave some files importing the base `test` from `@rstest/playwright`, and do not mix `test` or `expect` from `@playwright/test` into an Rstest suite. Keep browser-only types such as `Page` and `Locator` from `playwright` when needed.

Playwright's `defineConfig`, `projects`, and `test.use()` are Playwright Test runner APIs. Move Rstest runner fields to `rstest.config.ts`; map shared supported browser options to `definePlaywrightConfig` or override the `playwright` fixture with `test.extend` (`browserName`, `launchOptions`, `contextOptions`, `requestOptions`, `trace`, and `debug`). Audit other Playwright Test options individually instead of silently copying or dropping them.

### Custom fixtures

Do not copy every native Playwright `test.extend()` declaration verbatim:

- Test-scoped object fixtures keep the `async (context, use)` setup/teardown shape.
- Rstest's object-form tuple supports `auto`, but native Playwright fixture options such as `option`, `timeout`, `box`, and `title` do not have the same meaning or support.
- Convert custom file- and worker-scoped fixtures to Rstest's named form: `.extend(name, { scope: 'file' | 'worker' }, fixture)`. The named fixture returns its value and registers teardown with `onCleanup`; it does not call `use`.
- A worker-scoped named fixture can depend only on earlier worker-scoped named fixtures. Migrate a native Playwright worker fixture that depends on `browser` to Rstest's test-scoped object form and depend on the built-in `browser` fixture. Its setup then runs per test, but the browser remains cached until worker cleanup; audit that setup cost and state instead of launching another browser.
- Keep the built-in `playwright` fixture test-scoped; browser reuse is handled internally rather than through named worker scope.
- Rstest does not pass Playwright Test's `testInfo` or `workerInfo` as a third fixture argument. Map each use to an Rstest `TestContext` API or `RSTEST_WORKER_ID`, or report it as unsupported.

Migrate a worker resource that does not depend on test-scoped fixtures like this:

```ts
export const test = baseTest.extend(
  'account',
  { scope: 'worker' },
  async (_context, { onCleanup }) => {
    const account = await createAccount();
    onCleanup(() => deleteAccount(account));
    return account;
  },
);
```

## `isolate: false`

The Rstest option is `isolate`, not `isolated`:

```ts
export default defineConfig({
  isolate: false,
});
```

`@rstest/playwright` tests run in Rstest's Node workers, not Rstest browser mode. With the default `isolate: true`, each test file gets a fresh worker. Setting `isolate: false` reuses the Node worker, test environment, and module cache across files, and keeps the matching browser alive until worker cleanup.

The built-in `browser` fixture is shared for the worker lifetime. The built-in `context`, `page`, and `request` fixtures, plus servers started through `serve`, are created and cleaned up per test. The main leakage risk is Node/module/test-environment state, plus browser contexts or servers created manually by user fixtures. Before enabling reuse, check shared-module mutations, top-level hook registration, DOM/timer cleanup, and custom resource teardown. Put setup that must run for every file in `setupFiles`, which Rstest reruns per file under `isolate: false`.

## Chrome in CI

Playwright's bundled Chromium and the installed Google Chrome are different launch targets. Preserve a suite that previously used Chrome in CI with the `channel` launch option while keeping `browserName: 'chromium'`:

```ts
const isCI = Boolean(process.env.CI);

export const test = baseTest.extend({
  playwright: {
    browserName: 'chromium',
    launchOptions: isCI ? { channel: 'chrome' } : undefined,
  } satisfies PlaywrightOptions,
});
```

The CI image must have a compatible Google Chrome installation; Playwright does not install branded Chrome by default. Keep `browserName: 'chromium'` because `channel: 'chrome'` selects the branded binary through the Chromium browser type. Do not replace it with an arbitrary `executablePath` unless the old suite explicitly depended on a custom browser binary.

## Migration checks

- Search all E2E helpers and fixtures for `@playwright/test`, `@rstest/playwright`, and custom test-module imports; tests needing custom fixtures or overrides must use the intended extended API.
- Compare test/hook/assertion/action timeouts, worker counts, discovery, and reporters with the old resolved config; do not compare runner defaults in isolation from explicit Playwright settings.
- Apply `definePlaywrightConfig` only to the intended E2E projects. Check explicit timeout overrides, map legacy `expect.timeout` to `expect.poll.timeout`, and audit custom polling `intervals`.
- Check config values are serializable and that each `playwright` fixture override preserves the shared options it needs.
- Check native fixture scopes/options and `testInfo`/`workerInfo` uses instead of mechanically copying `test.extend()`.
- Verify resolved package versions and peer compatibility; require 0.12.0 capabilities for the helper and shared assertion timeout, or use the older-version fallback.
- Check whether the old suite relied on file isolation before enabling `isolate: false`; verify custom contexts, servers, and module state are cleaned up.
- Confirm the CI browser channel and browser installation before comparing failures or timings.
- Run the same E2E manifest in the old and new runners, then compare retries, skipped tests, and browser-launch failures separately from assertion failures.
