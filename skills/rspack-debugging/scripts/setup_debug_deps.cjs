const fs = require('fs');
const path = require('path');

const USER_MIN_VERSION = '1.3.14';

/**
 * Recursively find a file upwards from the start directory.
 */
function findFileUpwards(startDir, fileName) {
  let currentDir = startDir;
  while (true) {
    const filePath = path.join(currentDir, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached root
      return null;
    }
    currentDir = parentDir;
  }
}

// Find pnpm-lock.yaml to determine the workspace root
const lockPath = findFileUpwards(process.cwd(), 'pnpm-lock.yaml');

if (!lockPath) {
  console.error('❌ No pnpm-lock.yaml found in current or parent directories.');
  console.error('   This script requires a pnpm project with a lockfile.');
  process.exit(1);
}

const workspaceRoot = path.dirname(lockPath);
const pkgPath = path.join(workspaceRoot, 'package.json');
const backupPath = path.join(workspaceRoot, 'package.json.bak');

console.log(`📍 Workspace Root detected: ${workspaceRoot}`);

function restore() {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, pkgPath);
    console.log(`✅ Restored package.json from backup at ${backupPath}`);
    fs.unlinkSync(backupPath);
  } else {
    console.log(`No backup found at ${backupPath} to restore.`);
  }
}

if (process.argv.includes('--restore')) {
  restore();
  process.exit(0);
}

if (!fs.existsSync(pkgPath)) {
  console.error(`❌ No package.json found at workspace root: ${pkgPath}`);
  process.exit(1);
}

// Simple version comparison (major.minor.patch)
function isVersionLessThan(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (parts1[i] < parts2[i]) return true;
    if (parts1[i] > parts2[i]) return false;
  }
  return false;
}

// Backup first
if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(pkgPath, backupPath);
    console.log(`📦 Created backup of package.json at ${backupPath}`);
}

console.log('🔎 Searching for @rspack/core version in pnpm-lock.yaml...');
const lockContent = fs.readFileSync(lockPath, 'utf-8');

// Grep logic for pnpm-lock.yaml
// Matches /@rspack/core@1.0.0: or /@rspack/core@1.0.0(
const versionMatch = lockContent.match(/\@rspack\/core@([^\s:'()]+)/);

if (!versionMatch) {
  console.error('❌ Could not find "@rspack/core" in pnpm-lock.yaml.');
  process.exit(1);
}

let version = versionMatch[1];
console.log(`✅ Detected Rspack version: ${version}`);

if (isVersionLessThan(version, USER_MIN_VERSION)) {
  console.warn(`\n⚠️  WARNING: @rspack-debug/* packages are only officially supported for versions >= ${USER_MIN_VERSION}.`);
  console.warn(`   Current version is ${version}. Falling back to debug version ${USER_MIN_VERSION}.`);
  console.warn(`   This may lead to binary incompatibility if there are major API changes.\n`);
  version = USER_MIN_VERSION;
}

// Update package.json
const pkg = require(pkgPath);
pkg.pnpm = pkg.pnpm || {};
pkg.pnpm.overrides = pkg.pnpm.overrides || {};

const debugCore = `npm:@rspack-debug/core@${version}`;
const debugCli = `npm:@rspack-debug/cli@${version}`;

console.log(`🔄 Configuring pnpm overrides in workspace root package.json:`);
console.log(`   @rspack/core -> ${debugCore}`);
console.log(`   @rspack/cli  -> ${debugCli}`);

pkg.pnpm.overrides['@rspack/core'] = debugCore;
pkg.pnpm.overrides['@rspack/cli'] = debugCli;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✅ package.json at ${workspaceRoot} updated.`);
console.log('\n👉 Next Step: Run `pnpm install` in the workspace root to apply the overrides.');
console.log('   To revert changes, run this script with --restore');