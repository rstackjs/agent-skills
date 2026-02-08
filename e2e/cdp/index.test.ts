import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from '@rstest/core';
import { type Result, x } from 'tinyexec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RSTEST_CDP_CLI_PATH = path.resolve(
  __dirname,
  '../../packages/rstest-cdp/dist/rstest-cdp.cjs',
);

const fixturePath = (name: string) => path.join(__dirname, 'fixtures', name);

const createRunner = (cwd: string, includeFile: string) => ({
  cmd: 'pnpm',
  args: ['rstest', 'run', '-c', 'rstest.config.ts', '--include', includeFile],
  cwd,
  env: { FORCE_COLOR: '0' },
});

const getTaskValues = (result: DebugResult, taskId: string) => {
  const taskResult = result.results.find((item) => item.id === taskId);
  expect(taskResult).toBeTruthy();
  return Object.fromEntries(
    (taskResult?.values || []).map((entry) => [entry.expression, entry.value]),
  );
};

interface DebugResult {
  status: 'full_succeed' | 'partial_succeed' | 'failed';
  exitCode?: number | null;
  results: Array<{
    id: string;
    values: Array<{ expression: string; value: unknown }>;
  }>;
  errors: Array<{ taskId?: string; error: string }>;
  meta?: {
    runner: {
      cmd: string;
      args: string[];
      cwd: string;
      env?: Record<string, string>;
    };
    forwardedArgs: string[];
    mappingDiagnostics: Array<{ reason: string }>;
    pendingTaskIds: string[];
  };
}

interface RunCdpDebugOptions {
  plan: object;
  cwd: string;
  debug?: boolean;
  timeout?: number;
}

/**
 * Helper to run rstest-cdp CLI and collect stdout.
 */
async function runCdpDebug(options: RunCdpDebugOptions): Promise<DebugResult> {
  const { plan, cwd, debug = false, timeout = 45_000 } = options;
  const stdinPayload = JSON.stringify(plan, null, 2);

  const args = [RSTEST_CDP_CLI_PATH, '--plan', '-'];
  if (debug) {
    args.push('--debug', '1');
  }

  let stdout = '';
  const cli = x('node', args, {
    nodeOptions: { cwd },
  });

  cli.process?.stdout?.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  cli.process?.stdin?.write(stdinPayload);
  cli.process?.stdin?.end();

  try {
    await Promise.race([
      cli,
      new Promise<Result>((_resolve, reject) => {
        setTimeout(() => reject(new Error('rstest-cdp timed out.')), timeout);
      }),
    ]);
  } catch (_error) {
    const details = stdout.trim() ? `\n${stdout}` : '';
    throw new Error(`rstest-cdp failed.${details}`);
  }

  return JSON.parse(stdout) as DebugResult;
}

describe('cdp debug skill', () => {
  it('evaluates locals via CDP', async () => {
    const fixturesTargetPath = fixturePath('basic');

    const profileSourcePath = path.join(fixturesTargetPath, 'src/profile.ts');
    const plan = {
      runner: {
        ...createRunner(fixturesTargetPath, 'test/profile.test.ts'),
      },
      tasks: [
        {
          description: 'Inspect formatted profile fields',
          sourcePath: profileSourcePath,
          line: 7,
          column: 0,
          expressions: ['trimmed', 'normalized', 'displayName', 'role'],
        },
      ],
    };

    const result = await runCdpDebug({
      plan,
      cwd: fixturesTargetPath,
      debug: true,
    });
    if (result.status === 'failed') {
      throw new Error(`rstest-cdp failed.\n${JSON.stringify(result)}`);
    }

    expect(result.status).toBe('full_succeed');
    expect(result.meta).toBeTruthy();
    expect(result.meta?.pendingTaskIds.length).toBe(0);

    expect(result.meta?.forwardedArgs).toContain('--pool.maxWorkers=1');
    expect(result.meta?.forwardedArgs).toContain(
      '--pool.execArgv=--inspect-brk=0',
    );

    const values = getTaskValues(result, 'task-1');
    expect(values.trimmed).toBe('Ada Lovelace');
    expect(values.normalized).toBe('ada-lovelace');
    expect(values.displayName).toBe('Ada Lovelace');
    expect(values.role).toBe('admin');
  }, 60_000);

  it('omits meta when --debug is not set', async () => {
    const fixturesTargetPath = fixturePath('basic-no-debug');

    const profileSourcePath = path.join(fixturesTargetPath, 'src/profile.ts');
    const plan = {
      runner: {
        ...createRunner(fixturesTargetPath, 'test/profile.test.ts'),
      },
      tasks: [
        {
          description: 'Inspect profile fields without debug',
          sourcePath: profileSourcePath,
          line: 7,
          column: 0,
          expressions: ['trimmed'],
        },
      ],
    };

    // Run without --debug flag
    const result = await runCdpDebug({
      plan,
      cwd: fixturesTargetPath,
      debug: false,
    });

    expect(result.status).toBe('full_succeed');
    // meta should be undefined when --debug is not set
    expect(result.meta).toBeUndefined();
    // results should still be present
    expect(result.results.length).toBeGreaterThan(0);

    const values = getTaskValues(result, 'task-1');
    expect(values.trimmed).toBe('Ada Lovelace');
  }, 60_000);

  it('evaluates multiple breakpoints across files', async () => {
    const fixturesTargetPath = fixturePath('multi');

    const profileSourcePath = path.join(fixturesTargetPath, 'src/profile.ts');
    const mathSourcePath = path.join(fixturesTargetPath, 'src/math.ts');
    const plan = {
      runner: {
        ...createRunner(fixturesTargetPath, 'test/combined.test.ts'),
      },
      tasks: [
        {
          description: 'Inspect profile fields',
          sourcePath: profileSourcePath,
          line: 7,
          column: 0,
          expressions: ['trimmed', 'displayName', 'role'],
        },
        {
          description: 'Inspect math fields',
          sourcePath: mathSourcePath,
          line: 7,
          column: 0,
          expressions: ['total', 'average', 'label'],
        },
      ],
    };

    const result = await runCdpDebug({
      plan,
      cwd: fixturesTargetPath,
      debug: true,
    });

    expect(result.status).toBe('full_succeed');
    expect(result.meta?.pendingTaskIds.length).toBe(0);

    // Verify profile.ts breakpoint result
    const profileValues = getTaskValues(result, 'task-1');
    expect(profileValues.trimmed).toBe('Ada Lovelace');
    expect(profileValues.displayName).toBe('Ada Lovelace');
    expect(profileValues.role).toBe('admin');

    // Verify math.ts breakpoint result
    const mathValues = getTaskValues(result, 'task-2');
    expect(mathValues.total).toBe(60);
    expect(mathValues.average).toBe(20);
    expect(mathValues.label).toBe('3-scores');
  }, 60_000);

  it('handles non-existent breakpoint line gracefully', async () => {
    const fixturesTargetPath = fixturePath('invalid-line');

    const profileSourcePath = path.join(fixturesTargetPath, 'src/profile.ts');
    const plan = {
      runner: {
        ...createRunner(fixturesTargetPath, 'test/profile.test.ts'),
      },
      tasks: [
        {
          description: 'Breakpoint at non-existent line',
          sourcePath: profileSourcePath,
          line: 9999,
          column: 0,
          expressions: ['trimmed'],
        },
      ],
    };

    const result = await runCdpDebug({
      plan,
      cwd: fixturesTargetPath,
      debug: true,
    });

    // The task should remain pending since the breakpoint line doesn't exist
    expect(result.meta?.pendingTaskIds).toContain('task-1');
    // No results should be collected for the invalid breakpoint
    const taskResult = result.results.find((item) => item.id === 'task-1');
    expect(taskResult).toBeUndefined();
  }, 60_000);

  it('reports sourcemap mismatch in diagnostics', async () => {
    const fixturesTargetPath = fixturePath('mismatch');

    // Use a non-existent source file path that won't match any sourcemap
    const nonExistentSourcePath = path.join(
      fixturesTargetPath,
      'src/non-existent-file.ts',
    );
    const plan = {
      runner: {
        ...createRunner(fixturesTargetPath, 'test/profile.test.ts'),
      },
      tasks: [
        {
          description: 'Breakpoint in non-existent file',
          sourcePath: nonExistentSourcePath,
          line: 7,
          column: 0,
          expressions: ['foo'],
        },
      ],
    };

    const result = await runCdpDebug({
      plan,
      cwd: fixturesTargetPath,
      debug: true,
    });

    // The task should remain pending since no sourcemap matches
    expect(result.meta?.pendingTaskIds).toContain('task-1');
    // mappingDiagnostics should contain info about the mismatch
    expect(result.meta?.mappingDiagnostics.length).toBeGreaterThan(0);
    // At least one diagnostic should mention "no match" or similar
    const hasMismatchDiagnostic = result.meta?.mappingDiagnostics.some(
      (d) =>
        d.reason.toLowerCase().includes('no match') ||
        d.reason.toLowerCase().includes('not found') ||
        d.reason.toLowerCase().includes('mismatch'),
    );
    expect(hasMismatchDiagnostic).toBeTruthy();
  }, 60_000);
});
