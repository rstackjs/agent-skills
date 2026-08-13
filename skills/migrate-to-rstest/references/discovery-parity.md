# Test Discovery Parity

Use this reference for every migration. A green run is not equivalent when Jest, Vitest, and Rstest discover different files or preserve different skips/excludes.

## Capture the pre-migration manifest

Before editing config, record:

- Relative test-file paths.
- Test, skip/todo, snapshot, and project counts from a normal run.
- `roots`, `testMatch`, `testRegex`, include/exclude/ignore patterns, projects/workspaces, CLI filters, and file-level environments.
- The reason and history for every explicit whole-file exclude when it is discoverable locally.

Use the previous runner's supported list command when available. For Jest, `jest --listTests --json` is usually suitable. For Vitest versions with a list command, use that version's documented file-only/JSON mode; otherwise preserve the normal run output. Store temporary manifests outside the working tree or remove them after comparison.

## Capture the Rstest manifest

After the config loads, prefer the installed version's machine-readable list support:

```bash
rstest list --filesOnly
rstest list --json=./rstest-tests.json
```

Check `rstest --help` first on older target lines. If list support is unavailable, capture the normal run's file list without upgrading solely for this step.

Normalize both manifests to paths relative to the same scope root, sort them, and compare exact sets. Then run the tests and compare counts; file parity alone does not prove case or skip parity.

## Classify every difference

For each added or removed file, decide whether it is:

- An intentional scope change approved by the user.
- A legacy `roots`/include omission now exposed by Rstest defaults.
- A historical exclude that still represents a real incompatibility.
- A generated, fixture, integration, local-only, or environment-specific file that should remain out of scope.
- An accidental discovery regression caused by config translation.

Do not silently preserve historical excludes, and do not silently expand the scope. Run newly included files explicitly before deciding. Record any deliberate difference in the migration summary.

## Guardrails

- Do not use `passWithNoTests` as evidence that discovery works.
- Do not compare performance until the manifests match or the difference is clearly labeled.
- Do not lower coverage thresholds to accommodate newly discovered files.
- Do not remove an exclude merely because its original comment looks old; inspect its history and run the file.
- When migrating one monorepo package, confirm root project aggregation does not pull unrelated packages into the manifest.

## Final evidence

Report both the previous and final file/test/skip counts. If Rstest intentionally covers more tests, provide same-scope performance separately from final expanded-scope performance.
