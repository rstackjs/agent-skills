import type { Command } from 'commander';
import {
  getPackageDependency,
  getPackageInfo,
  getPackageInfoByPackageName,
  getPackageInfoFiltered,
  getRuleInfo,
} from '../tools';
import { parsePositiveInt, requireArg } from '../utils/cli-utils';

type CommandExecutor = (handler: () => Promise<unknown>) => Promise<void>;

interface Rule {
  description?: string;
}

interface Package {
  name: string;
}

export async function listPackages(): Promise<{
  ok: boolean;
  data: unknown;
  description: string;
}> {
  const packages = await getPackageInfoFiltered();
  return {
    ok: true,
    data: packages,
    description: 'List packages with size/duplication info.',
  };
}

export async function getPackageByName(
  packageNameInput: string | undefined,
): Promise<{ ok: boolean; data: unknown; description: string }> {
  const packageName = requireArg(packageNameInput, 'name');
  const packages = await getPackageInfoByPackageName(packageName);
  return {
    ok: true,
    data: packages,
    description: 'Get package entries by name.',
  };
}

export async function getPackageDependencies(
  pageNumberInput?: string,
  pageSizeInput?: string,
): Promise<{ ok: boolean; data: unknown; description: string }> {
  const pageNumber =
    parsePositiveInt(pageNumberInput, 'pageNumber', { min: 1 }) ?? 1;
  const pageSize =
    parsePositiveInt(pageSizeInput, 'pageSize', { min: 1, max: 100 }) ?? 100;

  const dependencies = await getPackageDependency(pageNumber, pageSize);

  return {
    ok: true,
    data: dependencies,
    description: 'Get package dependency graph.',
  };
}

export async function detectDuplicatePackages(): Promise<{
  ok: boolean;
  data: { rule: Rule | null; totalRules: number; note?: string };
  description: string;
}> {
  const rules = (await getRuleInfo()) as Rule[];
  const duplicateRule = rules?.find((rule) =>
    rule.description?.includes('E1001'),
  );
  return {
    ok: true,
    data: {
      rule: duplicateRule ?? null,
      totalRules: rules?.length ?? 0,
      note: duplicateRule
        ? undefined
        : 'No E1001 duplicate package rule found in current analysis.',
    },
    description:
      'Detect duplicate packages using E1001 overlay rule if present.',
  };
}

export async function detectSimilarPackages(): Promise<{
  ok: boolean;
  data: { similarPackages: string[][]; totalPackages: number; note?: string };
  description: string;
}> {
  const packages = (await getPackageInfo()) as Package[];
  const rules = [
    ['lodash', 'lodash-es', 'string_decode'],
    ['dayjs', 'moment', 'date-fns', 'js-joda'],
    ['antd', 'material-ui', 'semantic-ui-react', 'arco-design'],
    ['axios', 'node-fetch'],
    ['redux', 'mobx', 'zustand', 'recoil', 'jotai'],
    ['chalk', 'colors', 'picocolors', 'kleur'],
    ['fs-extra', 'graceful-fs'],
  ];

  const matches = rules
    .map((group) => {
      const found = group.filter((pkg) =>
        packages.some((p) => p.name.toLowerCase() === pkg.toLowerCase()),
      );
      return found.length > 1 ? found : null;
    })
    .filter((match): match is string[] => match !== null);

  return {
    ok: true,
    data: {
      similarPackages: matches,
      totalPackages: packages.length,
      note: matches.length
        ? undefined
        : 'No similar package groups detected in current analysis.',
    },
    description: 'Detect similar packages (lodash/lodash-es etc.).',
  };
}

export function registerPackageCommands(
  program: Command,
  execute: CommandExecutor,
): void {
  const packageProgram = program
    .command('packages')
    .description('Package operations');

  packageProgram
    .command('list')
    .description('List packages with size/duplication info.')
    .action(function (this: Command) {
      return execute(() => listPackages());
    });

  packageProgram
    .command('by-name')
    .description('Get package entries by name.')
    .requiredOption('--name <name>', 'Package name')
    .action(function (this: Command) {
      const options = this.opts<{ name: string }>();
      return execute(() => getPackageByName(options.name));
    });

  packageProgram
    .command('dependencies')
    .description('Get package dependency graph.')
    .option('--page-number <pageNumber>', 'Page number (default: 1)')
    .option('--page-size <pageSize>', 'Page size (default: 100, max: 1000)')
    .action(function (this: Command) {
      const options = this.opts<{ pageNumber?: string; pageSize?: string }>();
      return execute(() =>
        getPackageDependencies(options.pageNumber, options.pageSize),
      );
    });

  packageProgram
    .command('duplicates')
    .description(
      'Detect duplicate packages using E1001 overlay rule if present.',
    )
    .action(function (this: Command) {
      return execute(() => detectDuplicatePackages());
    });

  packageProgram
    .command('similar')
    .description('Detect similar packages (lodash/lodash-es etc.).')
    .action(function (this: Command) {
      return execute(() => detectSimilarPackages());
    });
}
