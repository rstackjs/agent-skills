import type { Command } from 'commander';
import { getRuleInfo } from '../tools';

type CommandExecutor = (handler: () => Promise<unknown>) => Promise<void>;

export async function listRules(): Promise<{
  ok: boolean;
  data: unknown;
  description: string;
}> {
  const rules = await getRuleInfo();
  return {
    ok: true,
    data: rules,
    description: 'Get rule scan results (overlay alerts).',
  };
}

export function registerRuleCommands(
  program: Command,
  execute: CommandExecutor,
): void {
  const ruleProgram = program.command('rules').description('Rule operations');

  ruleProgram
    .command('list')
    .description('Get rule scan results (overlay alerts).')
    .action(function (this: Command) {
      return execute(() => listRules());
    });
}
