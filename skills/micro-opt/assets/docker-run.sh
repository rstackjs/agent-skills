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
