import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const manifests = [
  {
    path: 'npm/skills/package.json',
    getVersion: (data) => data.version,
  },
  {
    path: 'npm/maintainer-skills/package.json',
    getVersion: (data) => data.version,
  },
  {
    path: 'plugin.json',
    getVersion: (data) => data.version,
  },
  {
    path: '.claude-plugin/plugin.json',
    getVersion: (data) => data.version,
  },
  {
    path: '.claude-plugin/marketplace.json',
    getVersion: (data) => {
      if (data.plugins?.length !== 1) {
        throw new Error(
          'Expected exactly one plugin in the marketplace manifest',
        );
      }
      return data.plugins[0].version;
    },
  },
  {
    path: '.codex-plugin/plugin.json',
    getVersion: (data) => data.version,
  },
];

const versionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const [version, option] = process.argv.slice(2);

if (!version || !versionPattern.test(version)) {
  throw new Error(
    'Expected a valid SemVer version, for example: node scripts/bump-version.mjs 1.0.2 [--dry-run]',
  );
}

if (option && option !== '--dry-run') {
  throw new Error(`Unknown option: ${option}`);
}

const dryRun = option === '--dry-run';
const root = join(import.meta.dirname, '..');
const updates = manifests.map(({ path, getVersion }) => {
  const filePath = join(root, path);
  const source = readFileSync(filePath, 'utf8');
  const currentVersion = getVersion(JSON.parse(source));

  if (
    typeof currentVersion !== 'string' ||
    !versionPattern.test(currentVersion)
  ) {
    throw new Error(`Invalid current version in ${path}: ${currentVersion}`);
  }

  const fields = [...source.matchAll(/"version"\s*:\s*"([^"]+)"/g)];
  if (fields.length !== 1 || fields[0][1] !== currentVersion) {
    throw new Error(`Expected one matching version field in ${path}`);
  }

  const updated = source.replace(
    fields[0][0],
    fields[0][0].replace(currentVersion, version),
  );

  return { path, filePath, source, updated, currentVersion };
});

if (updates.every(({ source, updated }) => source === updated)) {
  throw new Error(`All release manifests already use ${version}`);
}

for (const { path, filePath, source, updated, currentVersion } of updates) {
  if (source === updated) {
    console.log(`${path}: already ${version}`);
    continue;
  }
  if (!dryRun) {
    writeFileSync(filePath, updated);
  }
  console.log(
    `${path}: ${currentVersion} -> ${version}${dryRun ? ' (dry run)' : ''}`,
  );
}
