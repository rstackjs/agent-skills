import type { Command } from 'commander';
import { getErrors } from '../tools';
import { requireArg } from '../utils/cli-utils';

type CommandExecutor = (handler: () => Promise<unknown>) => Promise<void>;

interface Error {
  code: string;
  level: string;
}

export async function listErrors(): Promise<{
  ok: boolean;
  data: unknown;
  description: string;
}> {
  const errors = await getErrors();
  return {
    ok: true,
    data: errors,
    description: 'Get all errors and warnings from the build.',
  };
}

export async function getErrorsByCode(
  codeInput: string | undefined,
): Promise<{ ok: boolean; data: unknown[]; description: string }> {
  const errorCode = requireArg(codeInput, 'code');
  const errors = (await getErrors()) as Error[];
  const filtered = errors.filter((error) => error.code === errorCode);
  return {
    ok: true,
    data: filtered,
    description: 'Get errors filtered by error code (e.g., E1001, E1004).',
  };
}

export async function getErrorsByLevel(
  levelInput: string | undefined,
): Promise<{ ok: boolean; data: unknown[]; description: string }> {
  const errorLevel = requireArg(levelInput, 'level');
  const errors = (await getErrors()) as Error[];
  const filtered = errors.filter((error) => error.level === errorLevel);
  return {
    ok: true,
    data: filtered,
    description: 'Get errors filtered by level (error, warn, info).',
  };
}

export function registerErrorCommands(
  program: Command,
  execute: CommandExecutor,
): void {
  const errorProgram = program
    .command('errors')
    .description('Error operations');

  errorProgram
    .command('list')
    .description('Get all errors and warnings from the build.')
    .action(function (this: Command) {
      return execute(() => listErrors());
    });

  errorProgram
    .command('by-code')
    .description('Get errors filtered by error code (e.g., E1001, E1004).')
    .requiredOption('--code <code>', 'Error code')
    .action(function (this: Command) {
      const options = this.opts<{ code: string }>();
      return execute(() => getErrorsByCode(options.code));
    });

  errorProgram
    .command('by-level')
    .description('Get errors filtered by level (error, warn, info).')
    .requiredOption('--level <level>', 'Error level (error/warn/info)')
    .action(function (this: Command) {
      const options = this.opts<{ level: string }>();
      return execute(() => getErrorsByLevel(options.level));
    });
}
