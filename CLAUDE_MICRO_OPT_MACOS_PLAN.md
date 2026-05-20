# micro-opt macOS Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `micro-opt` skill work identically on macOS via a bundled Docker wrapper, with cargo/codspeed/valgrind caches reused across one-shot `docker run --rm` calls.

**Architecture:** Add two bundled assets — `Dockerfile.micro-opt` and `docker-run.sh` — under `skills/micro-opt/assets/`. Rewrite `SKILL.md` so every profiling command is prefixed with `$MICRO_OPT_RUN`, which is empty on Linux and points at `docker-run.sh` on macOS. Named Docker volumes hold `target/`, the cargo registry, and the codspeed Valgrind cache.

**Tech Stack:** Bash, Docker (Desktop on macOS), Ubuntu 24.04 base, rustup, `cargo-codspeed`, system Valgrind.

**Spec:** `CLAUDE_MICRO_OPT_MACOS_DESIGN.md` at repo root.

**Constraint from user CLAUDE.md:** Do not run `git commit` yourself. At the end of every task that would commit, stage the files with `git add` and queue a suggested commit message; ask the user before invoking `git commit`.

---

### Task 1: Create branch and verify symlink target

**Files:**
- Touched: none (git/setup only)

- [ ] **Step 1: Confirm symlink layout**

Run:
```bash
readlink /Users/bytedance/.claude/skills/micro-opt
```
Expected output (exact): `/Users/bytedance/git/agent-skills/skills/micro-opt`

If output is empty, stop and report — the rest of the plan assumes the symlink exists.

- [ ] **Step 2: Create feature branch**

Run:
```bash
cd /Users/bytedance/git/agent-skills
git checkout -b perf/micro-opt-macos-docker
git status
```
Expected: branch switched, working tree clean apart from the two `CLAUDE_MICRO_OPT_MACOS_*.md` files already present at repo root.

- [ ] **Step 3: Stage and queue commit for the design + plan docs**

Run:
```bash
git add CLAUDE_MICRO_OPT_MACOS_DESIGN.md CLAUDE_MICRO_OPT_MACOS_PLAN.md
git status
```
Expected: both files staged.

Queue (do not auto-run): suggested commit message
```
docs: add micro-opt macOS parity design and plan
```
Ask user before running `git commit`.

---

### Task 2: Create `assets/Dockerfile.micro-opt`

**Files:**
- Create: `skills/micro-opt/assets/Dockerfile.micro-opt`

- [ ] **Step 1: Ensure assets directory exists**

Run:
```bash
mkdir -p /Users/bytedance/git/agent-skills/skills/micro-opt/assets
ls /Users/bytedance/git/agent-skills/skills/micro-opt/assets
```
Expected: directory exists, empty.

- [ ] **Step 2: Write the Dockerfile**

Create `skills/micro-opt/assets/Dockerfile.micro-opt` with this exact content:

```dockerfile
# syntax=docker/dockerfile:1.7
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:/usr/local/rustup/bin:$PATH

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl git pkg-config build-essential \
        libssl-dev cmake clang lld \
        valgrind \
    && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
      | sh -s -- -y --default-toolchain stable --profile minimal --no-modify-path

RUN cargo install cargo-codspeed --locked

WORKDIR /work
```

- [ ] **Step 3: Sanity-check the Dockerfile parses**

Run:
```bash
docker build --check -f /Users/bytedance/git/agent-skills/skills/micro-opt/assets/Dockerfile.micro-opt /Users/bytedance/git/agent-skills/skills/micro-opt/assets 2>&1 | head -30
```
Expected: no syntax errors. Warnings about `# syntax` ARG usage are fine; any `ERROR` line means the file content is wrong.

If `docker build --check` is unavailable on the local Docker version, skip and rely on Task 4's build smoke test.

- [ ] **Step 4: Stage**

Run:
```bash
git add skills/micro-opt/assets/Dockerfile.micro-opt
git status
```
Expected: the new Dockerfile staged.

Queue commit message:
```
feat(micro-opt): add Dockerfile for macOS Linux profiling environment
```
Ask user before running `git commit`.

---

### Task 3: Create `assets/docker-run.sh`

**Files:**
- Create: `skills/micro-opt/assets/docker-run.sh`

- [ ] **Step 1: Write the wrapper script**

Create `skills/micro-opt/assets/docker-run.sh` with this exact content:

```bash
#!/usr/bin/env bash
set -euo pipefail

[[ $# -gt 0 ]] || { echo "Usage: docker-run.sh <command> [args...]" >&2; exit 1; }

if [[ "$(uname -s)" != "Darwin" ]]; then
  exec "$@"
fi

case "$(uname -m)" in
  arm64|aarch64) HOST_PLATFORM=linux/arm64 ;;
  x86_64|amd64)  HOST_PLATFORM=linux/amd64 ;;
  *)             HOST_PLATFORM=linux/amd64 ;;
esac

PLATFORM="${MICRO_OPT_PLATFORM:-$HOST_PLATFORM}"
IMAGE="${MICRO_OPT_IMAGE:-micro-opt:${PLATFORM//\//-}}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! docker info >/dev/null 2>&1; then
  echo "Docker Desktop is not running. Start it and re-run." >&2
  exit 1
fi

DOCKERFILE_HASH="$(shasum -a 256 "$SKILL_DIR/Dockerfile.micro-opt" | cut -c1-12)"
IMAGE_HASH="$(docker image inspect "$IMAGE" --format '{{index .Config.Labels "micro-opt.hash"}}' 2>/dev/null || true)"

if [[ "$IMAGE_HASH" != "$DOCKERFILE_HASH" ]]; then
  docker build --platform "$PLATFORM" \
    --label "micro-opt.hash=$DOCKERFILE_HASH" \
    -t "$IMAGE" \
    -f "$SKILL_DIR/Dockerfile.micro-opt" "$SKILL_DIR" >&2
fi

REPO_ROOT="$(pwd)"
PROJECT_HASH="$(printf '%s' "$REPO_ROOT" | shasum -a 256 | cut -c1-12)"
TARGET_VOL="micro-opt-target-${PROJECT_HASH}"

TTY_FLAG=()
[[ -t 0 && -t 1 ]] && TTY_FLAG=(-t)

exec docker run --rm -i "${TTY_FLAG[@]}" \
  --platform "$PLATFORM" \
  -v "$REPO_ROOT":/work \
  -v "$TARGET_VOL":/work/target \
  -v micro-opt-cargo-registry:/usr/local/cargo/registry \
  -v micro-opt-cargo-git:/usr/local/cargo/git \
  -v micro-opt-cache:/root/.cache \
  -w /work \
  -e MICRO_OPT_INSIDE_DOCKER=1 \
  "$IMAGE" \
  "$@"
```

- [ ] **Step 2: Make executable**

Run:
```bash
chmod +x /Users/bytedance/git/agent-skills/skills/micro-opt/assets/docker-run.sh
ls -l /Users/bytedance/git/agent-skills/skills/micro-opt/assets/docker-run.sh
```
Expected: mode shows `-rwxr-xr-x` (executable bits set).

- [ ] **Step 3: Lint with bash -n**

Run:
```bash
bash -n /Users/bytedance/git/agent-skills/skills/micro-opt/assets/docker-run.sh && echo OK
```
Expected: `OK`. Any other output means a syntax error.

- [ ] **Step 4: Stage**

Run:
```bash
git add skills/micro-opt/assets/docker-run.sh
git status
```
Queue commit message:
```
feat(micro-opt): add docker-run.sh wrapper for cross-platform parity
```
Ask user before running `git commit`.

---

### Task 4: Test docker-run.sh — Linux passthrough

**Files:**
- Touched: none (test-only)

**Why this task:** the Linux branch is `exec "$@"`. Verify it forwards args and exit codes before relying on it from SKILL.md.

- [ ] **Step 1: Simulate Linux platform via fake uname**

Run:
```bash
mkdir -p /tmp/micro-opt-test-bin
cat >/tmp/micro-opt-test-bin/uname <<'SH'
#!/usr/bin/env bash
if [[ "${1:-}" == "-s" ]]; then echo Linux; else exec /usr/bin/uname "$@"; fi
SH
chmod +x /tmp/micro-opt-test-bin/uname
```
Expected: file created and executable.

- [ ] **Step 2: Verify passthrough propagates argv and exit code**

Run:
```bash
PATH="/tmp/micro-opt-test-bin:$PATH" \
  /Users/bytedance/git/agent-skills/skills/micro-opt/assets/docker-run.sh \
  bash -c 'echo "args=$*"; exit 7' one 'two three'
echo "exit=$?"
```
Expected exact output:
```
args=two three
exit=7
```

(`bash -c` treats the first positional argument as `$0`, so `$*` is `two three`. The test still proves passthrough: the wrapper forwarded all four args and the exit code 7 made it back.)

- [ ] **Step 3: Clean up the fake binary**

Run:
```bash
rm -rf /tmp/micro-opt-test-bin
```

No commit for this task (test-only verification).

---

### Task 5: Test docker-run.sh — macOS build + smoke

**Files:**
- Touched: none (test-only)

**Why this task:** validate end-to-end on the real host. First run also produces the cached image used by every subsequent step.

- [ ] **Step 1: Verify Docker Desktop is reachable**

Run:
```bash
docker info >/dev/null 2>&1 && echo OK
```
Expected: `OK`. If not, start Docker Desktop and retry before continuing.

- [ ] **Step 2: First-time build (warm the cache)**

Run from inside `/Users/bytedance/git/agent-skills`:
```bash
time skills/micro-opt/assets/docker-run.sh valgrind --version
```
Expected first run: `docker build` log on stderr, then a `valgrind-3.2x.x` version string on stdout. Build time ~5-10 minutes; record this in the smoke notes.

- [ ] **Step 3: Verify second call does not rebuild**

Run:
```bash
time skills/micro-opt/assets/docker-run.sh valgrind --version
```
Expected: no `docker build` output, the version string returns in under ~3 seconds.

- [ ] **Step 4: Verify cargo-codspeed is preinstalled**

Run:
```bash
skills/micro-opt/assets/docker-run.sh cargo codspeed --version
```
Expected: `cargo-codspeed 2.x.x` (any 2.x).

- [ ] **Step 5: Verify platform is arm64 by default and overridable**

Run:
```bash
skills/micro-opt/assets/docker-run.sh bash -lc 'echo "PLAT=$(uname -m) OS=$(uname -s)"'
MICRO_OPT_PLATFORM=linux/amd64 skills/micro-opt/assets/docker-run.sh bash -lc 'echo "PLAT=$(uname -m) OS=$(uname -s)"'
```
Expected outputs (in order):
```
PLAT=aarch64 OS=Linux
PLAT=x86_64 OS=Linux
```
The amd64 form may take longer the first time it pulls a separate image layer set.

- [ ] **Step 6: Verify artifact bind-mount is host-visible**

Run:
```bash
mkdir -p /tmp/micro-opt-bindcheck && cd /tmp/micro-opt-bindcheck
/Users/bytedance/git/agent-skills/skills/micro-opt/assets/docker-run.sh \
  bash -lc 'mkdir -p optimization-artifacts/smoke && echo hello > optimization-artifacts/smoke/proof.txt'
cat optimization-artifacts/smoke/proof.txt
cd - && rm -rf /tmp/micro-opt-bindcheck
```
Expected: `hello` printed on host.

No commit for this task.

---

### Task 6: SKILL.md — frontmatter and Platform Setup section

**Files:**
- Modify: `skills/micro-opt/SKILL.md:1-9`

- [ ] **Step 1: Update the frontmatter description**

In `skills/micro-opt/SKILL.md`, replace this exact line (line 3):

```
description: Use when making automated micro-optimizations with benchmark-driven CodSpeed or Valgrind data. If the project already has benchmarks, prefer CodSpeed-generated temporary Valgrind data first; otherwise fall back to direct Valgrind with explicit tool-specific parameters. Guides agents to open a draft PR first, choose the right profiler mode and metric, collect baseline data, set an optimization goal, iterate on small verified changes, commit measurable progress, and keep the PR description updated with metric deltas.
```

with:

```
description: Use when making automated micro-optimizations with benchmark-driven CodSpeed or Valgrind data. If the project already has benchmarks, prefer CodSpeed-generated temporary Valgrind data first; otherwise fall back to direct Valgrind with explicit tool-specific parameters. Guides agents to open a draft PR first, choose the right profiler mode and metric, collect baseline data, set an optimization goal, iterate on small verified changes, commit measurable progress, and keep the PR description updated with metric deltas. Works on Linux natively and on macOS through a bundled Docker wrapper with identical commands.
```

- [ ] **Step 2: Insert the Platform Setup section before `## Required Workflow`**

In `skills/micro-opt/SKILL.md`, immediately after the line `Use this skill when the user wants an agent to reduce low-level cost in a benchmarked hot path, especially when benchmark-backed CodSpeed or Valgrind data is the source of truth.` (and its trailing blank line), insert this exact block:

````markdown
## Platform Setup

Run this once at the start of every session before any profiling step. It is a no-op on Linux and prepares the Docker wrapper on macOS.

```bash
SKILL_DIR="$(dirname "$(readlink -f "$0" 2>/dev/null || python3 -c 'import os,sys;print(os.path.realpath(sys.argv[1]))' "$0")")"
# Replace SKILL_DIR with the absolute path of skills/micro-opt/assets if you are not running this from a script.

if [[ "$(uname -s)" == "Darwin" ]]; then
  command -v docker >/dev/null || { echo "Install Docker Desktop first." >&2; exit 1; }
  docker info >/dev/null 2>&1 || { echo "Start Docker Desktop, then re-run." >&2; exit 1; }
  export MICRO_OPT_RUN="$SKILL_DIR/docker-run.sh"
  export MICRO_OPT_PLATFORM="${MICRO_OPT_PLATFORM:-linux/arm64}"
else
  export MICRO_OPT_RUN=""
fi
```

Verify the wrapper before doing anything else:

```bash
$MICRO_OPT_RUN valgrind --version
$MICRO_OPT_RUN cargo codspeed --version
$MICRO_OPT_RUN bash -lc 'echo PLATFORM=$(uname -m) OS=$(uname -s)'
```

Expected: a valgrind 3.2x version, `cargo-codspeed 2.x`, and on macOS `PLATFORM=aarch64 OS=Linux` (or `x86_64` when `MICRO_OPT_PLATFORM=linux/amd64`).

CodSpeed Valgrind fork compatibility: if a later `codspeed run -m simulation` step fails with a missing Valgrind fork on `linux/arm64`, export `MICRO_OPT_PLATFORM=linux/amd64` and rerun. Treat any prior baseline taken on the other platform as invalid; collect a new baseline on the chosen platform before proceeding.

First-time image build on macOS takes 5-10 minutes. Do this before recording a baseline so build time is not counted in benchmark numbers.

````

- [ ] **Step 3: Verify the edits**

Run:
```bash
head -50 /Users/bytedance/git/agent-skills/skills/micro-opt/SKILL.md
```
Expected: frontmatter shows the updated description; line below the intro paragraph is `## Platform Setup`; the inserted block is intact and followed by the original `## Required Workflow`.

- [ ] **Step 4: Stage**

Run:
```bash
git add skills/micro-opt/SKILL.md
git status
```
Queue commit message:
```
docs(micro-opt): add Platform Setup section and macOS frontmatter note
```
Ask user before running `git commit`.

---

### Task 7: SKILL.md — replace the old `macOS With Docker` section

**Files:**
- Modify: `skills/micro-opt/SKILL.md:97-139`

- [ ] **Step 1: Replace the entire old section**

In `skills/micro-opt/SKILL.md`, locate the existing block that starts with `## macOS With Docker` and ends just before `## CodSpeed Projects`. Replace the entire block with this exact content:

```markdown
## macOS Notes

The canonical macOS workflow lives in `Platform Setup` above. The same shell snippets in this document run on macOS once `MICRO_OPT_RUN` is exported; do not write a separate macOS command path.

When the project ships its own Docker image (for example a CodSpeed CI image), set `MICRO_OPT_IMAGE=<that-tag>` so the wrapper reuses it. The image must contain Valgrind and any project build dependencies; the wrapper does not install anything inside a user-provided image.
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -n "^## " /Users/bytedance/git/agent-skills/skills/micro-opt/SKILL.md
```
Expected: section headers in order include `## Platform Setup`, then `## Required Workflow`, then `## Collecting Valgrind Data`, then `## macOS Notes`, then `## CodSpeed Projects`, then `## PR Description Template`, then `## Stop Conditions`. The `## macOS With Docker` header is gone.

- [ ] **Step 3: Stage**

```bash
git add skills/micro-opt/SKILL.md
```
Queue commit message:
```
docs(micro-opt): collapse macOS With Docker into Platform Setup pointer
```
Ask user before running `git commit`.

---

### Task 8: SKILL.md — prefix command templates with `$MICRO_OPT_RUN`

**Files:**
- Modify: `skills/micro-opt/SKILL.md` (multiple code blocks)

**Why:** the parity contract requires the same snippet to run on both platforms with `MICRO_OPT_RUN` deciding whether Docker is involved.

- [ ] **Step 1: Prefix the direct Valgrind fallback**

Find the code block starting with `valgrind --tool=<tool> \` in `## Collecting Valgrind Data` and replace it with:

```bash
$MICRO_OPT_RUN valgrind --tool=<tool> \
  -q \
  --trace-children=yes \
  --fair-sched=yes \
  --cache-sim=yes \
  --I1=32768,8,64 \
  --D1=32768,8,64 \
  --LL=8388608,16,64 \
  --instr-atstart=no \
  --collect-systime=nsec \
  --read-inline-info=yes \
  --trace-children-skip='*esbuild' \
  --<tool>-out-file=optimization-artifacts/valgrind/<tool>/<run>/<tool>.out.%p \
  --log-file=optimization-artifacts/valgrind/<tool>/<run>/valgrind.log \
  <benchmark-command>
```

- [ ] **Step 2: Prefix the annotate helpers**

Replace the three annotate examples in the same section with:

```bash
$MICRO_OPT_RUN callgrind_annotate --show=Ir --sort=Ir --threshold=90 <callgrind-output>
$MICRO_OPT_RUN cg_annotate --show=D1mr,DLmr,Bcm --sort=D1mr <cachegrind-output>
$MICRO_OPT_RUN ms_print <massif-output>
```

And the largest-out-file pair below it:

```bash
$MICRO_OPT_RUN bash -lc 'ls -lS optimization-artifacts/valgrind/callgrind/<run>/*.out'
$MICRO_OPT_RUN callgrind_annotate --show=Ir --sort=Ir --threshold=90 <largest-out-file>
```

Why `bash -lc` around `ls`: globbing happens inside the container so the named-volume-backed target paths resolve correctly when present, and the user's host shell does not need to interpret the wildcard.

- [ ] **Step 3: Prefix the CodSpeed Rust block**

In `## CodSpeed Projects`, replace the multi-line baseline block with one Docker-wrapped invocation:

````markdown
  ```bash
  run_id="$(date +%Y%m%d-%H%M%S)-baseline"
  out_dir="optimization-artifacts/codspeed/$run_id"
  mkdir -p "$out_dir/profile"
  $MICRO_OPT_RUN bash -lc "
    set -euo pipefail
    cargo codspeed build --bench <bench-target> -m simulation >\"$out_dir/build.log\" 2>&1
    codspeed run -m simulation \\
      --profile-folder \"$out_dir/profile\" \\
      -- cargo codspeed run --bench <bench-target> -m simulation \"<case-filter>\" \\
      >\"$out_dir/run.log\" 2>&1
  "
  ```
````

Why a single wrapped invocation: shell variables (`run_id`, `out_dir`) are computed once on the host and substituted into the container command, so both build and run log paths match what host-side `ls` shows.

- [ ] **Step 4: Prefix the ad hoc CodSpeed and inspector helpers**

Replace the surrounding helper lines so they read:

```bash
$MICRO_OPT_RUN bash -c "ls -lS \"$out_dir\"/profile/*.out"
largest="$($MICRO_OPT_RUN bash -c "ls -S \"$out_dir\"/profile/*.out | head -n 1")"
$MICRO_OPT_RUN callgrind_annotate --show=Ir --sort=Ir --threshold=90 "$largest"
```

And the `codspeed run` / `codspeed exec` examples earlier in the section:

```bash
$MICRO_OPT_RUN codspeed run -m simulation -- <bench-command>
$MICRO_OPT_RUN codspeed exec -m simulation -- <benchmark-command>
```

- [ ] **Step 5: Verify nothing was missed**

Run:
```bash
grep -nE '^\s*(valgrind|callgrind_annotate|cg_annotate|ms_print|cargo codspeed|codspeed run|codspeed exec)\b' /Users/bytedance/git/agent-skills/skills/micro-opt/SKILL.md
```
Expected: no matches. Every profiling command is now under a `$MICRO_OPT_RUN` prefix or wrapped in `$MICRO_OPT_RUN bash -lc`.

- [ ] **Step 6: Stage**

```bash
git add skills/micro-opt/SKILL.md
```
Queue commit message:
```
docs(micro-opt): route every profiling command through $MICRO_OPT_RUN
```
Ask user before running `git commit`.

---

### Task 9: SKILL.md — update PR Description Template

**Files:**
- Modify: `skills/micro-opt/SKILL.md` (`## PR Description Template` section)

- [ ] **Step 1: Edit the table example and prose**

Replace the `Mode` example cell `` `<codspeed simulation>` `` with `` `<codspeed simulation> @ <platform>` `` and add a sentence after the existing table:

```markdown
The `Mode` cell value MUST end with `@ <platform>`, where `<platform>` is one of `linux-native`, `macOS+linux/arm64`, or `macOS+linux/amd64`. A baseline and its candidate must share the same `<platform>`; comparing across platforms requires collecting a fresh baseline on the target platform first.
```

The full updated section reads:

````markdown
## PR Description Template

Use a compact table and update it after every progress commit:

```markdown
## Micro-Optimization Progress

Target benchmark: `<benchmark>`
Measurement mode: `<valgrind tool | codspeed simulation>`
Primary metric: `<accesses + estimated cycles | selected Valgrind metric>`
Baseline command: `<command>`

| Commit  | Benchmark | Mode                                  | Accesses Before | Accesses After | Accesses Delta | Estimated Cycles Before | Estimated Cycles After | Estimated Cycles Delta | Checks    | Notes      |
| ------- | --------- | ------------------------------------- | --------------- | -------------- | -------------- | ----------------------- | ---------------------- | ---------------------- | --------- | ---------- |
| `<sha>` | `<name>`  | `<codspeed simulation> @ <platform>`  | `1,000,000`     | `950,000`      | `-5.0%`        | `1,120,000`             | `1,060,000`            | `-5.4%`                | `<tests>` | `<reason>` |
```

The `Mode` cell value MUST end with `@ <platform>`, where `<platform>` is one of `linux-native`, `macOS+linux/arm64`, or `macOS+linux/amd64`. A baseline and its candidate must share the same `<platform>`; comparing across platforms requires collecting a fresh baseline on the target platform first.

For non-CodSpeed Valgrind runs, replace the cycle columns with the selected tool metric before/after/delta, or add a separate table when mixing measurement modes.
````

- [ ] **Step 2: Verify**

Run:
```bash
grep -n "@ <platform>" /Users/bytedance/git/agent-skills/skills/micro-opt/SKILL.md
```
Expected: at least two matches (table cell + prose). Zero matches means the edit did not land.

- [ ] **Step 3: Stage**

```bash
git add skills/micro-opt/SKILL.md
```
Queue commit message:
```
docs(micro-opt): require platform suffix in PR table Mode column
```
Ask user before running `git commit`.

---

### Task 10: SKILL.md — append `macOS Caveats` and `Cleanup` sections

**Files:**
- Modify: `skills/micro-opt/SKILL.md` (append before `## Stop Conditions`)

- [ ] **Step 1: Insert two new sections just above `## Stop Conditions`**

Insert this exact block in `skills/micro-opt/SKILL.md` immediately before the `## Stop Conditions` heading:

```markdown
## macOS Caveats

- Docker Desktop must be running. The wrapper fails fast with `start Docker Desktop, then re-run` if `docker info` is unreachable.
- The CodSpeed Valgrind fork ships amd64-only today. If `codspeed run -m simulation` reports a missing fork on `linux/arm64`, switch with `export MICRO_OPT_PLATFORM=linux/amd64` and collect a fresh baseline; do not mix platforms in one comparison.
- First-time image build takes 5-10 minutes. Run a smoke command (`$MICRO_OPT_RUN valgrind --version`) before collecting a baseline so the build does not skew the first measurement.
- `target/` is invisible on the host because a named volume covers `/work/target` for IO speed. Perf artifacts under `optimization-artifacts/` remain host-visible; if you need a binary out of `target/`, copy it with `$MICRO_OPT_RUN cp /work/target/<path>/<bin> optimization-artifacts/<run>/`.
- Non-TTY callers (CI, subprocesses) are handled: the wrapper omits `-t` when stdin or stdout is not a TTY.
- If you change the Dockerfile, remove the cached image first with `docker rmi micro-opt:latest`; the next `docker-run.sh` call rebuilds it automatically.

## Cleanup

Remove cached state when disk is reclaimed:

```bash
imgs="$(docker images --format '{{.Repository}}:{{.Tag}}' | grep '^micro-opt:' || true)"
[[ -n "$imgs" ]] && echo "$imgs" | xargs docker rmi
vols="$(docker volume ls --format '{{.Name}}' | grep '^micro-opt-' || true)"
[[ -n "$vols" ]] && echo "$vols" | xargs docker volume rm
```

This also discards the per-project Rust target volume; the next build inside Docker will be a cold compile.
```

- [ ] **Step 2: Verify section order**

Run:
```bash
grep -n "^## " /Users/bytedance/git/agent-skills/skills/micro-opt/SKILL.md
```
Expected order: `Platform Setup`, `Required Workflow`, `Collecting Valgrind Data`, `macOS Notes`, `CodSpeed Projects`, `PR Description Template`, `macOS Caveats`, `Cleanup`, `Stop Conditions`.

- [ ] **Step 3: Stage**

```bash
git add skills/micro-opt/SKILL.md
```
Queue commit message:
```
docs(micro-opt): document macOS caveats and volume cleanup
```
Ask user before running `git commit`.

---

### Task 11: End-to-end parity smoke

**Files:**
- Touched: none (validation only)

**Why this task:** the verification matrix from the spec runs here as a single checklist.

- [ ] **Step 1: Linux passthrough sanity (re-run Task 4 quick form)**

Run:
```bash
MICRO_OPT_RUN="" bash -c 'echo "$MICRO_OPT_RUN valgrind --version" | head -1'
```
Expected: ` valgrind --version` (note the leading space is the empty expansion).

- [ ] **Step 2: macOS arm64 callgrind happy path**

Run from a small Rust project (or the repo root with a trivial `cargo new` scratch project under `/tmp`):
```bash
export MICRO_OPT_RUN=/Users/bytedance/git/agent-skills/skills/micro-opt/assets/docker-run.sh
mkdir -p optimization-artifacts/valgrind/callgrind/smoke
$MICRO_OPT_RUN valgrind --tool=callgrind \
  --callgrind-out-file=optimization-artifacts/valgrind/callgrind/smoke/cg.out.%p \
  /bin/true
ls optimization-artifacts/valgrind/callgrind/smoke/
```
Expected: at least one `cg.out.*` file present on the host.

- [ ] **Step 3: macOS amd64 platform override**

Run:
```bash
MICRO_OPT_PLATFORM=linux/amd64 \
  $MICRO_OPT_RUN bash -lc 'echo "arch=$(uname -m)"'
```
Expected: `arch=x86_64`.

- [ ] **Step 4: Second-call no-rebuild check**

Run:
```bash
time $MICRO_OPT_RUN valgrind --version
time $MICRO_OPT_RUN valgrind --version
```
Expected: second invocation finishes in well under 3 seconds and produces no `docker build` output.

- [ ] **Step 5: cargo cache hit across calls (optional, requires a Rust project)**

In a Rust project directory:
```bash
time $MICRO_OPT_RUN cargo fetch
time $MICRO_OPT_RUN cargo fetch
```
Expected: second call is faster and prints no `Downloaded ...` lines.

- [ ] **Step 6: Record matrix results in the PR draft**

Add the checklist outcome to the PR body (created in Task 12). Each item gets PASS, FAIL, or NOT-RUN with a one-line note.

No commit for this task.

---

### Task 12: Open draft PR

**Files:**
- Touched: none (PR meta only)

- [ ] **Step 1: Confirm all per-task commits have been authorized**

Run:
```bash
cd /Users/bytedance/git/agent-skills
git log --oneline origin/main..HEAD
```
Expected: one commit per Task 1, 2, 3, 6, 7, 8, 9, 10 (eight commits total), each with the queued message.

If any task's commit was not yet authorized, stop and ask the user before opening the PR.

- [ ] **Step 2: Push the branch**

Run:
```bash
git push -u origin perf/micro-opt-macos-docker
```

- [ ] **Step 3: Open the draft PR with the smoke-matrix results**

Run (replace `<results>` blocks with the actual matrix outcome from Task 11):
```bash
gh pr create --draft \
  --title "micro-opt: macOS parity via bundled Docker wrapper" \
  --body "$(cat <<'EOF'
## Why

The `micro-opt` skill was Linux-only. macOS developers had to hand-roll a Docker workflow each session. This change makes the skill work the same way on both platforms: every profiling command in SKILL.md runs through `$MICRO_OPT_RUN`, which is empty on Linux and routes through a bundled Docker wrapper on macOS.

## What

- `skills/micro-opt/assets/Dockerfile.micro-opt` — Ubuntu 24.04 image preinstalling Valgrind, rustup, and `cargo-codspeed`.
- `skills/micro-opt/assets/docker-run.sh` — wrapper that exec-passthroughs on Linux and routes to `docker run --rm` on macOS, with named volumes for `target/`, the cargo registry, and the CodSpeed Valgrind cache.
- `SKILL.md`:
  - frontmatter mentions macOS parity
  - new `Platform Setup` section exports `MICRO_OPT_RUN` per platform
  - every command template prefixed with `$MICRO_OPT_RUN`
  - PR table `Mode` column requires a `@ <platform>` suffix
  - new `macOS Caveats` and `Cleanup` sections
  - old `macOS With Docker` section collapsed into a one-line pointer

## Verification matrix

| Check                                                   | Result    | Note   |
| ------------------------------------------------------- | --------- | ------ |
| Linux passthrough exec                                  | `<r>`     | `<n>`  |
| macOS arm64 callgrind writes host-visible artifact      | `<r>`     | `<n>`  |
| macOS amd64 platform override switches `uname -m`       | `<r>`     | `<n>`  |
| Second `docker-run.sh` call does not rebuild image      | `<r>`     | `<n>`  |
| cargo registry cache reused across calls                | `<r>`     | `<n>`  |
EOF
)"
```

- [ ] **Step 4: Capture the PR URL**

Run:
```bash
gh pr view --json url -q .url
```
Report the URL to the user.

No commit for this task.

---

## Self-Review

**Spec coverage:**

| Spec section                          | Covered by              |
| ------------------------------------- | ----------------------- |
| File Layout                           | Tasks 2, 3              |
| SKILL.md change 1 (frontmatter)       | Task 6 step 1           |
| SKILL.md change 2 (Platform Setup)    | Task 6 step 2           |
| SKILL.md change 3 (old section out)   | Task 7                  |
| SKILL.md change 4 (prefix all snippets) | Task 8                |
| SKILL.md change 5 (PR Mode + platform)| Task 9                  |
| SKILL.md change 6 (macOS Caveats)     | Task 10                 |
| SKILL.md change 7 (Cleanup)           | Task 10                 |
| Dockerfile contents                   | Task 2                  |
| docker-run.sh contract                | Task 3                  |
| Volume layout                         | Task 3 (in script body) |
| Parity contract                       | Task 11                 |
| Smoke test                            | Task 5 + Task 11        |
| Edge cases (caveats)                  | Task 10                 |
| Verification matrix                   | Task 11 + Task 12       |

**Placeholder scan:** No `TBD`, no "implement later", no "similar to". Every code block carries the literal content to write.

**Type consistency:** `MICRO_OPT_RUN`, `MICRO_OPT_IMAGE`, `MICRO_OPT_PLATFORM` are spelled the same in every task and in the spec. Image tag is consistently `micro-opt:latest`. Volume name `micro-opt-target-<hash>` matches between spec and Task 3 body.

**Symlink note:** confirmed in Task 1 that `~/.claude/skills/micro-opt` is a symlink to the repo path, so no separate mirroring task is needed.
