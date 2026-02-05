import { Command } from 'commander';
import { registerAssetCommands } from './commands/assets';
import { registerBuildCommands } from './commands/build';
import { registerChunkCommands } from './commands/chunks';
import { registerErrorCommands } from './commands/errors';
import { registerLoaderCommands } from './commands/loaders';
import { registerModuleCommands } from './commands/modules';
import { registerPackageCommands } from './commands/packages';
import { registerRuleCommands } from './commands/rules';
import { registerServerCommands } from './commands/server';
import { closeAllSockets } from './socket';
import { printResult } from './utils/cli-utils';

export const program = new Command();
program
  .name('rsdoctor-skill')
  .description('Rsdoctor skill CLI')
  .option('--data-file <path>', 'Path to rsdoctor-data.json file (required)')
  .option('--compact', 'Compact JSON output')
  .showHelpAfterError()
  .showSuggestionAfterError();

export const execute = async (
  handler: () => Promise<unknown>,
): Promise<void> => {
  // Parse compact option once at the beginning
  const opts = program.opts<{ compact?: boolean | string }>();
  const compact = opts.compact === true || opts.compact === 'true';
  const spacing = compact ? 0 : 2;

  try {
    const result = await handler();
    // Format result similar to old format
    if (result && typeof result === 'object' && 'ok' in result) {
      console.log(JSON.stringify(result, null, spacing));
      if (!(result as { ok: boolean }).ok) {
        process.exit(1);
      }
    } else {
      printResult(result, compact);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(
      JSON.stringify(
        {
          ok: false,
          error: message,
        },
        null,
        spacing,
      ),
    );
    process.exit(1);
  }
};

// Register all command groups
registerChunkCommands(program, execute);
registerModuleCommands(program, execute);
registerPackageCommands(program, execute);
registerRuleCommands(program, execute);
registerAssetCommands(program, execute);
registerLoaderCommands(program, execute);
registerBuildCommands(program, execute);
registerErrorCommands(program, execute);
registerServerCommands(program, execute);

export async function run(): Promise<void> {
  if (process.argv.length <= 2) {
    program.help({ error: true });
  }
  await program.parseAsync(process.argv);

  // Cleanup
  closeAllSockets();
}
