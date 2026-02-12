# Dependency Install Gate

Use this reference when running Step 3 of the migration workflow.

## Quick path

Run install with `ni` and trust its workspace/package-manager detection:

```bash
npx -y @antfu/ni install
```

Then verify `rstest` is resolvable from local dependencies.

If this succeeds, continue migration.

## Blocked mode

If install/check fails:

- Stop broad migration edits.
- If `ni` is unavailable or environment-blocked, use the repo-native package manager as fallback.
- Do not mix multiple package managers in one attempt unless user asks.
- In monorepo, only do manual workspace/root fallback when `ni` cannot be used.

Return a blocker report with:

1. Exact failed command(s).
2. Error class (network/auth/registry/peer conflict/lockfile mismatch/permission).
3. Concrete next command(s) for the user to run.
4. Whether files were already changed.
5. Resume point: "after dependencies are installed, continue from Step 4".
6. Install strategy used (`ni` or explicit manager fallback).
