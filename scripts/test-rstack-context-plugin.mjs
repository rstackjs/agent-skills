import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  chmod,
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const codexPluginRoot = 'plugins/rstack';
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

const listFiles = async (root, relativeRoot = '') => {
  const entries = await readdir(path.join(root, relativeRoot), {
    withFileTypes: true,
  });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeRoot, entry.name);
    if (entry.isDirectory())
      files.push(...(await listFiles(root, relativePath)));
    else if (entry.isFile()) files.push(relativePath);
  }
  return files.sort();
};

const runServer = (configuration, cwd, env = {}) =>
  spawnSync(configuration.command, configuration.args ?? [], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });

const testManifest = async () => {
  const portable = await readJson('plugin.json');
  const marketplace = await readJson('.agents/plugins/marketplace.json');
  const codex = await readJson(
    path.join(codexPluginRoot, '.codex-plugin/plugin.json'),
  );
  const claude = await readJson('.claude-plugin/plugin.json');
  const claudeMarketplace = await readJson('.claude-plugin/marketplace.json');
  const mcp = await readJson(path.join(codexPluginRoot, '.mcp.json'));
  const claudeMcp = await readJson('.mcp.json');

  await assert.rejects(
    readFile(path.join(repositoryRoot, codexPluginRoot, 'plugin.json')),
    (error) => error?.code === 'ENOENT',
  );

  assert.equal(portable.name, 'rstack');
  assert.equal(codex.name, 'rstack');
  assert.equal(claude.name, 'rstack');
  assert.equal(portable.version, '0.2.4');
  assert.ok(codex.version.startsWith(`${portable.version}+codex.`));
  assert.equal(claude.version, portable.version);
  assert.equal(claudeMarketplace.plugins[0].version, portable.version);
  assert.equal(marketplace.plugins[0].source.path, './plugins/rstack');
  assert.equal(codex.mcpServers, './.mcp.json');
  assert.deepEqual(mcp, claudeMcp);
  assert.ok(
    mcp.mcpServers?.rstack,
    'the plugin must register one rstack MCP server',
  );
  assert.match(portable.description, /context/i);
  assert.match(codex.description, /context/i);
  assert.match(claude.description, /context/i);
};

const testSkills = async () => {
  const sourceSkillsRoot = path.join(repositoryRoot, 'skills');
  const bundledSkillsRoot = path.join(
    repositoryRoot,
    codexPluginRoot,
    'skills',
  );
  const sourceFiles = await listFiles(sourceSkillsRoot);
  const bundledFiles = await listFiles(bundledSkillsRoot);
  assert.deepEqual(bundledFiles, sourceFiles);
  for (const relativePath of sourceFiles) {
    assert.deepEqual(
      await readFile(path.join(bundledSkillsRoot, relativePath)),
      await readFile(path.join(sourceSkillsRoot, relativePath)),
    );
  }

  let analyzeBuild;
  let assessChangeImpact;
  let debugDevCycle;
  let explainDeadCode;
  let findUnusedCode;
  let reviewContextChange;
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
    if (skillName === 'assess-change-impact') {
      assessChangeImpact = source;
    }
    if (skillName === 'debug-dev-cycle') {
      debugDevCycle = source;
    }
    if (skillName === 'explain-dead-code') {
      explainDeadCode = source;
    }
    if (skillName === 'find-unused-code') {
      findUnusedCode = source;
    }
    if (skillName === 'review-context-change') {
      reviewContextChange = source;
    }
  }

  assert.match(analyzeBuild, /plugin version is at least `1\.5\.11`/);
  assert.match(analyzeBuild, /output\.mode='brief'/);
  assert.match(assessChangeImpact, /plugin version is at least `1\.5\.11`/);
  assert.match(assessChangeImpact, /output\.mode='brief'/);
  for (const source of [debugDevCycle, explainDeadCode, findUnusedCode]) {
    assert.match(source, /test_snapshot/);
    assert.match(source, /statically related/i);
    assert.match(source, /execution.*coverage/i);
    assert.match(source, /rs test list --related/);
    assert.match(source, /selected test file count/i);
    assert.match(source, /directly imported leaf source/i);
    assert.match(source, /broad selection/i);
  }
  assert.match(debugDevCycle, /standalone `rstest\.config/);
  assert.match(debugDevCycle, /define\.test\(rstestConfig\)/);
  assert.match(reviewContextChange, /capture selection/);

  const rsdoctor = await readFile(
    path.join(repositoryRoot, 'skills/rsdoctor-analysis/SKILL.md'),
    'utf8',
  );
  assert.match(rsdoctor, /Rstack Context/);

  const evals = await readJson('skills-test/rstack-context/evals/evals.json');
  assert.equal(evals.skill_name, 'rstack-context');
  assert.ok(evals.evals.length >= 9);
  assert.deepEqual(
    evals.evals.slice(-3).map(({ eval_name }) => eval_name),
    [
      'related-test-fanout-gate',
      'external-checkout-root-binding',
      'standalone-rstest-config-adoption',
    ],
  );
};

const testRuntimeOwnershipDocumentation = async () => {
  const readme = await readFile(path.join(repositoryRoot, 'README.md'), 'utf8');

  assert.match(readme, /github\.com\/rstackjs\/context/);
  assert.match(readme, /Rstack CLI provides[\s\S]*`rs mcp`/);
  assert.match(readme, /Codex project\/session root/);
  assert.match(readme, /new Codex session\s+rooted at that checkout/);
  assert.match(readme, /standalone `rstest\.config/);
  assert.match(readme, /define\.test\(rstestConfig\)/);
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
        '  execArgv: process.execArgv,',
        '}));',
      ].join('\n'),
    );

    const configuration = (
      await readJson(path.join(codexPluginRoot, '.mcp.json'))
    ).mcpServers.rstack;
    const result = runServer(configuration, workspace, {
      RSTACK_PLUGIN_TEST_RECORD: recordPath,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(await readJsonFrom(recordPath), {
      argv: ['mcp'],
      cwd: workspace,
      execArgv: [],
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
};

const testPnpmWorkspaceLauncher = async () => {
  const workspace = await mkdtemp(
    path.join(os.tmpdir(), 'rstack-agent-skills-package-'),
  );
  const recordPath = path.join(workspace, 'record.json');

  try {
    await writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ private: true }),
    );
    await writeFile(
      path.join(workspace, 'pnpm-workspace.yaml'),
      "packages:\n  - 'packages/**' # applications\n",
    );
    const packageRoot = path.join(workspace, 'packages/apps/app');
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

    const configuration = (
      await readJson(path.join(codexPluginRoot, '.mcp.json'))
    ).mcpServers.rstack;
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

const testNestedPackageLauncher = async () => {
  const workspace = await mkdtemp(
    path.join(os.tmpdir(), 'rstack-agent-skills-nested-'),
  );
  const recordPath = path.join(workspace, 'record.json');

  try {
    await writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ name: 'repository-root', private: true }),
    );
    const packageRoot = path.join(workspace, 'frontend');
    const rstackRoot = path.join(packageRoot, 'node_modules/rstack');
    await mkdir(path.join(rstackRoot, 'bin'), { recursive: true });
    await writeFile(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({ name: 'frontend', private: true }),
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

    const configuration = (
      await readJson(path.join(codexPluginRoot, '.mcp.json'))
    ).mcpServers.rstack;
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

    const configuration = (
      await readJson(path.join(codexPluginRoot, '.mcp.json'))
    ).mcpServers.rstack;
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

const listRealRuntimeTools = async (configuration, cwd) => {
  const command =
    configuration.command === 'node' ? process.execPath : configuration.command;
  const child = spawn(command, configuration.args ?? [], {
    cwd,
    env: {
      ...process.env,
      PATH: process.env.RSTACK_PLUGIN_INTEGRATION_PATH ?? '',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const stderr = [];
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => stderr.push(chunk));

  const pending = new Map();
  const output = createInterface({ input: child.stdout });
  output.on('line', (line) => {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message.id === undefined) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  const request = (id, method, params) =>
    new Promise((resolve, reject) => {
      pending.set(id, { reject, resolve });
      child.stdin.write(
        `${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`,
      );
    });
  const rejectPending = (error) => {
    for (const { reject } of pending.values()) reject(error);
    pending.clear();
  };
  child.once('error', rejectPending);
  child.once('exit', (code, signal) => {
    if (pending.size === 0) return;
    rejectPending(
      new Error(
        `Rstack MCP exited before responding (${signal ?? code ?? 'unknown'}). ${stderr.join('')}`,
      ),
    );
  });
  const timeout = setTimeout(() => {
    rejectPending(
      new Error(`Timed out waiting for Rstack MCP. ${stderr.join('')}`),
    );
    child.kill('SIGKILL');
  }, 15_000);

  try {
    await request(1, 'initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'rstack-agent-skills-test', version: '1.0.0' },
    });
    child.stdin.write(
      `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`,
    );
    const result = await request(2, 'tools/list', {});
    return result.tools;
  } finally {
    clearTimeout(timeout);
    output.close();
    child.stdin.end();
    child.kill();
  }
};

const testRealRuntimeLauncher = async () => {
  const integrationRoot = process.env.RSTACK_PLUGIN_INTEGRATION_ROOT;
  if (!integrationRoot) return;

  const configuration = (
    await readJson(path.join(codexPluginRoot, '.mcp.json'))
  ).mcpServers.rstack;
  const tools = await listRealRuntimeTools(configuration, integrationRoot);
  const names = tools.map(({ name }) => name);
  for (const name of [
    'project_status',
    'product_roots',
    'test_snapshot',
    'code_evidence',
  ]) {
    assert.ok(names.includes(name), `real Rstack MCP must advertise ${name}`);
  }
};

await testManifest();
await testSkills();
await testRuntimeOwnershipDocumentation();
await testWorkspaceLocalLauncher();
await testPnpmWorkspaceLauncher();
await testNestedPackageLauncher();
await testPathLauncher();
await testRealRuntimeLauncher();

console.log('Rstack Context plugin contract passed.');
