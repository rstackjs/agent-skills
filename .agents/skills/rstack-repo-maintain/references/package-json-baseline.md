# Package Manifest Baseline

Use this reference to maintain `package.json` for published Rstack packages and to decide whether package metadata or dependency versions are stale.

## Evidence Sources

Refresh these sources before editing:

1. Read the target `package.json`, workspace config, lockfile, build config, generated output, and release workflow.
2. Read `web-infra-dev/rsbuild` main:
   - `packages/core/package.json` for shared metadata, runtime support, CLI fields, and complex exports.
   - The closest `packages/plugin-*/package.json` for Rsbuild plugin peer and development dependency patterns.
   - `pnpm-workspace.yaml` for cataloged tool and dependency versions.
3. Query the npm registry with `npm view <package> version dist-tags peerDependencies engines --json` when deciding whether a published dependency is current.

Do not call a version “latest” from a GitHub main-branch manifest alone. Distinguish the npm release from unreleased main-branch adoption.

## Select a Manifest Profile

### Shared Published-Package Fields

Review:

- Identity and discovery: `name`, `version`, `description`, `license`, `repository`, `homepage`, and `bugs`.
- Published surface: `files`, `type`, `types`, `exports`, and `bin` when applicable.
- Release behavior: `publishConfig`, package scripts, runtime `engines`, and side-effect declarations when applicable.
- Dependency roles: `dependencies`, `optionalDependencies`, `peerDependencies`, `peerDependenciesMeta`, and `devDependencies`.

For monorepo packages, include `repository.directory`. Keep field ordering aligned with the repository's package formatter.

### Core or CLI Package

Use `@rsbuild/core` only for packages with comparable responsibilities:

- Add `bin` only for a real executable entry.
- Publish `compiled`, `static`, or other generated directories only when the runtime loads them.
- Add subpath exports such as `./types` or `./package.json` only when they are intentional public API.
- Verify every listed file is created before publication.

Do not copy these core-specific fields into a focused library or plugin.

### Rsbuild Plugin Package

Use the closest official `@rsbuild/plugin-*` manifest as the structural baseline:

- Publish the built `dist` surface with explicit `types` and default ESM exports.
- Put `@rsbuild/core` in `devDependencies` for build and test execution.
- Put the supported host range in `peerDependencies`; do not replace a compatibility range with the latest exact version.
- Use `peerDependenciesMeta` only when the plugin can be installed or inspected without immediately requiring the host package.
- Preserve Rsbuild 1 compatibility only when the package has evidence or tests for it.

For an external plugin, a current `@rsbuild/core` dev dependency and a broader compatible peer range can both be correct.

### Standalone Library

Use a maintained small-package exemplar such as `rslog`:

- Keep `files`, `types`, and `exports` minimal and aligned with actual output.
- Prefer pure ESM only after checking consumers; retain dual output when CommonJS compatibility is intentional.
- Do not add Rsbuild-specific peer or CLI fields merely to match `@rsbuild/core`.

## Check Version Freshness

Classify each dependency before changing it:

- **Published latest**: the target range resolves to the npm `latest` release.
- **Compatible but behind**: the installed or minimum version is older, but the declared range already accepts the current release.
- **Incompatible behind**: the current release falls outside the declared range and the target should be evaluated for an upgrade.
- **Ahead or unreleased**: a main-branch, canary, RC, workspace, or catalog version is newer than npm `latest`; do not present it as a stable release.
- **Intentional pin**: an exact version protects artifact stability, compatibility, patching, or release coordination.
- **Repository-managed**: `workspace:`, `catalog:`, aliases, or overrides are controlled elsewhere; inspect that source instead of rewriting the leaf manifest.

Apply these rules:

1. Query npm immediately before reporting or editing version freshness.
2. Keep peer ranges based on tested compatibility, not release recency.
3. Keep runtime dependencies separate from build/test-only dependencies.
4. Update `package.json` and the package-manager lockfile together. Regenerate the lockfile with the repository package manager instead of hand-editing it.
5. Preserve deliberate aliases, patches, overrides, and synchronized version groups.

## Validate the Manifest

1. Run a clean or frozen install after regenerating the lockfile.
2. Run lint, typecheck, build, and tests required by the target.
3. Confirm every `files`, `bin`, `types`, and `exports` target exists in the built package.
4. Smoke test changed import, require, and CLI paths.
5. Run the repository's package or publish dry run, subject to the publint shortcut below.

### Publint Shortcut

Skip a separate `pnpm pack --dry-run` or equivalent package dry run when all of these are true:

- `rslib.config.ts` registers `pluginPublint` in the active plugins array.
- Its `enable` condition is true in the validation environment.
- `throwOn` is enforcing (`error`, `warning`, or `suggestion`), not `never`.
- A non-watch build completes successfully and therefore runs the plugin's `onAfterBuild` check.

Do not infer coverage from an import alone. Do not use the shortcut for a disabled plugin, an unresolved environment condition, a watch-only build, or a task that explicitly asks to inspect the produced tarball.

Prefer pnpm's native pack command for pnpm repositories. Use `pnpm pack --dry-run` when the repository's pnpm version supports it; the option was added in pnpm 10.26.0. For older versions or explicit tarball inspection, use `pnpm pack --pack-destination <temporary-directory>` and remove the temporary archive after inspection. Use `npm pack` only when npm is the target repository's package manager.

Never run `pnpm pack` without `--dry-run`, `--pack-destination`, or another explicit output path in the target working tree because it writes a `.tgz` archive there.

Report the shortcut explicitly, for example: “Skipped separate pack validation because the successful production build ran enforcing `pluginPublint`.”

## Report Results

Group findings into:

- Metadata or published-surface corrections.
- Dependency placement changes.
- Version freshness changes, with npm and main-branch sources kept distinct.
- Compatibility risks, especially peer ranges, ESM-only output, bins, and removed exports.
- Validation performed, including whether build-time publint replaced a separate pack command.
