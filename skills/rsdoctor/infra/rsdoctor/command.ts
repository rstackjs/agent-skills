import { Command } from 'commander';
import { printResult } from './utils/cli-utils';
import { registerChunkCommands } from './commands/chunks';
import { registerModuleCommands } from './commands/modules';
import { registerPackageCommands } from './commands/packages';
import { registerRuleCommands } from './commands/rules';
import { registerAssetCommands } from './commands/assets';
import { registerLoaderCommands } from './commands/loaders';
import { registerBuildCommands } from './commands/build';
import { registerErrorCommands } from './commands/errors';
import { registerServerCommands } from './commands/server';
import { closeAllSockets } from './socket';

export const program = new Command();
program
  .name('rsdoctor-skill')
  .description('Rsdoctor skill CLI')
  .option('--data-file <path>', 'Path to rsdoctor-data.json file (required)')
  .option('--compact', 'Compact JSON output')
  .showHelpAfterError()
  .showSuggestionAfterError();

export const execute = async (handler: () => Promise<unknown>): Promise<void> => {
  try {
    const result = await handler();
    // Format result similar to old format
    if (result && typeof result === 'object' && 'ok' in result) {
      const opts = program.opts<{ compact?: boolean | string }>();
      const compact = opts.compact === true || opts.compact === 'true';
      const spacing = compact ? 0 : 2;
      console.log(JSON.stringify(result, null, spacing));
      if (!(result as { ok: boolean }).ok) {
        process.exit(1);
      }
    } else {
      const opts = program.opts<{ compact?: boolean | string }>();
      printResult(result, opts.compact === true || opts.compact === 'true');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const opts = program.opts<{ compact?: boolean | string }>();
    const compact = opts.compact === true || opts.compact === 'true';
    const spacing = compact ? 0 : 2;
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
