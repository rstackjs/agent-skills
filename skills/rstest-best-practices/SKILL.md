---
name: rstest-best-practices
description: Anti-patterns and judgment calls for writing Rstest tests — mock boundary, test isolation, async/timer behavior, snapshot determinism, and Rstest-specific gotchas. Apply when writing, reviewing, or debugging Rstest test code.
---

# Rstest Best Practices

These rules capture two kinds of knowledge that feature docs don't cover well:

- **Anti-patterns**: behavior that looks fine but silently produces wrong or misleading results.
- **Judgment calls**: multiple valid APIs exist, and the correct choice depends on context.

For feature introduction, API reference, and config options, read the Rstest docs first: <https://rstest.rs/llms.txt>. This skill assumes familiarity with the basics and does not repeat them.

---

## Assertion selection

### expect.poll vs waitFor

`expect.poll(fn).matcher` retries the matcher on `fn()`'s latest value. It only supports idempotent sync matchers — snapshot matchers, `toThrow`, `.resolves`, and `.rejects` are rejected at call time, because retrying them would mutate snapshot state or double-invoke promises. Use `rstest.waitFor(() => { expect(...); })` for those.

```ts
// BAD — toThrow is not pollable
await expect.poll(() => tryFn()).toThrow();

// GOOD
await rstest.waitFor(() => {
  expect(() => tryFn()).toThrow();
});
```

### expect.poll ignores fake timers

`expect.poll` schedules retries via real timers (internal `getRealTimers().setTimeout`). `rstest.useFakeTimers()` does not affect poll cadence. Layering the two is redundant at best and misleading at worst.

```ts
// BAD — advancing fake timers does nothing for poll's retry cadence
rstest.useFakeTimers();
await expect.poll(() => counter).toBe(5);
rstest.advanceTimersByTime(1000);

// GOOD — pick one model

// Real-time convergence:
await expect.poll(() => counter).toBe(5);

// Deterministic ticking (no poll):
rstest.useFakeTimers();
rstest.advanceTimersByTime(1000);
expect(counter).toBe(5);
```

### Await every expect.poll and expect.element

Both return thenable proxies. If you forget to `await` them the assertion never runs, and Rstest throws a synthetic "was not awaited" error at test finish — which fails the test for a reason unrelated to the apparent source line, wasting debugging time.

```ts
// BAD — test finish complains with an unrelated-looking error
expect.poll(() => counter).toBe(5);

// GOOD
await expect.poll(() => counter).toBe(5);
```

### Async error assertions — use `.rejects`, never try/catch

Wrapping `await fn()` in try/catch has a silent-pass hole: if `fn()` unexpectedly resolves, the catch block never runs and the test passes green without verifying anything. Closing the hole needs `expect.assertions(N)` or `expect.fail()` in the try branch, which is routinely forgotten. `.rejects` fails immediately when the promise resolves, so the hole cannot exist. And because a rejected promise memoizes its reason, the same promise can be matched against multiple `.rejects` assertions without re-invoking.

```ts
// BAD — silent pass if fn() resolves; also rebuilds the error from scratch
try {
  await fn();
} catch (e) {
  expect(e).toBeInstanceOf(ApiError);
  expect((e as ApiError).status).toBe(500);
}

// GOOD — one shape assertion covers multiple fields
await expect(fn()).rejects.toMatchObject({
  status: 500,
  message: expect.stringContaining('user-3'),
});

// GOOD — same promise, multiple .rejects matchers (no re-invoke, mock queue untouched)
const p = fn();
await expect(p).rejects.toBeInstanceOf(ApiError);
await expect(p).rejects.toMatchObject({ status: 500 });
```

### Snapshot form: inline / default / file

| Form | When to use |
|---|---|
| `toMatchInlineSnapshot()` | Small structured values (under ~10 lines) that help reviewers read the test in place |
| `toMatchSnapshot()` | Multiple or larger serialized values; accepted diff noise in `__snapshots__/` |
| `toMatchFileSnapshot('path.html')` | Artifacts consumable as real files — HTML, SQL, generated code — so diff tools and IDEs open them natively |

```ts
// BAD — large HTML inline becomes unreviewable
expect(html).toMatchInlineSnapshot(`"<html>..."`);

// GOOD
expect(html).toMatchFileSnapshot('__snapshots__/page.html');
```

### Snapshot determinism

Snapshot assertions must produce the same output on every run. Never capture values that drift — timestamps, UUIDs, tmp paths, randomized ordering — without normalizing them first. A flaky snapshot wastes CI cycles and trains reviewers to rubber-stamp updates.

```ts
// BAD — createdAt and /tmp/abc-xxx/ rotate each run
expect(response).toMatchSnapshot();

// GOOD — strip or normalize drift before asserting
expect(response).toMatchSnapshot({
  createdAt: expect.any(Number),
  tmpPath: expect.stringMatching(/^\/tmp\//),
});

// or register a serializer globally
expect.addSnapshotSerializer(pathSerializer);
```

---

## Test isolation and state

### isolate: false is not "no cleanup"

`isolate: false` disables tinypool's worker-level isolation — tests in the same file share a worker. But `@rstest/core` still explicitly wipes its own module cache between files via `__rstest_clean_core_cache__`. Singletons defined in your own modules may survive across tests within a file, but anything imported from `@rstest/core` (test APIs, mock registries) is cleaned regardless.

Use `isolate: false` for genuine speed wins on side-effect-free suites. Do not use it as a channel to share state across files — that channel is not guaranteed.

### resetModules does not unmock

`rstest.resetModules()` clears the module cache so `await import(...)` re-evaluates modules. It does NOT tear down existing mocks. A module that was mocked before `resetModules()` remains mocked after.

```ts
// BAD
rs.mock('./db');
// ... later
rstest.resetModules();
const { connect } = await import('./db'); // still the mock

// GOOD
rstest.resetModules();
rstest.doUnmock('./db');
const { connect } = await import('./db'); // original
```

### clearMocks vs resetMocks vs restoreMocks

Three auto-cleanup config flags with cumulative depth:

| Option | Effect |
|---|---|
| `clearMocks: true` | Clears `mock.calls` / `mock.results` only (implementation preserved) |
| `resetMocks: true` | `clearMocks` + resets implementation (`fn()` returns `undefined`) |
| `restoreMocks: true` | `resetMocks` + restores original `spyOn`ed method descriptors |

Pick the weakest option that meets the test's needs:

- Tracking calls with stable implementations across tests → `clearMocks: true`
- Tests set temporary implementations via `mockImplementation` / `mockReturnValue` and must not leak → `resetMocks: true`
- Suite relies heavily on `rs.spyOn(obj, method)` and must unspy object prototypes between tests → `restoreMocks: true`

```ts
// BAD — assuming clearMocks isolates implementations
// config
export default defineConfig({ test: { clearMocks: true } });

// spec
const fn = rs.fn();
test('a', () => {
  fn.mockReturnValue(10);
  expect(fn()).toBe(10);
});
test('b', () => {
  expect(fn()).toBe(undefined); // fails: still 10
});
```

Note: `resetMocks: true` also clears top-level `rs.fn().mockReturnValue(...)` initial setup between tests — move such initialization into `beforeEach` if you need it.

### rs.spyOn reuses the existing spy

Calling `rs.spyOn(obj, 'method')` a second time on the same target returns the same spy instance. Rstest checks via `isMockFunction(obj[method])` and returns early. A single `mockRestore()` fully unwinds — you do not need to unwind N times for N calls. `get` and `set` accessor spies are separate entries.

```ts
const obj = { foo: () => 'original' };
const s1 = rs.spyOn(obj, 'foo');
const s2 = rs.spyOn(obj, 'foo');

expect(s1).toBe(s2); // same instance

s1.mockRestore();
expect(obj.foo()).toBe('original'); // fully restored
```

### globalSetup vs setupFiles

Both extend test startup but run in different contexts:

| Option | Runs | Use when |
|---|---|---|
| `globalSetup` | Once per test run, in a separate context from test files | Spin up servers, seed databases, compile fixtures — the teardown returned runs after the whole run finishes |
| `setupFiles` | Once per test file, in the same context as tests | Register custom matchers (`expect.extend`), install globals, wire `afterEach` hooks |

You cannot inject test APIs or custom matchers via `globalSetup` — its context is isolated. Only `setupFiles` can do that.

```ts
// BAD — custom matcher never reaches tests
// globalSetup.ts
import { expect } from '@rstest/core';
expect.extend({ toBeFoo() { /* ... */ } });

// GOOD — use setupFiles
// rstest.setup.ts
import { expect } from '@rstest/core';
expect.extend({ toBeFoo() { /* ... */ } });
```

---

## Mock boundary

### rs.mock (ESM) vs rs.mockRequire (CJS)

`rs.mock` only intercepts ESM `import`. `rs.mockRequire` only intercepts CJS `require()`. A package with dual ESM/CJS entries does not automatically cross over — mocking via the wrong API silently leaves the other entry running the real implementation.

```ts
// BAD — code under test uses CommonJS require('pkg')
rs.mock('pkg', () => ({ foo: rs.fn() })); // silent no-op

// GOOD
rs.mockRequire('pkg', () => ({ foo: rs.fn() }));
```

Check how the code under test actually resolves the dependency before choosing. A mixed ESM/CJS codebase may need both.

### Mock factory hoisting and doMock

`rs.mock` calls are hoisted to the top of the file. Factory bodies execute before any `import` or `const` in the file, so they cannot close over anything declared later. If the factory needs a variable, wrap it in `rs.hoisted(() => ...)`. For per-test mocking (no hoist), use `rs.doMock` and re-import after.

```ts
// BAD — mockFn is undefined when the factory runs
import { realFn } from 'pkg';
const mockFn = rs.fn().mockReturnValue(42);
rs.mock('pkg', () => ({ realFn: mockFn }));

// GOOD A — hoisted value
const mockFn = rs.hoisted(() => rs.fn().mockReturnValue(42));
rs.mock('pkg', () => ({ realFn: mockFn }));

// GOOD B — per-test, not hoisted
test('custom', async () => {
  rs.doMock('pkg', () => ({ realFn: () => 42 }));
  const { realFn } = await import('pkg');
  expect(realFn()).toBe(42);
});
```

### with { rstest: 'importActual' } is Rstest-only

Rstest's synchronous partial-mock syntax uses a custom `import` attribute that Rstest strips before the module reaches Node. Do not forward the attribute to a native `import()` call or pass it through loaders — Node throws `ERR_IMPORT_ATTRIBUTE_UNSUPPORTED`.

```ts
// BAD — the attribute leaks to a dynamic import
const actual = await import('pkg', { with: { rstest: 'importActual' } });

// GOOD — use rstest.importActual in test code
const actual = await rstest.importActual<typeof import('pkg')>('pkg');
```

### { spy: true } vs { mock: true }

Module-level flags for `rs.mock('pkg', options)`:

| Option | Behavior | Use when |
|---|---|---|
| `{ spy: true }` | Keeps the original implementation, adds call tracking only | Observing real calls without changing behavior |
| `{ mock: true }` | All exports default to `undefined`; override selectively via a factory | Neutralizing most of a module and pinning only a few exports |

Choose by intent: are you observing real behavior, or substituting it?

```ts
// Observe real logger calls while production paths execute
rs.mock('./logger', { spy: true });

// Neutralize a crypto dep, pin only the functions the test touches
rs.mock('crypto', () => ({ randomUUID: () => 'stable-id' }));
```

### rs.fn() vs rs.spyOn()

| API | Use when |
|---|---|
| `rs.fn()` | The code under test receives the function through a parameter or dependency injection — you hand it the mock |
| `rs.spyOn(obj, method)` | The code under test calls a method on an object it reaches directly (module export, prototype, imported namespace) — you cannot inject, so you patch |

`spyOn` preserves the original implementation by default and can `mockRestore()`. `rs.fn()` has no "original" to restore to.

```ts
// rs.fn — inject
const fetcher = rs.fn().mockResolvedValue({ ok: true });
await loadUser({ fetcher });

// rs.spyOn — cannot inject
import * as api from './api';
rs.spyOn(api, 'loadUser').mockResolvedValue({ id: 1 });
```

### Mock return scope: persistent, once, temporary

| API | Scope |
|---|---|
| `mockReturnValue(v)` | Persists until replaced or reset |
| `mockReturnValueOnce(v)` | Queue entry — consumed on next call, then falls back to the default |
| `withImplementation(fn, cb)` | Swapped only while `cb` runs, auto-restored after |

Pick by intent; the test reads more clearly when the duration of the override is explicit.

```ts
// Sequential pagination — use Once for the queue
fetch.mockReturnValueOnce(page1).mockReturnValueOnce(page2);

// Async segment with auto-restore
await fn.withImplementation(
  async () => { throw new Error('boom'); },
  async () => {
    await expect(run()).rejects.toThrow('boom');
  },
);

// Default for the whole test
fetch.mockReturnValue(defaultResponse);
```

---

## Async and timer

### Fake timers do not cover microtasks by default

`rstest.useFakeTimers()` fakes `setTimeout`, `setInterval`, `Date`, and related macrotask APIs. It does NOT fake `queueMicrotask`, `process.nextTick`, or `Intl` by default. Code that schedules via microtasks continues to run on real time. Extend `toFake` explicitly if the SUT relies on `queueMicrotask`.

```ts
// BAD — microtask in SUT runs on real time, runAllTimers does not drain it
rstest.useFakeTimers();
doWork(); // internally calls queueMicrotask(fn)
rstest.runAllTimers();

// GOOD
rstest.useFakeTimers({
  toFake: ['setTimeout', 'setInterval', 'queueMicrotask'],
});
```

### Faking nextTick throws in the forks pool

`rstest.useFakeTimers({ toFake: ['nextTick'] })` throws `process.nextTick cannot be mocked inside child_process`. Rstest's only pool is `forks`, so every worker is a `child_process`, and sinon's fake-timers refuses to touch `nextTick` there. There is no alternative pool — faking `nextTick` is effectively unavailable.

Rewrite tests to avoid asserting on `nextTick`-specific scheduling, or isolate scheduling behind an injected scheduler the test can drive synchronously.

### waitFor vs waitUntil

| API | Success signal | Use for |
|---|---|---|
| `rstest.waitFor(cb)` | `cb` does not throw | Re-running `expect(...)` assertions until they pass |
| `rstest.waitUntil(cb)` | `cb` returns truthy | Polling a boolean or health check |

Use `waitFor` when you want to reuse `expect`'s matcher semantics. Use `waitUntil` for "is X ready yet" checks where a thrown error is a real error, not a "not yet" signal.

```ts
// waitFor — reuse expect semantics
await rstest.waitFor(() => {
  expect(document.querySelector('.ready')).not.toBeNull();
});

// waitUntil — health check
await rstest.waitUntil(async () => (await fetch('/health')).ok);
```

### Concurrent tests require context-bound hooks

`onTestFinished` and `onTestFailed` imported from `@rstest/core` read the "current test" from a module-level variable — not `AsyncLocalStorage`. Under `describe.concurrent` multiple tests run concurrently, and the global hook loses correct attribution, throwing `onTestFinished() can only be called inside a test`. Destructure the hook from the test context instead.

```ts
// BAD — throws mid-test under concurrent execution
import { describe, test, onTestFinished } from '@rstest/core';

describe.concurrent('suite', () => {
  test('a', async () => {
    onTestFinished(() => cleanup());
    await work();
  });
});

// GOOD
describe.concurrent('suite', () => {
  test('a', async ({ onTestFinished }) => {
    onTestFinished(() => cleanup());
    await work();
  });
});
```

### Timer drivers: runAll, runOnlyPending, advanceBy

| API | Behavior |
|---|---|
| `runAllTimers()` | Drains the queue including timers scheduled by callbacks — loops until empty. Hits `loopLimit` (default 10_000) on self-rescheduling timers |
| `runOnlyPendingTimers()` | Drains timers scheduled before the call only. Safe against polling loops |
| `advanceTimersByTime(ms)` | Deterministic — advances the fake clock by exactly `ms`, firing timers in order |

Use `runAllTimers` for one-shot timers. Use `runOnlyPendingTimers` when the SUT re-schedules (polling, retry, debounce loops). Use `advanceTimersByTime` when asserting behavior at a specific moment (e.g., debounce threshold).

```ts
// BAD — infinite reschedule hits loopLimit
rstest.useFakeTimers();
startPolling();
rstest.runAllTimers();

// GOOD — bounded drain
rstest.runOnlyPendingTimers();

// GOOD — debounce boundary
rstest.useFakeTimers();
debounce(fn, 300)();
rstest.advanceTimersByTime(299);
expect(fn).not.toHaveBeenCalled();
rstest.advanceTimersByTime(1);
expect(fn).toHaveBeenCalledOnce();
```

---

## Rstest-specific

### Only the forks pool exists

Rstest supports exactly one pool: `forks`. There is no `threads` or `vmThreads` equivalent. Isolation comes from tinypool-forked `child_process`es plus Rstest's module-cache cleanup, not from `worker_threads`.

Implications for test design:

- Workers are real OS processes; inter-worker IPC uses structured cloning, so non-serializable state (native handles, sockets) cannot be shared back.
- Per-worker memory cost is process-level, not thread-level. `pool.maxWorkers` set too aggressively on low-memory CI can swap.
- Patterns that rely on `worker_threads` semantics (SharedArrayBuffer coordination, in-process isolate tricks) are not available.

Plan isolation and parallelism around `forks` semantics from the start; do not port Vitest thread-pool tuning advice verbatim.

### CJS default-export interop limits

Rstest runs tests through Rspack bundling with ESM output. Packages exporting via `module.exports = fn` (with static properties, like older `lodash`) do not automatically interop into named exports. Importing named members yields `undefined`.

```ts
// BAD — named import is undefined for module.exports = fn style CJS
import { VERSION } from 'lodash';
expect(VERSION).toBe('4.17.21'); // fails

// GOOD A — restore Node's require interop via externalization
export default defineConfig({
  output: {
    externals: { lodash: 'commonjs lodash' },
  },
});

// GOOD B — use a package that ships proper ESM entries
import { VERSION } from 'lodash-es';
```

### bundleDependencies default by testEnvironment

Rstest switches `output.bundleDependencies` default by environment:

| `testEnvironment` | Default |
|---|---|
| `node` | Externalize `node_modules` |
| `jsdom` / `happy-dom` | Bundle `node_modules` |
| Browser mode | Always bundle (cannot disable) |

This affects where the mock boundary lives. Mocking a transitive dependency in a `node` suite targets the externalized `node_modules` path; in a `jsdom` suite the dependency is bundled into the test entry and requires matching the bundled specifier. When switching environment between suites, re-check that `rs.mock` calls still intercept.

### Browser mode fake-timers is a stub

Under `@rstest/browser`, `@sinonjs/fake-timers` is replaced by a no-op stub. `useFakeTimers()` runs cleanly, but `runAllTimers()`, `advanceTimersByTime()`, and `tick()` do not actually advance the clock — only `setSystemTime()` updates the internal `Date.now()`. Use real timing or explicit polling in browser tests; do not rely on fake-timer mechanics.

```ts
// BAD — in browser mode, nothing advances
rstest.useFakeTimers();
startDebounce();
rstest.advanceTimersByTime(500); // no effect
expect(fired).toBe(true); // fails

// GOOD
rstest.useFakeTimers();
rstest.setSystemTime(new Date('2026-01-01')); // this works
await rstest.waitFor(() => expect(fired).toBe(true)); // real time
```

### Browser mode shares launch options across projects

One `rstest` invocation in browser mode uses a single set of `provider` / `browser` / `headless` / `port` / `providerOptions`. Multiple `projects` in the config cannot each specify a different browser. For a Chromium × Firefox × WebKit matrix, split into multiple CLI invocations.

```bash
# BAD — one run with projects varying browser won't work
rstest run

# GOOD — one invocation per browser
BROWSER=chromium rstest run
BROWSER=firefox rstest run
BROWSER=webkit rstest run
```

### In-source tests require a prod define

`includeSource` enables in-source testing — tests live inside source files guarded by `if (import.meta.rstest)`. The guard is only dead-code-eliminated in the production bundle when you explicitly define `import.meta.rstest` as `false` in the prod build config. Without this define, the test code ships to users.

```ts
// rsbuild.config.ts — production bundle
export default defineConfig({
  source: {
    define: {
      'import.meta.rstest': false, // required for DCE
    },
  },
});
```

### describe.skip still runs block code

Rstest evaluates `describe.skip` block bodies during the collect phase to compute test and snapshot info. Only the `test()` cases inside are marked skipped; top-level synchronous code in the block runs. Side effects at the top of a skipped describe are not skipped.

```ts
// BAD — openDB() still runs
describe.skip('integration suite', () => {
  const db = openDB();
  test('case 1', () => { /* ... */ });
});

// GOOD — hooks do not fire when no test runs
describe.skip('integration suite', () => {
  let db;
  beforeAll(() => {
    db = openDB();
  });
  test('case 1', () => { /* ... */ });
});
```

### Local snapshot creation bypasses update config

When a test asserts a brand-new snapshot, Rstest writes it to disk regardless of the `update` config. The `update: false` default (CI) only blocks updates to existing snapshots, not creation of new ones. Do not expect a local dry run to catch "I forgot to commit a new snapshot file" — rely on CI's working-tree check or a lint step.

```bash
# BAD — local run passes, CI blows up on missing snapshot file
rstest run

# GOOD — add a git check in CI to catch unstaged snapshots
git diff --exit-code -- '**/*.snap' || exit 1
```

### Browser headless concurrency

Rstest browser headless mode uses a separate concurrency calculation from the node pool:

- Default: `min(12, cpus - 1)` workers
- Watch mode: halved, floor 1
- `pool.maxWorkers` (when set): overrides the default, bypasses the watch-halving

```ts
// Default — machine-aware, watch-friendly
export default defineConfig({ /* no pool config */ });

// Explicit cap — skips both default and watch halving
export default defineConfig({
  test: { pool: { maxWorkers: 4 } },
});
```

Both node and browser modes read the same `pool.maxWorkers` field, but the default fallback algorithms differ. When tuning CI throughput for browser tests, start from an explicit `maxWorkers`.

### testEnvironment: jsdom vs happy-dom

Rstest supports both DOM implementations. Default to **`happy-dom`** for faster cold starts and lower memory per worker.

Switch to `jsdom` when:

- The test stack requires jsdom internals (certain versions of `msw`, `@testing-library` fixtures that poke at jsdom-specific state).
- Web-platform-tests-level spec compliance is required for an API happy-dom does not cover.
- A third-party fixture explicitly documents jsdom-only support.

```ts
// default
export default defineConfig({ test: { testEnvironment: 'happy-dom' } });

// when jsdom is required by the test stack
export default defineConfig({ test: { testEnvironment: 'jsdom' } });
```

Real browser behavior (Chromium/Firefox/WebKit-specific APIs, real rendering) requires `@rstest/browser`, not a DOM simulator.

### Root-only options are silently ignored in projects

These options are dropped with no warning when set inside `projects[]`: `reporters`, `pool`, `isolate`, `coverage`, `bail`.

TypeScript's `ProjectConfig = Omit<RstestConfig, ...>` rejects them at compile time, but JS configs, `@ts-expect-error`, or loose types slip through. At runtime Rstest either never reads the project-level value (`reporters`, `pool`) or overwrites it with the root value during normalization (`isolate`, `coverage`, `bail`). Only `shard` is an exception — setting it per-project triggers an explicit error and exit.

```ts
// BAD — silently dropped, the suite runs with root defaults instead
export default defineConfig({
  test: {
    projects: [
      { test: { bail: 1, coverage: { enabled: true } } },
    ],
  },
});

// GOOD — declare these at the root
export default defineConfig({
  test: {
    bail: 1,
    coverage: { enabled: true },
    projects: [{ /* ... */ }],
  },
});
```

### coverage.thresholds: global, glob, perFile

`coverage.thresholds` accepts three forms of increasing strictness:

| Form | Behavior |
|---|---|
| Top-level `{ statements: 80 }` | Applied to the aggregate across all files — one low-coverage file can be masked by the average |
| Glob-keyed `{ 'src/core/**': { statements: 100 } }` | Same aggregate semantics but scoped to the glob match |
| `perFile: true` inside a glob | Every individual file in the match must clear the threshold |

Use the top-level form as a project-wide floor. Add glob-keyed sections to raise the bar on hot-path code (or lower it on legacy). Add `perFile: true` when a single laggard file should not be hidden by the rest of the glob's average.

```ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      thresholds: {
        statements: 80,
        'src/core/**': { perFile: true, statements: 100, branches: 95 },
        'src/legacy/**': { statements: 60 },
      },
    },
  },
});
```

Negative threshold values (`statements: -3`) flip the semantics to "allow at most N uncovered items" — useful for tight caps on a small module, but they scale badly across refactors and shouldn't be the default.

### Never commit .only

`test.only` / `describe.only` is a local debugging tool. Committing it silently reduces CI to running a single case — the rest of the suite passes by default because nothing else ran. Enforce via lint (disallow `.only` in tracked test files) rather than review discipline.

```ts
// BAD — in a committed test file
test.only('single case', () => { /* ... */ });

// GOOD
test('single case', () => { /* ... */ });
```

---

## References

- Rstest docs (LLM-friendly index): <https://rstest.rs/llms.txt>
- Source repo: <https://github.com/web-infra-dev/rstest>
