import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const manifestPaths = [
  'npm/skills/package.json',
  'npm/maintainer-skills/package.json',
  'plugin.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
];
const releases = ['major', 'minor', 'patch'];
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const [release, ...extraArguments] = process.argv.slice(2);
const bumpIndex = releases.indexOf(release);

if (bumpIndex === -1 || extraArguments.length > 0) {
  throw new Error(
    'Expected: node scripts/bump-version.mjs <patch|minor|major>',
  );
}

const root = join(import.meta.dirname, '..');
const manifestSources = manifestPaths.map((path) => {
  const filePath = join(root, path);
  const source = readFileSync(filePath, 'utf8');
  const data = JSON.parse(source);
  const isMarketplace = path === '.claude-plugin/marketplace.json';

  if (isMarketplace && data.plugins?.length !== 1) {
    throw new Error('Expected exactly one plugin in the marketplace manifest');
  }

  const currentVersion = isMarketplace ? data.plugins[0].version : data.version;
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

  return { path, filePath, source, field: fields[0][0], currentVersion };
});

const currentVersions = new Set(
  manifestSources.map(({ currentVersion }) => currentVersion),
);
if (currentVersions.size !== 1) {
  throw new Error(
    `Expected aligned manifest versions, found: ${[...currentVersions].join(', ')}`,
  );
}

const currentVersion = currentVersions.values().next().value;
const versionParts = currentVersion.split('.').map(Number);
versionParts[bumpIndex]++;
versionParts.fill(0, bumpIndex + 1);

if (versionParts.some((part) => !Number.isSafeInteger(part))) {
  throw new Error(`Version number is too large for ${release}`);
}

const version = versionParts.join('.');
for (const { filePath, source, field, currentVersion } of manifestSources) {
  const updated = source.replace(field, field.replace(currentVersion, version));
  writeFileSync(filePath, updated);
}
console.log(version);
