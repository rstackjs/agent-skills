#!/usr/bin/env bash
set -euo pipefail

source_ref="${1:-origin/data:rspack.json}"

if [[ "${source_ref}" == "-h" || "${source_ref}" == "--help" ]]; then
  cat <<'EOF'
Usage: rspack-status.sh [rspack-json-path-or-git-ref]

Print the latest and previous Rspack eco-ci status rows from data/rspack.json.

Examples:
  rspack-status.sh
  rspack-status.sh origin/data:rspack.json
  rspack-status.sh /tmp/rspack.json
EOF
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "rspack-status.sh requires node in PATH." >&2
  exit 1
fi

read_status_json() {
  if [[ -f "${source_ref}" ]]; then
    cat "${source_ref}"
  else
    git show "${source_ref}"
  fi
}

read_status_json | node -e '
const fs = require("node:fs");

let rows;
try {
  rows = JSON.parse(fs.readFileSync(0, "utf8"));
} catch (error) {
  console.error(`Failed to parse rspack status JSON: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(rows) || rows.length === 0) {
  console.error("Rspack status JSON must be a non-empty array.");
  process.exit(1);
}

const latest = rows[0];
const previous = rows[1];

const fallback = (value, defaultValue = "unknown") => value ?? defaultValue;
const failedSuites = (row) => (row?.suites ?? []).filter((suite) => suite.status !== "success");
const suiteNames = (suites) => suites.map((suite) => fallback(suite.name));
const list = (items) => (items.length > 0 ? items.join(", ") : "none");

function printRun(label, row) {
  if (!row) {
    console.log(`${label}: none`);
    return;
  }

  const failed = failedSuites(row);
  console.log(`${label}:`);
  console.log(`  run: ${fallback(row.workflowRunUrl)}`);
  console.log(`  commit: ${fallback(row.commitSha)}`);
  console.log(`  time: ${fallback(row.commitTimestamp)}`);
  console.log(`  message: ${fallback(row.commitMessage)}`);
  console.log(`  status: ${fallback(row.overallStatus)}`);
  console.log(`  failed suites: ${list(suiteNames(failed))}`);
  for (const suite of failed) {
    console.log(`    - ${fallback(suite.name)}: ${fallback(suite.logUrl, "no job url")}`);
  }
}

function diffSuites(current, base) {
  const currentSet = new Set(suiteNames(failedSuites(current)));
  const baseSet = new Set(suiteNames(failedSuites(base)));

  return {
    added: [...currentSet].filter((name) => !baseSet.has(name)).sort(),
    recovered: [...baseSet].filter((name) => !currentSet.has(name)).sort(),
    unchanged: [...currentSet].filter((name) => baseSet.has(name)).sort(),
  };
}

printRun("latest", latest);
console.log("");
printRun("previous", previous);
console.log("");

const delta = diffSuites(latest, previous);
console.log("delta:");
console.log(`  new failing suites: ${list(delta.added)}`);
console.log(`  recovered suites: ${list(delta.recovered)}`);
console.log(`  unchanged failing suites: ${list(delta.unchanged)}`);
'
