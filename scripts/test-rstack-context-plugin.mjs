import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const skillNames = [
  'analyze-build',
  'assess-change-impact',
  'debug-dev-cycle',
  'explain-dead-code',
  'find-unused-code',
  'review-context-change',
];

const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(repositoryRoot, relativePath), 'utf8'));

const runServer = (configuration, cwd, env = {}) =>
  spawnSync(configuration.command, configuration.args ?? [], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });

const testManifest = async () => {
  const codex = await readJson('.codex-plugin/plugin.json');
  const claude = await readJson('.claude-plugin/plugin.json');
  const claudeMarketplace = await readJson('.claude-plugin/marketplace.json');
  const mcp = await readJson('.mcp.json');

  assert.equal(codex.name, 'rstack');
  assert.equal(claude.name, 'rstack');
  assert.equal(codex.version, '0.2.0');
  assert.equal(claude.version, codex.version);
  assert.equal(claudeMarketplace.plugins[0].version, codex.version);
  assert.equal(codex.mcpServers, './.mcp.json');
  assert.ok(
    mcp.mcpServers?.rstack,
    'the plugin must register one rstack MCP server',
  );
  assert.match(codex.description, /context/i);
  assert.match(claude.description, /context/i);
};

const testSkills = async () => {
  let analyzeBuild;
  for (const skillName of skillNames) {
    const source = await readFile(
      path.join(repositoryRoot, 'skills', skillName, 'SKILL.md'),
      'utf8',
    );
    assert.match(source, new RegExp(`name: ${skillName}`));
    assert.match(source, /project_status/);
    if (skillName === 'analyze-build') {
      analyzeBuild = source;
    }
  }

  assert.match(analyzeBuild, /plugin version is at least `1\.5\.11`/);
  assert.match(analyzeBuild, /output\.mode='brief'/);

  const rsdoctor = await readFile(
    path.join(repositoryRoot, 'skills/rsdoctor-analysis/SKILL.md'),
    'utf8',
  );
  assert.match(rsdoctor, /Rstack Context/);

  const evals = await readJson('skills-test/rstack-context/evals/evals.json');
  assert.equal(evals.skill_name, 'rstack-context');
  assert.ok(evals.evals.length >= 6);
};

const testWorkspaceLocalLauncher = async () => {
  const workspace = await mkdtemp(
    path.join(os.tmpdir(), 'rstack-agent-skills-local-'),
  );
  const recordPath = path.join(workspace, 'record.json');

  try {
    const packageRoot = path.join(workspace, 'node_modules/rstack');
    await mkdir(path.join(packageRoot, 'bin'), { recursive: true });
    await writeFile(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({
        name: 'rstack',
        type: 'module',
        exports: { './package.json': './package.json' },
        bin: { rs: './bin/rs.js' },
      }),
    );
    await writeFile(
      path.join(packageRoot, 'bin/rs.js'),
      [
        "import { writeFileSync } from 'node:fs';",
        'writeFileSync(process.env.RSTACK_PLUGIN_TEST_RECORD, JSON.stringify({',
        '  argv: process.argv.slice(2),',
        '  cwd: process.cwd(),',
        '}));',
      ].join('\n'),
    );

    const configuration = (await readJson('.mcp.json')).mcpServers.rstack;
    const result = runServer(configuration, workspace, {
      RSTACK_PLUGIN_TEST_RECORD: recordPath,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(await readJsonFrom(recordPath), {
      argv: ['mcp'],
      cwd: workspace,
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
};

const testPackageLocalLauncher = async () => {
  const workspace = await mkdtemp(
    path.join(os.tmpdir(), 'rstack-agent-skills-package-'),
  );
  const recordPath = path.join(workspace, 'record.json');

  try {
    await writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ private: true, workspaces: ['packages/*'] }),
    );
    const packageRoot = path.join(workspace, 'packages/app');
    const rstackRoot = path.join(packageRoot, 'node_modules/rstack');
    await mkdir(path.join(rstackRoot, 'bin'), { recursive: true });
    await writeFile(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({ name: '@fixture/app', private: true }),
    );
    await writeFile(
      path.join(rstackRoot, 'package.json'),
      JSON.stringify({
        name: 'rstack',
        type: 'module',
        exports: { './package.json': './package.json' },
        bin: { rs: './bin/rs.js' },
      }),
    );
    await writeFile(
      path.join(rstackRoot, 'bin/rs.js'),
      [
        "import { writeFileSync } from 'node:fs';",
        'writeFileSync(process.env.RSTACK_PLUGIN_TEST_RECORD, JSON.stringify({',
        '  argv: process.argv.slice(2),',
        '  cwd: process.cwd(),',
        '}));',
      ].join('\n'),
    );

    const configuration = (await readJson('.mcp.json')).mcpServers.rstack;
    const result = runServer(configuration, workspace, {
      PATH: path.dirname(process.execPath),
      RSTACK_PLUGIN_TEST_RECORD: recordPath,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(await readJsonFrom(recordPath), {
      argv: ['mcp'],
      cwd: workspace,
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
};

const readJsonFrom = async (filePath) =>
  JSON.parse(await readFile(filePath, 'utf8'));

const testPathLauncher = async () => {
  const workspace = await mkdtemp(
    path.join(os.tmpdir(), 'rstack-agent-skills-path-'),
  );
  const binRoot = path.join(workspace, 'bin');
  const recordPath = path.join(workspace, 'record.json');

  try {
    await mkdir(binRoot);
    const executable = path.join(binRoot, 'rs');
    await writeFile(
      executable,
      [
        '#!/usr/bin/env node',
        "const { writeFileSync } = require('node:fs');",
        'writeFileSync(process.env.RSTACK_PLUGIN_TEST_RECORD, JSON.stringify({',
        '  argv: process.argv.slice(2),',
        '  cwd: process.cwd(),',
        '}));',
      ].join('\n'),
    );
    await chmod(executable, 0o755);

    const configuration = (await readJson('.mcp.json')).mcpServers.rstack;
    const result = runServer(configuration, workspace, {
      PATH: `${binRoot}${path.delimiter}${process.env.PATH}`,
      RSTACK_PLUGIN_TEST_RECORD: recordPath,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(await readJsonFrom(recordPath), {
      argv: ['mcp'],
      cwd: workspace,
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
};

await testManifest();
await testSkills();
await testWorkspaceLocalLauncher();
await testPackageLocalLauncher();
await testPathLauncher();

console.log('Rstack Context plugin contract passed.');
