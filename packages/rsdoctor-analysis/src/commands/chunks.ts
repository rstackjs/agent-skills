import type { Command } from 'commander';
import { API } from '../constants';
import { sendRequest } from '../socket';
import { getAllChunks } from '../tools';
import { getMedianChunkSize } from '../utils';
import { parseNumber, parsePositiveInt } from '../utils/cli-utils';

interface Chunk {
  size: number;
}

type CommandExecutor = (handler: () => Promise<unknown>) => Promise<void>;

export async function listChunks(
  pageNumberInput?: string,
  pageSizeInput?: string,
): Promise<{ ok: boolean; data: unknown; description: string }> {
  const pageNumber =
    parsePositiveInt(pageNumberInput, 'pageNumber', { min: 1 }) ?? 1;
  const pageSize =
    parsePositiveInt(pageSizeInput, 'pageSize', { min: 1, max: 1000 }) ?? 100;

  const chunks = await getAllChunks(pageNumber, pageSize);

  return {
    ok: true,
    data: chunks,
    description: 'List all chunks (id, name, size, modules).',
  };
}

export async function getChunkById(
  chunkIdInput: string | undefined,
): Promise<{ ok: boolean; data: unknown }> {
  const chunkId = parseNumber(chunkIdInput, 'id');
  if (chunkId === undefined) {
    throw new Error('Chunk id is required');
  }
  const chunk = await sendRequest(API.GetChunkByIdAI, { chunkId });
  if (!chunk) {
    throw new Error(`Chunk ${chunkId} not found`);
  }
  return { ok: true, data: chunk };
}

export async function findLargeChunks(): Promise<{
  ok: boolean;
  data: {
    median: number;
    operator: number;
    minSizeMB: number;
    oversized: unknown[];
  };
  description: string;
}> {
  // Get all chunks by using a very large page size
  const chunksResult = (await getAllChunks(1, Number.MAX_SAFE_INTEGER)) as {
    items?: Chunk[];
    total?: number;
  };
  const chunks =
    chunksResult.items || (Array.isArray(chunksResult) ? chunksResult : []);
  if (!chunks.length) {
    throw new Error('No chunks found.');
  }
  const median = getMedianChunkSize(chunks);
  const operator = 1.3;
  const minSizeMB = 1;
  const minSizeBytes = minSizeMB * 1024 * 1024; // 1MB in bytes
  const oversized = chunks.filter(
    (chunk) => chunk.size > median * operator && chunk.size >= minSizeBytes,
  );
  return {
    ok: true,
    data: { median, operator, minSizeMB, oversized },
    description:
      'Find oversized chunks (>30% over median size and >= 1MB) to prioritize splitChunks suggestions.',
  };
}

export function registerChunkCommands(
  program: Command,
  execute: CommandExecutor,
): void {
  const chunkProgram = program
    .command('chunks')
    .description('Chunk operations');

  chunkProgram
    .command('list')
    .description('List all chunks (id, name, size, modules).')
    .option('--page-number <pageNumber>', 'Page number (default: 1)')
    .option('--page-size <pageSize>', 'Page size (default: 100, max: 1000)')
    .action(function (this: Command) {
      const options = this.opts<{ pageNumber?: string; pageSize?: string }>();
      return execute(() => listChunks(options.pageNumber, options.pageSize));
    });

  chunkProgram
    .command('by-id')
    .description('Get chunk detail by numeric id.')
    .requiredOption('--id <id>', 'Chunk id')
    .action(function (this: Command) {
      const options = this.opts<{ id: string }>();
      return execute(() => getChunkById(options.id));
    });

  chunkProgram
    .command('large')
    .description(
      'Find oversized chunks (>30% over median size and >= 1MB) to prioritize splitChunks suggestions.',
    )
    .action(function (this: Command) {
      return execute(() => findLargeChunks());
    });
}
