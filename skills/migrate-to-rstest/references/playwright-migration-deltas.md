# Playwright Migration Deltas

Read this reference only when the migration request explicitly contains the keyword `playwright`. It covers Playwright Test E2E suites moving to `@rstest/playwright`; it is not a generic browser or DOM-testing guide.

## Contents

- [Version baseline](#version-baseline)
- [Default parity audit](#default-parity-audit)
- [Imports and `test.extend`](#imports-and-testextend)
- [Custom fixtures](#custom-fixtures)
- [`isolate: false`](#isolate-false)
- [Chrome in CI](#chrome-in-ci)
- [Migration checks](#migration-checks)

## Version baseline

Use matching versions of `@rstest/core` and `@rstest/playwright` at 0.11.9 or newer, preferably the latest release. This reference assumes support for `expect.poll` configuration, file- and worker-scoped named fixtures, and worker-lifetime browser reuse.

## Default parity audit

Use the legacy project's explicit configuration when present. Apply the defaults below only where the Playwright suite relied on framework defaults. The Rstest column assumes 0.11.9 or newer.

| Area                     | Native Playwright Test default                                                                             | Rstest / `@rstest/playwright` baseline                                                                      | Migration action                                                                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test timeout             | `30_000` ms                                                                                                | `testTimeout: 5_000`                                                                                        | Set the E2E `testTimeout` to `30_000`, or preserve the old explicit value.                                                                                                         |
| Hook and fixture timeout | Test fixtures and `beforeEach` share the test timeout; `beforeAll`/`afterAll` default to 30 s              | `hookTimeout: 10_000`; test-scoped fixtures are bounded by the requesting test                              | Set `hookTimeout` to `30_000` for default parity, then audit fixtures with their own Playwright timeout.                                                                           |
| `expect.poll`            | `5_000` ms with backoff intervals `[100, 250, 500, 1000]`                                                  | `1_000` ms with one `50` ms interval, including imports from `@rstest/playwright`                           | Set `expect.poll.timeout: 5_000`. Preserve call-level timeouts; convert timing-sensitive `intervals` arrays manually because Rstest accepts one numeric `interval`.                |
| Locator/Page matcher     | `5_000` ms                                                                                                 | `5_000` ms                                                                                                  | No default adjustment. If Playwright configured a different global `expect.timeout`, pass it to these matchers explicitly or report the missing package-wide matcher option.       |
| Action/navigation        | No independent timeout; normally bounded by the 30 s test timeout                                          | Direct Playwright Library operations usually default to 30 s, while Rstest's 5 s test timeout expires first | Setting `testTimeout` to 30 s makes the effective default close. Map explicit `actionTimeout`/`navigationTimeout` with `context` or `page` default-timeout APIs.                   |
| Worker count             | `50%` of logical CPUs                                                                                      | Non-watch runs use roughly logical CPUs minus one                                                           | Set `pool.maxWorkers: '50%'`, or preserve the old explicit/CI worker count. More Rstest workers can increase browser launches, memory pressure, port collisions, and CI flakiness. |
| Browser lifetime         | One browser per Playwright worker; a worker may execute several files                                      | `isolate: true` gives each file a fresh Rstest worker and normally a fresh browser                          | Enable `isolate: false` only after validating state cleanup when Playwright-style worker browser reuse is desired.                                                                 |
| Discovery                | Test glob is equivalent; root follows the config/`testDir`; `.gitignore` applies when `testDir` is omitted | Search starts from Rstest `root` and also excludes `dist`, caches, and selected dot directories             | Translate `testDir`, `testMatch`, and `testIgnore` into explicit `root`/`include`/`exclude`, then compare manifests.                                                               |
| Reporter                 | `list` locally and `dot` on CI                                                                             | `default`; GitHub Actions also enables annotations                                                          | Preserve explicit reporters when CI log volume, artifacts, or downstream parsing matters.                                                                                          |
| Slow-test reporting      | Reports up to five files slower than 5 minutes                                                             | `slowTestThreshold: 300` ms reports tests/suites                                                            | Output can become much noisier. Change the threshold only for reporting parity; it does not affect execution.                                                                      |
| Artifact output          | `test-results`, per-test unique paths, preserved by default                                                | Rstest build output and Playwright traces use different directories; there is no `testInfo.outputPath()`    | Migrate custom artifact paths explicitly. Do not assume screenshots, videos, or attachments retain their old layout.                                                               |

For a suite that used Playwright defaults, start with an E2E-specific config:

```ts title="rstest.e2e.config.ts"
import { defineConfig } from '@rstest/core';

export default defineConfig({
  testTimeout: 30_000,
  hookTimeout: 30_000,
  expect: {
    poll: {
      timeout: 5_000,
    },
  },
  pool: {
    maxWorkers: '50%',
  },
});
```

If this config is a project under a root Rstest config, keep global execution strategy fields such as `pool` and `isolate` at the root. Do not raise unit-test timeouts merely to match the E2E runner.

These defaults are already aligned and normally need no migration-only override: Chromium, headless mode, a `1280 x 720` viewport, downloads enabled, retry count `0`, no bail/global timeout, trace off, no automatic screenshot/video capture, file-level parallelism, in-file sequential tests, and per-test context/page cleanup. `@rstest/playwright` currently supports only Chromium even though Chromium is merely Playwright Test's default; Firefox/WebKit projects are a capability gap.

Audit the actual `playwright.config.*` for common explicit settings that are not framework defaults: `fullyParallel`, CI `forbidOnly`, CI retries/workers, `trace: 'on-first-retry'`, `webServer`, browser/device projects, `storageState`, `baseURL`, screenshot/video retention, project dependencies, custom snapshot paths, and `test.use()` overrides.

## Imports and `test.extend`

Replace the Playwright Test runner import with Rstest's Playwright entry point. `@rstest/playwright` does not support global Playwright options in `rstest.config.ts` yet, so put migrated `use` options in one shared extended test module:

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

Import that shared API in every migrated test:

```ts
import { expect, test } from './e2e-test';
```

An extended test object is immutable: only tests registered through the returned object receive its overrides and custom fixtures. Do not leave some files importing the base `test` from `@rstest/playwright`, and do not mix `test` or `expect` from `@playwright/test` into an Rstest suite. Keep browser-only types such as `Page` and `Locator` from `playwright` when needed.

Playwright's `defineConfig`, `projects`, and `test.use()` are Playwright Test runner APIs. Move Rstest runner fields to `rstest.config.ts`; map supported browser options to the `playwright` fixture (`browserName`, `launchOptions`, `contextOptions`, `requestOptions`, `trace`, and `debug`). Audit other Playwright Test options individually instead of silently copying or dropping them.

### Custom fixtures

Do not copy every native Playwright `test.extend()` declaration verbatim:

- Test-scoped object fixtures keep the `async (context, use)` setup/teardown shape.
- Rstest's object-form tuple supports `auto`, but native Playwright fixture options such as `option`, `timeout`, `box`, and `title` do not have the same meaning or support.
- Convert custom file- and worker-scoped fixtures to Rstest's named form: `.extend(name, { scope: 'file' | 'worker' }, fixture)`. The named fixture returns its value and registers teardown with `onCleanup`; it does not call `use`.
- A worker-scoped named fixture can depend only on earlier worker-scoped named fixtures. In particular, a native Playwright worker fixture that depends on Playwright's `browser` fixture cannot be mapped directly to an Rstest worker-scoped named fixture.
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

The built-in `context`, `page`, and `request` fixtures are still created and cleaned up per test. The main leakage risk is Node/module/test-environment state, plus browser contexts or servers created manually by user fixtures. Before enabling reuse, check shared-module mutations, top-level hook registration, DOM/timer cleanup, and custom resource teardown. Put setup that must run for every file in `setupFiles`, which Rstest reruns per file under `isolate: false`.

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

- Search all E2E helpers and fixtures for `@playwright/test`, `@rstest/playwright`, and custom test-module imports; every test must use the intended extended API.
- Compare test/hook/assertion/action timeouts, worker counts, discovery, and reporters with the old resolved config; do not compare runner defaults in isolation from explicit Playwright settings.
- Configure the migrated `expect.poll` default and audit custom `intervals` usage.
- Check native fixture scopes/options and `testInfo`/`workerInfo` uses instead of mechanically copying `test.extend()`.
- Confirm `@rstest/core` and `@rstest/playwright` are matching versions at 0.11.9 or newer.
- Check whether the old suite relied on file isolation before enabling `isolate: false`; verify custom contexts, servers, and module state are cleaned up.
- Confirm the CI browser channel and browser installation before comparing failures or timings.
- Run the same E2E manifest in the old and new runners, then compare retries, skipped tests, and browser-launch failures separately from assertion failures.
