import type { Command } from 'commander';
import { parsePositiveInt, parseNumber } from '../utils/cli-utils';
import { getLongLoadersByCosts, getLoaderTimes } from '../tools';

interface CommandExecutor {
  (handler: () => Promise<unknown>): Promise<void>;
}

interface LoaderItem {
  costs?: number;
  loader?: string;
  resource?: string;
  [key: string]: unknown;
}

interface DirectoryItem {
  directory?: string;
  totalCosts?: number;
  avgCosts?: number;
  files?: number;
  [key: string]: unknown;
}

export async function getHotFiles(
  pageNumberInput?: string,
  pageSizeInput?: string,
  minCostsInput?: string
): Promise<{ ok: boolean; data: unknown; description: string }> {
  const pageNumber = parsePositiveInt(pageNumberInput, 'pageNumber', { min: 1 }) ?? 1;
  const pageSize = parsePositiveInt(pageSizeInput, 'pageSize', { min: 1, max: 1000 }) ?? 100;
  const minCosts = parseNumber(minCostsInput, 'minCosts');

  const hotFiles = (await getLongLoadersByCosts()) as LoaderItem[];

  // Apply minCosts filter if provided
  let filtered = hotFiles;
  if (minCosts !== undefined) {
    filtered = hotFiles.filter((item) => (item.costs ?? 0) >= minCosts);
  }

  // Apply pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginated = filtered.slice(startIndex, endIndex);

  return {
    ok: true,
    data: {
      total,
      pageNumber,
      pageSize,
      totalPages,
      minCosts: minCosts ?? null,
      items: paginated,
    },
    description: 'Top third slowest loader/file pairs to surface expensive transforms.',
  };
}

export async function getDirectories(
  pageNumberInput?: string,
  pageSizeInput?: string,
  minTotalCostsInput?: string
): Promise<{ ok: boolean; data: unknown; description: string }> {
  const pageNumber = parsePositiveInt(pageNumberInput, 'pageNumber', { min: 1 }) ?? 1;
  const pageSize = parsePositiveInt(pageSizeInput, 'pageSize', { min: 1, max: 1000 }) ?? 100;
  const minTotalCosts = parseNumber(minTotalCostsInput, 'minTotalCosts');

  const directories = (await getLoaderTimes()) as DirectoryItem[];

  // Apply minTotalCosts filter if provided
  let filtered = directories;
  if (minTotalCosts !== undefined) {
    filtered = directories.filter((item) => (item.totalCosts ?? 0) >= minTotalCosts);
  }

  // Apply pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginated = filtered.slice(startIndex, endIndex);

  return {
    ok: true,
    data: {
      total,
      pageNumber,
      pageSize,
      totalPages,
      minTotalCosts: minTotalCosts ?? null,
      items: paginated,
    },
    description: 'Loader times grouped by directory.',
  };
}

export function registerLoaderCommands(program: Command, execute: CommandExecutor): void {
  const loaderProgram = program.command('loaders').description('Loader operations');

  loaderProgram
    .command('hot-files')
    .description('Top third slowest loader/file pairs to surface expensive transforms.')
    .option('--page-number <pageNumber>', 'Page number (default: 1)')
    .option('--page-size <pageSize>', 'Page size (default: 100, max: 1000)')
    .option('--min-costs <minCosts>', 'Minimum costs threshold (filter by minimum costs)')
    .action(function (this: Command) {
      const options = this.opts<{ pageNumber?: string; pageSize?: string; minCosts?: string }>();
      return execute(() => getHotFiles(options.pageNumber, options.pageSize, options.minCosts));
    });

  loaderProgram
    .command('directories')
    .description('Loader times grouped by directory.')
    .option('--page-number <pageNumber>', 'Page number (default: 1)')
    .option('--page-size <pageSize>', 'Page size (default: 100, max: 1000)')
    .option('--min-total-costs <minTotalCosts>', 'Minimum total costs threshold (filter by minimum total costs)')
    .action(function (this: Command) {
      const options = this.opts<{ pageNumber?: string; pageSize?: string; minTotalCosts?: string }>();
      return execute(() => getDirectories(options.pageNumber, options.pageSize, options.minTotalCosts));
    });
}
