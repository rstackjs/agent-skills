import type { Command } from 'commander';
import { getModuleExports, getRuleInfo, getSideEffects } from '../tools';
import { parsePositiveInt } from '../utils/cli-utils';

type CommandExecutor = (handler: () => Promise<unknown>) => Promise<void>;

interface Rule {
  description?: string;
  code?: string;
}

function findRuleByCode(rules: Rule[], code: string): Rule | undefined {
  return rules.find(
    (rule) => rule.code === code || rule.description?.includes(code),
  );
}

export async function detectSideEffectsOnlyImports(): Promise<{
  ok: boolean;
  data: { rule: Rule | null; totalRules: number; note?: string };
  description: string;
}> {
  const rules = (await getRuleInfo()) as Rule[];
  const rule = findRuleByCode(rules, 'E1007');
  return {
    ok: true,
    data: {
      rule: rule ?? null,
      totalRules: rules?.length ?? 0,
      note: rule
        ? undefined
        : 'No E1007 side-effects-only import violations found in current analysis.',
    },
    description:
      'Detect modules pulled in solely for side effects (E1007). ' +
      'These indicate tree-shaking failures caused by missing/incorrect "sideEffects" ' +
      'field in package.json or bare `import "module"` patterns. ' +
      "Rspack's sideEffects optimization can eliminate entire modules only when the package " +
      'declares "sideEffects": false (or a glob list) in package.json. ' +
      'Reference: https://www.rspack.dev/guide/optimization/tree-shaking',
  };
}

export async function detectCjsRequire(): Promise<{
  ok: boolean;
  data: { rule: Rule | null; totalRules: number; note?: string };
  description: string;
}> {
  const rules = (await getRuleInfo()) as Rule[];
  const rule = findRuleByCode(rules, 'E1008');
  return {
    ok: true,
    data: {
      rule: rule ?? null,
      totalRules: rules?.length ?? 0,
      note: rule
        ? undefined
        : 'No E1008 CJS require violations found in current analysis.',
    },
    description:
      'Detect `require()` calls that prevent tree-shaking (E1008). ' +
      'Bare `require("module")` forces the entire module to be bundled because ' +
      'the bundler cannot statically determine which exports are used. ' +
      'Rspack tree-shaking requires ES module syntax (import/export); ' +
      'CJS require() bypasses usedExports and innerGraph analysis entirely. ' +
      'Fix by using destructured require or ESM imports. ' +
      'Reference: https://www.rspack.dev/guide/optimization/tree-shaking',
  };
}

export async function detectEsmResolvedToCjs(): Promise<{
  ok: boolean;
  data: { rule: Rule | null; totalRules: number; note?: string };
  description: string;
}> {
  const rules = (await getRuleInfo()) as Rule[];
  const rule = findRuleByCode(rules, 'E1009');
  return {
    ok: true,
    data: {
      rule: rule ?? null,
      totalRules: rules?.length ?? 0,
      note: rule
        ? undefined
        : 'No E1009 ESM-resolved-to-CJS violations found in current analysis.',
    },
    description:
      'Detect ESM imports resolved to CJS despite the package providing an ESM entry (E1009). ' +
      "This prevents tree-shaking and inflates bundle size because Rspack's usedExports and " +
      'providedExports optimizations only work on ES module graphs. ' +
      'Fix by adding "module" to resolve.mainFields or "import" to resolve.conditionNames in bundler config. ' +
      'Reference: https://www.rspack.dev/guide/optimization/tree-shaking',
  };
}

export async function getTreeShakingSummary(): Promise<{
  ok: boolean;
  data: {
    violations: {
      e1007SideEffectsOnlyImports: Rule | null;
      e1008CjsRequire: Rule | null;
      e1009EsmToCjs: Rule | null;
    };
    totalViolations: number;
    sideEffects: unknown;
    totalRules: number;
  };
  description: string;
}> {
  const [rules, sideEffects] = await Promise.all([
    getRuleInfo() as Promise<Rule[]>,
    getSideEffects(),
  ]);
  const e1007 = findRuleByCode(rules, 'E1007') ?? null;
  const e1008 = findRuleByCode(rules, 'E1008') ?? null;
  const e1009 = findRuleByCode(rules, 'E1009') ?? null;
  const totalViolations = [e1007, e1008, e1009].filter(Boolean).length;
  return {
    ok: true,
    data: {
      violations: {
        e1007SideEffectsOnlyImports: e1007,
        e1008CjsRequire: e1008,
        e1009EsmToCjs: e1009,
      },
      totalViolations,
      sideEffects,
      totalRules: rules?.length ?? 0,
    },
    description:
      'Comprehensive tree-shaking health summary. ' +
      'Aggregates all three rule violations (E1007 side-effects-only imports, ' +
      'E1008 bare require() calls, E1009 ESM-resolved-to-CJS) together with ' +
      'per-module bailout reasons from the build graph. ' +
      'Rspack enables tree-shaking in production mode via usedExports, sideEffects, ' +
      'providedExports, and innerGraph — violations in this report indicate where those ' +
      'optimizations are being blocked. ' +
      'Use this as the starting point when diagnosing unexpected bundle size growth. ' +
      'Reference: https://www.rspack.dev/guide/optimization/tree-shaking',
  };
}

export async function getBailoutModules(
  pageNumberInput?: string,
  pageSizeInput?: string,
): Promise<{
  ok: boolean;
  data: unknown;
  description: string;
}> {
  const pageNumber =
    parsePositiveInt(pageNumberInput, 'pageNumber', { min: 1 }) ?? 1;
  const pageSize =
    parsePositiveInt(pageSizeInput, 'pageSize', { min: 1, max: 1000 }) ?? 100;
  const sideEffects = await getSideEffects(pageNumber, pageSize);
  return {
    ok: true,
    data: sideEffects,
    description:
      'List modules that cannot be tree-shaken, grouped by bailout reason. ' +
      'bailoutReason explains exactly why the bundler kept a module: ' +
      '"side effects" means package.json declares the package has side effects or the field is missing; ' +
      '"dynamic import" means the module is loaded via import() and its exports are unknown at build time; ' +
      '"unknown exports" means the module uses non-static export patterns (e.g. module.exports = ...) ' +
      'that the bundler cannot analyze statically. ' +
      'In Rspack, the innerGraph and providedExports optimizations are disabled for such modules, ' +
      'preventing dead-code elimination even in production mode. ' +
      'Results are split into node_modules packages and user code with per-package statistics. ' +
      'Fixing node_modules entries usually requires patching "sideEffects" in the upstream package or ' +
      'adding it to bundler sideEffects config; fixing user code requires converting to named ESM exports. ' +
      'Reference: https://www.rspack.dev/guide/optimization/tree-shaking',
  };
}

export async function getExportsAnalysis(): Promise<{
  ok: boolean;
  data: unknown;
  description: string;
}> {
  const exports = await getModuleExports();
  return {
    ok: true,
    data: exports,
    description:
<<<<<<< HEAD
      'Analyze module exports to identify tree-shaking opportunities. ' +
=======
      'Analyse module exports to identify tree-shaking opportunities. ' +
>>>>>>> f69d216 (feat(rsdoctor): add tree shaking skills)
      'Shows which exports exist across all modules so you can cross-reference ' +
      'with actual import usage. Exports that are never imported are candidates ' +
      'for removal. Re-exported barrel files (index.ts that re-exports everything) ' +
      'are a common cause of poor tree-shaking because the bundler must retain all ' +
      'transitive exports unless every consumer uses named imports exclusively. ' +
      "Rspack's providedExports and re-export analysis can redirect imports through " +
      're-export chains directly to source modules — but only when all exports use ' +
      'static ESM syntax. Mark side-effect-free calls with /*#__PURE__*/ to help ' +
      'the minimizer remove them safely. ' +
      'Reference: https://www.rspack.dev/guide/optimization/tree-shaking',
  };
}

export function registerTreeShakingCommands(
  program: Command,
  execute: CommandExecutor,
): void {
  const treeShakingProgram = program
    .command('tree-shaking')
    .description(
      'Tree-shaking analysis operations (E1007, E1008, E1009). ' +
        'Tree shaking removes unused exports to reduce bundle size. ' +
        'It requires ES modules (import/export syntax), production mode, and correct sideEffects config. ' +
        'Rspack applies usedExports, sideEffects, providedExports, and innerGraph optimizations automatically in production. ' +
        'Reference: https://www.rspack.dev/guide/optimization/tree-shaking',
    );

  treeShakingProgram
    .command('side-effects-only')
    .description(
      'Detect modules pulled in solely for side effects (E1007). ' +
        'Indicates tree-shaking failures from missing/incorrect "sideEffects" in package.json ' +
        'or bare `import "module"` patterns.',
    )
    .action(function (this: Command) {
      return execute(() => detectSideEffectsOnlyImports());
    });

  treeShakingProgram
    .command('cjs-require')
    .description(
      'Detect bare `require()` calls that prevent tree-shaking (E1008). ' +
        'Fix by using destructured require or ESM imports.',
    )
    .action(function (this: Command) {
      return execute(() => detectCjsRequire());
    });

  treeShakingProgram
    .command('esm-to-cjs')
    .description(
      'Detect ESM imports resolved to CJS despite an ESM entry being available (E1009). ' +
        'Fix via resolve.mainFields or resolve.conditionNames bundler config.',
    )
    .action(function (this: Command) {
      return execute(() => detectEsmResolvedToCjs());
    });

  treeShakingProgram
    .command('summary')
    .description(
      'Comprehensive tree-shaking health summary: all rule violations (E1007/E1008/E1009) ' +
        'plus per-module bailout reasons. Use this as the starting point when diagnosing ' +
        'unexpected bundle size growth.',
    )
    .action(function (this: Command) {
      return execute(() => getTreeShakingSummary());
    });

  treeShakingProgram
    .command('bailout-reasons')
    .description(
      'List modules that cannot be tree-shaken grouped by bailout reason ' +
        '(side effects / dynamic import / unknown exports). ' +
        'Results are split into node_modules and user code with per-package statistics.',
    )
    .option('--page-number <pageNumber>', 'Page number (default: 1)')
    .option('--page-size <pageSize>', 'Page size (default: 100, max: 1000)')
    .action(function (this: Command) {
      const options = this.opts<{ pageNumber?: string; pageSize?: string }>();
      return execute(() =>
        getBailoutModules(options.pageNumber, options.pageSize),
      );
    });

  treeShakingProgram
    .command('exports-analysis')
    .description(
<<<<<<< HEAD
      'Analyze module exports to identify unused exports and barrel-file anti-patterns ' +
=======
      'Analyse module exports to identify unused exports and barrel-file anti-patterns ' +
>>>>>>> f69d216 (feat(rsdoctor): add tree shaking skills)
        'that hurt tree-shaking. Cross-reference with actual import usage to find ' +
        'removal candidates.',
    )
    .action(function (this: Command) {
      return execute(() => getExportsAnalysis());
    });
}
