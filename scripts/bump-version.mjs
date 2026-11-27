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

const releaseTypes = ['patch', 'minor', 'major'];
const options = ['--dry-run', '--print-version'];
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const [release, option] = process.argv.slice(2);

if (!releaseTypes.includes(release)) {
  throw new Error(
    'Expected a release type: node scripts/bump-version.mjs <patch|minor|major> [--dry-run|--print-version]',
  );
}

if (option && !options.includes(option)) {
  throw new Error(`Unknown option: ${option}`);
}

const root = join(import.meta.dirname, '..');
const manifestSources = manifests.map(({ path, getVersion }) => {
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
if (versionParts.some((part) => !Number.isSafeInteger(part))) {
  throw new Error(`Version number is too large: ${currentVersion}`);
}

if (release === 'major') {
  versionParts[0]++;
  versionParts[1] = 0;
  versionParts[2] = 0;
} else if (release === 'minor') {
  versionParts[1]++;
  versionParts[2] = 0;
} else {
  versionParts[2]++;
}

if (versionParts.some((part) => !Number.isSafeInteger(part))) {
  throw new Error(`Next version number is too large for ${release}`);
}

const version = versionParts.join('.');
if (option === '--print-version') {
  console.log(version);
} else {
  for (const {
    path,
    filePath,
    source,
    field,
    currentVersion,
  } of manifestSources) {
    const updated = source.replace(
      field,
      field.replace(currentVersion, version),
    );
    if (option !== '--dry-run') {
      writeFileSync(filePath, updated);
    }
    console.log(
      `${path}: ${currentVersion} -> ${version}${option === '--dry-run' ? ' (dry run)' : ''}`,
    );
  }
}
