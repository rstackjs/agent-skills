import type { Command } from 'commander';
import { getDataFileFromArgs } from '../datasource';

type CommandExecutor = (handler: () => Promise<unknown>) => Promise<void>;

export async function getPort(): Promise<{
  ok: boolean;
  data: { mode: string; dataFile: string | null; note: string };
  description: string;
}> {
  const filePath = getDataFileFromArgs();
  return {
    ok: true,
    data: {
      mode: 'json',
      dataFile: filePath,
      note: 'Using JSON data file mode. No server required.',
    },
    description: 'Get the JSON data file path used by the skill.',
  };
}

export function registerServerCommands(
  program: Command,
  execute: CommandExecutor,
): void {
  const serverProgram = program
    .command('server')
    .description('Server operations');

  serverProgram
    .command('port')
    .description('Get the JSON data file path used by the skill.')
    .action(function (this: Command) {
      return execute(() => getPort());
    });
}
