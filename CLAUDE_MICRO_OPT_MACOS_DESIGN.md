# micro-opt: macOS Docker Parity Design

Date: 2026-05-20
Scope: `skills/micro-opt/`

## Goal

Make `micro-opt` work on macOS with the same surface and the same workflow as Linux, by transparently routing every Valgrind / CodSpeed command through a bundled Docker wrapper. Under the parity constraint, iteration speed on macOS must be as close to Linux native as the toolchain allows.

## Non-Goals

- Cross-platform metric comparability. macOS Docker runs are not numerically comparable to Linux native or to CodSpeed CI; the skill enforces that baselines and candidates share `platform`, but does not pretend cross-platform deltas are valid.
- Supporting Docker engines other than Docker Desktop on macOS in the initial rollout.
- Publishing a prebuilt image to a registry. The skill builds locally on first use.

## Design Decisions

| Decision                    | Choice                                                                     |
| --------------------------- | -------------------------------------------------------------------------- |
| Target scenarios            | Rust + CodSpeed and generic Valgrind; Rust + CodSpeed wins on conflicts    |
| Container lifecycle         | One-shot `docker run --rm` per command                                     |
| Image strategy              | Skill ships `Dockerfile.micro-opt`; wrapper builds `micro-opt:linux-<arch>` per platform on first use |
| Default platform            | Host-arch matched: Apple Silicon → `linux/arm64`, Intel Mac → `linux/amd64`. Warn that CI numbers do not compare. |
| Cache reuse                 | Docker named volumes for `target/`, cargo registry/git, and `~/.cache`     |
| Linux behavior              | Wrapper degenerates to `exec "$@"`; SKILL.md snippets are unchanged        |

## File Layout

```
skills/micro-opt/
├── SKILL.md
└── assets/
    ├── Dockerfile.micro-opt
    └── docker-run.sh
```

## SKILL.md Changes

1. Frontmatter `description` ends with: "Works on Linux natively and on macOS through a bundled Docker wrapper with identical commands."
2. New first section `Platform Setup`, placed before `Required Workflow`:
   - Detect platform via `uname -s`.
   - On macOS, probe `docker info >/dev/null 2>&1` and fail fast with "start Docker Desktop, then re-run" if Docker is not reachable.
   - Ensure image: `docker-run.sh` itself handles image existence and rebuild via a content-hash label; the agent does not invoke `docker build` directly.
   - Export `MICRO_OPT_RUN`: on macOS, the absolute path to `assets/docker-run.sh`; on Linux, the empty string.
   - Smoke test commands (see Smoke Test section below).
   - Decision branch for CodSpeed Valgrind fork availability on `linux/arm64`: switch `MICRO_OPT_PLATFORM=linux/amd64` and rerun if `codspeed run -m simulation` reports the fork is missing; invalidate any prior baseline taken on the other platform.
3. The existing `macOS With Docker` section is removed. Its location gets one line: "See `Platform Setup` for the canonical macOS workflow."
4. Every shell snippet in `Required Workflow`, `Collecting Valgrind Data`, and `CodSpeed Projects` is prefixed with `$MICRO_OPT_RUN`. For multi-command scripts, wrap the whole block once in `$MICRO_OPT_RUN bash -lc '...'`, not per-line, so shell variables and artifact paths are computed in one environment.
5. `PR Description Template`: keep the `Mode` column header, change cell values to include the platform suffix (for example `callgrind @ macOS+linux/arm64` or `codspeed simulation @ linux/amd64`). The body adds: baseline and candidate must share platform; mixing platforms requires a fresh baseline.
6. New section `macOS Caveats` covers the edge cases (Docker not running, CodSpeed fork on arm64, build time, target/ invisibility, cleanup, non-TTY contexts).
7. New section `Cleanup` documents `docker volume ls | grep micro-opt-` and `docker volume rm` for disk reclamation.

## `assets/Dockerfile.micro-opt`

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

Layer order, lowest churn first: apt packages, rustup, `cargo install cargo-codspeed`. Image is ~1.5-2 GB; size is traded for iteration speed.

Image tag follows the platform: `micro-opt:linux-arm64`, `micro-opt:linux-amd64`. Each image carries a `micro-opt.hash=<12-char>` label derived from the Dockerfile contents; `docker-run.sh` rebuilds automatically when the hashes diverge. Per-arch tagging prevents `MICRO_OPT_PLATFORM=linux/amd64` from reusing a cached arm64 image. SKILL.md's Cleanup section deletes every `micro-opt:*` image.

## `assets/docker-run.sh`

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

Contract: `docker-run.sh <cmd> [args...]`. Linux is `exec "$@"` (zero overhead). macOS routes to Docker. Two env overrides: `MICRO_OPT_IMAGE`, `MICRO_OPT_PLATFORM`. The wrapper labels the built image with a 12-char hash of the Dockerfile; on Dockerfile change the image rebuilds automatically — no manual `docker rmi` needed.

## Volume Layout

| Mount                                                          | Type         | Reuse scope     | Why                                                                         |
| -------------------------------------------------------------- | ------------ | --------------- | --------------------------------------------------------------------------- |
| `$PWD:/work`                                                   | bind         | n/a             | Source and `optimization-artifacts/` are immediately host-visible           |
| `micro-opt-target-<hash>:/work/target`                         | named volume | Per repository  | Bypasses VirtioFS for Rust target; incremental builds drop to ~10s          |
| `micro-opt-cargo-registry`, `micro-opt-cargo-git`              | named volume | Global          | Caches the registry and git index, leaving `/usr/local/cargo/bin` intact    |
| `micro-opt-cache:/root/.cache`                                 | named volume | Global          | Persists the CodSpeed Valgrind fork download across runs                    |

## Parity Contract

| Dimension             | Linux                                                  | macOS Docker                                                  |
| --------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| Snippet shape         | `valgrind ...`, `cargo codspeed ...`                   | `$MICRO_OPT_RUN <same>` (prefix expands to empty on Linux)     |
| Artifact path         | `optimization-artifacts/...`                           | Same; reached via bind mount                                   |
| Valgrind tool surface | callgrind / cachegrind / massif / dhat / memcheck      | Same; apt-installed full Valgrind in image                     |
| CodSpeed formula      | Unchanged                                              | Unchanged                                                      |
| PR table schema       | Existing columns                                       | `Mode` cell values gain a `@ <platform>` suffix; same-platform rule enforced |

## Smoke Test

After Platform Setup, the agent runs:

```bash
$MICRO_OPT_RUN valgrind --version
$MICRO_OPT_RUN cargo codspeed --version
$MICRO_OPT_RUN bash -lc 'echo PLATFORM=$(uname -m) OS=$(uname -s)'
```

Expected on macOS: a valgrind 3.2x version, `cargo-codspeed 2.x`, `PLATFORM=aarch64 OS=Linux` (or `x86_64` if `MICRO_OPT_PLATFORM=linux/amd64`).

## Edge Cases and Mitigations

1. Docker Desktop not running: `docker info` probe fails with a clear instruction.
2. CodSpeed Valgrind fork absent on `linux/arm64`: agent switches `MICRO_OPT_PLATFORM=linux/amd64`, invalidates prior baseline, re-runs.
3. First-time image build takes 5-10 minutes: Platform Setup warns before kicking off; baseline is taken after the image is warm.
4. `target/` is invisible on host because the named volume covers it. The perf workflow does not depend on host-visible `target/`; for ad hoc binaries, copy out with `$MICRO_OPT_RUN cp /work/target/.../X optimization-artifacts/<run>/`.
5. Volume disk usage: `Cleanup` section documents listing and removal.
6. Non-interactive callers: wrapper omits `-t` when stdin or stdout is not a TTY.
7. Volume covering `/usr/local/cargo` would erase the preinstalled `cargo-codspeed`; mitigated by mounting only `registry/` and `git/` subpaths.

## Verification Matrix

The implementation PR must show each item below as confirmed:

- [ ] Linux path unchanged: with `MICRO_OPT_RUN=""`, every command template in SKILL.md is byte-equivalent to the pre-change behavior.
- [ ] macOS: `$MICRO_OPT_RUN valgrind --tool=callgrind <bench>` writes `*.out.*` files visible on the host under `optimization-artifacts/`.
- [ ] macOS: `cargo codspeed run -m simulation` produces a profile on at least one of `linux/arm64` or `linux/amd64`; the platform fallback decision in SKILL.md is exercised at least once and works.
- [ ] Second `docker-run.sh` call after the first does not rebuild the image.
- [ ] cargo registry hits cache on the second Rust build of an unrelated project.

## Stop Conditions

- CodSpeed Valgrind fork unavailable on both `linux/arm64` and `linux/amd64` in the chosen image: stop and report; do not silently fall back to non-CodSpeed Valgrind without updating the PR table mode.
- Docker Desktop not installable in the user's environment: stop; macOS support is gated on Docker.
