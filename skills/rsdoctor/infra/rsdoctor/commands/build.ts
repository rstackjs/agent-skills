import type { Command } from 'commander';
import { parsePositiveInt } from '../utils/cli-utils';
import { getBuildSummary, getEntrypoints, getBuildConfig, getAllChunks, getRuleInfo, getPackageInfo } from '../tools';
import { sendRequest } from '../socket';
import { API } from '../constants';
import { getMedianChunkSize } from '../utils';

interface CommandExecutor {
  (handler: () => Promise<unknown>): Promise<void>;
}

interface Rule {
  description?: string;
}

interface Package {
  name: string;
}

interface Chunk {
  size: number;
}

export async function getSummary(): Promise<{ ok: boolean; data: unknown; description: string }> {
  const summary = await getBuildSummary();
  return {
    ok: true,
    data: summary,
    description: 'Get build summary with costs (build time analysis).',
  };
}

export async function listEntrypoints(): Promise<{ ok: boolean; data: unknown; description: string }> {
  const entrypoints = await getEntrypoints();
  return {
    ok: true,
    data: entrypoints,
    description: 'List all entrypoints in the bundle.',
  };
}

export async function getConfig(): Promise<{ ok: boolean; data: unknown; description: string }> {
  const config = await getBuildConfig();
  return {
    ok: true,
    data: config,
    description: 'Get build configuration (rspack/webpack config).',
  };
}

export async function optimizeBundle(
  stepInput?: string,
  sideEffectsPageNumberInput?: string,
  sideEffectsPageSizeInput?: string
): Promise<{ ok: boolean; data: unknown; description: string }> {
  const step = stepInput ? parsePositiveInt(stepInput, 'step', { min: 1, max: 2 }) : undefined;
  
  // Step 1: Get basic optimization data (rules, packages, chunks)
  if (step === 1) {
    const [rules, packages, chunksResult] = await Promise.all([
      getRuleInfo(),
      getPackageInfo(),
      getAllChunks(1, Number.MAX_SAFE_INTEGER),
    ]);
    
    // Extract chunks from paginated result if needed
    const chunksResultTyped = chunksResult as { items?: Chunk[] } | Chunk[];
    const chunks = Array.isArray(chunksResultTyped) 
      ? chunksResultTyped 
      : (chunksResultTyped.items || []);

    // Detect duplicates
    const rulesArray = rules as Rule[];
    const duplicateRule = rulesArray?.find((rule) => rule.description?.includes('E1001'));

    // Detect similar packages
    const packagesArray = packages as Package[];
    const similarRules = [
      ['lodash', 'lodash-es', 'string_decode'],
      ['dayjs', 'moment', 'date-fns', 'js-joda'],
      ['antd', 'material-ui', 'semantic-ui-react', 'arco-design'],
      ['axios', 'node-fetch'],
      ['redux', 'mobx', 'zustand', 'recoil', 'jotai'],
      ['chalk', 'colors', 'picocolors', 'kleur'],
      ['fs-extra', 'graceful-fs'],
    ];

    const similarMatches = similarRules
      .map((group) => {
        const found = group.filter((pkg) =>
          packagesArray.some((p) => p.name.toLowerCase() === pkg.toLowerCase()),
        );
        return found.length > 1 ? found : null;
      })
      .filter((match): match is string[] => match !== null);

    // Get media assets
    const mediaAssets = { guidance: 'Media asset optimization guidance.', chunks };

    // Find large chunks (>30% over median size and >= 1MB)
    const chunksArray = chunks as Chunk[];
    const median = chunksArray.length ? getMedianChunkSize(chunksArray) : 0;
    const operator = 1.3;
    const minSizeMB = 1;
    const minSizeBytes = minSizeMB * 1024 * 1024; // 1MB in bytes
    const oversized = chunksArray.filter((chunk) => chunk.size > median * operator && chunk.size >= minSizeBytes);

    return {
      ok: true,
      data: {
        step: 1,
        duplicatePackages: {
          ok: true,
          data: {
            rule: duplicateRule ?? null,
            totalRules: rulesArray?.length ?? 0,
            note: duplicateRule
              ? undefined
              : 'No E1001 duplicate package rule found in current analysis.',
          },
        },
        similarPackages: {
          ok: true,
          data: {
            similarPackages: similarMatches,
            totalPackages: packagesArray.length,
            note: similarMatches.length
              ? undefined
              : 'No similar package groups detected in current analysis.',
          },
        },
        mediaAssets: {
          ok: true,
          data: mediaAssets,
        },
        largeChunks: {
          ok: true,
          data: { median, operator, minSizeMB, oversized },
        },
        note: 'Step 1 completed. Use --step 2 to get side effects modules.',
      },
      description:
        'Step 1: Basic bundle optimization analysis (duplicate packages, similar packages, media assets, large chunks).',
    };
  }

  // Step 2: Get side effects modules (with pagination)
  if (step === 2) {
    const pageNumber = parsePositiveInt(sideEffectsPageNumberInput, 'sideEffectsPageNumber', { min: 1 }) ?? 1;
    const pageSize = parsePositiveInt(sideEffectsPageSizeInput, 'sideEffectsPageSize', { min: 1, max: 1000 }) ?? 100;
    
    const sideEffectsData = await sendRequest(API.GetSideEffects, { pageNumber, pageSize });

    return {
      ok: true,
      data: {
        step: 2,
        sideEffectsModules: {
          ok: true,
          data: sideEffectsData,
        },
        pagination: {
          pageNumber,
          pageSize,
        },
        note: 'Step 2 completed. Side effects modules analysis with pagination.',
      },
      description:
        'Step 2: Side effects modules analysis (categorized by node_modules and user code, with package statistics).',
    };
  }

  // Default: Execute both steps (backward compatibility)
  // For default behavior, get side effects with default pagination (page 1, size 100)
  const defaultPageNumber = parsePositiveInt(sideEffectsPageNumberInput, 'sideEffectsPageNumber', { min: 1 }) ?? 1;
  const defaultPageSize = parsePositiveInt(sideEffectsPageSizeInput, 'sideEffectsPageSize', { min: 1, max: 1000 }) ?? 100;
  
  const [rules, packages, chunksResult, sideEffectsData] = await Promise.all([
    getRuleInfo(),
    getPackageInfo(),
    getAllChunks(1, Number.MAX_SAFE_INTEGER),
    sendRequest(API.GetSideEffects, { pageNumber: defaultPageNumber, pageSize: defaultPageSize }),
  ]);
  
  // Extract chunks from paginated result if needed
  const chunksResultTyped = chunksResult as { items?: Chunk[] } | Chunk[];
  const chunks = Array.isArray(chunksResultTyped) 
    ? chunksResultTyped 
    : (chunksResultTyped.items || []);

  // Detect duplicates
  const rulesArray = rules as Rule[];
  const duplicateRule = rulesArray?.find((rule) => rule.description?.includes('E1001'));

  // Detect similar packages
  const packagesArray = packages as Package[];
  const similarRules = [
    ['lodash', 'lodash-es', 'string_decode'],
    ['dayjs', 'moment', 'date-fns', 'js-joda'],
    ['antd', 'material-ui', 'semantic-ui-react', 'arco-design'],
    ['axios', 'node-fetch'],
    ['redux', 'mobx', 'zustand', 'recoil', 'jotai'],
    ['chalk', 'colors', 'picocolors', 'kleur'],
    ['fs-extra', 'graceful-fs'],
  ];

  const similarMatches = similarRules
    .map((group) => {
      const found = group.filter((pkg) =>
        packagesArray.some((p) => p.name.toLowerCase() === pkg.toLowerCase()),
      );
      return found.length > 1 ? found : null;
    })
    .filter((match): match is string[] => match !== null);

  // Get media assets
  const mediaAssets = { guidance: 'Media asset optimization guidance.', chunks };

  // Find large chunks (>30% over median size and >= 1MB)
  const chunksArray = chunks as Chunk[];
  const median = chunksArray.length ? getMedianChunkSize(chunksArray) : 0;
  const operator = 1.3;
  const minSizeMB = 1;
  const minSizeBytes = minSizeMB * 1024 * 1024; // 1MB in bytes
  const oversized = chunksArray.filter((chunk) => chunk.size > median * operator && chunk.size >= minSizeBytes);

  return {
    ok: true,
    data: {
      duplicatePackages: {
        ok: true,
        data: {
          rule: duplicateRule ?? null,
          totalRules: rulesArray?.length ?? 0,
          note: duplicateRule
            ? undefined
            : 'No E1001 duplicate package rule found in current analysis.',
        },
      },
      similarPackages: {
        ok: true,
        data: {
          similarPackages: similarMatches,
          totalPackages: packagesArray.length,
          note: similarMatches.length
            ? undefined
            : 'No similar package groups detected in current analysis.',
        },
      },
      mediaAssets: {
        ok: true,
        data: mediaAssets,
      },
      largeChunks: {
        ok: true,
        data: { median, operator, minSizeMB, oversized },
      },
      sideEffectsModules: {
        ok: true,
        data: sideEffectsData,
      },
    },
    description:
      'Combined bundle optimization inputs: duplicate packages, similar packages, media assets, large chunks, and side effects modules, add give the advice to optimize the bundle.',
  };
}

export function registerBuildCommands(program: Command, execute: CommandExecutor): void {
  const buildProgram = program.command('build').description('Build operations');

  buildProgram
    .command('summary')
    .description('Get build summary with costs (build time analysis).')
    .action(function (this: Command) {
      return execute(() => getSummary());
    });

  buildProgram
    .command('entrypoints')
    .description('List all entrypoints in the bundle.')
    .action(function (this: Command) {
      return execute(() => listEntrypoints());
    });

  buildProgram
    .command('config')
    .description('Get build configuration (rspack/webpack config).')
    .action(function (this: Command) {
      return execute(() => getConfig());
    });

  buildProgram
    .command('optimize')
    .description(
      'Combined bundle optimization inputs: duplicate packages, similar packages, media assets, large chunks, and side effects modules. Supports step-by-step execution for better performance.',
    )
    .option('--step <step>', 'Execution step: 1 (basic analysis) or 2 (side effects). If not specified, executes both steps.')
    .option('--side-effects-page-number <pageNumber>', 'Page number for side effects (default: 1, only used in step 2)')
    .option('--side-effects-page-size <pageSize>', 'Page size for side effects (default: 100, max: 1000, only used in step 2)')
    .action(function (this: Command) {
      const options = this.opts<{ 
        step?: string; 
        sideEffectsPageNumber?: string; 
        sideEffectsPageSize?: string;
      }>();
      return execute(() => optimizeBundle(
        options.step,
        options.sideEffectsPageNumber,
        options.sideEffectsPageSize
      ));
    });
}
