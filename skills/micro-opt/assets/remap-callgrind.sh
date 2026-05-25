#!/usr/bin/env bash
# remap-callgrind.sh — rewrite Docker-side absolute source paths in a callgrind
# output to the macOS host equivalents so KCachegrind/QCachegrind can resolve
# sources. Idempotent; safe to re-run.
#
# Usage:
#   remap-callgrind.sh <callgrind-out-file> [--project=<host-path>] [--auto-rustup]
#
# Handles these prefixes:
#   /work/                                      -> host project root (git toplevel or $PWD)
#   /usr/local/cargo/                           -> $CARGO_HOME or ~/.cargo
#   /rust/deps/<crate>/                         -> $CARGO_HOME/registry/src/index.crates.io-<hash>/<crate>/
#                                                  (codspeed's --remap-path-prefix; <hash> auto-detected)
#   /rust/git/                                  -> $CARGO_HOME/git/  (best-effort layout match)
#   /rustc/<sha>/                               -> ~/.rustup/toolchains/<channel>-<host-target>/lib/rustlib/src/rust/
#   /usr/local/rustup/toolchains/<X>-linux-gnu/ -> ~/.rustup/toolchains/<X>-<host-target>/
#                                                  (std-lib refs that bypassed --remap-path-prefix)
#
# /rustc/ and /usr/local/rustup/ both require:
#   rustup component add rust-src --toolchain <channel>
#
# A one-time backup is written to <file>.remap.bak. `--auto-rustup` will run
# `rustup component add rust-src` for the project toolchain; otherwise the
# command is printed and the /rustc/ rewrite is skipped until rust-src exists.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <callgrind-out-file> [--project=<host-path>] [--auto-rustup]" >&2
  exit 2
fi

out="$1"; shift
project=""
auto_rustup=0
for arg in "$@"; do
  case "$arg" in
    --project=*) project="${arg#*=}" ;;
    --auto-rustup) auto_rustup=1 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

[[ -f "$out" ]] || { echo "file not found: $out" >&2; exit 1; }

if [[ -z "$project" ]]; then
  project="$(git -C "$(dirname "$out")" rev-parse --show-toplevel 2>/dev/null || pwd)"
fi
host_cargo="${CARGO_HOME:-$HOME/.cargo}"

[[ -f "$out.remap.bak" ]] || cp "$out" "$out.remap.bak"

extract_prefixes() {
  grep -E '^(fl|fe|fi)=' "$out" \
    | awk -F= '{print $2}' \
    | grep '^/' \
    | awk -F/ '{print "/"$2"/"$3}' \
    | sort -u
}

echo "[remap] source-path prefixes in $out:"
extract_prefixes | sed 's/^/  /'

sed_in_place() {
  # macOS BSD sed needs '' for -i, GNU sed wants no arg. Detect.
  if sed --version >/dev/null 2>&1; then sed -i "$@"; else sed -i '' "$@"; fi
}

if grep -q '^fl=/work/' "$out"; then
  echo "[remap] /work/ -> $project/"
  sed_in_place "s|/work/|${project}/|g" "$out"
fi

if grep -q '^fl=/usr/local/cargo/' "$out"; then
  echo "[remap] /usr/local/cargo/ -> $host_cargo/"
  sed_in_place "s|/usr/local/cargo/|${host_cargo}/|g" "$out"
fi

# /rust/deps/, /rust/git/ — codspeed's `--remap-path-prefix` normalizes these.
# Resolve the registry hash from the host cargo registry (deterministic for crates.io).
if grep -qE '^fl=/rust/(deps|git)/' "$out"; then
  reg_src="$host_cargo/registry/src"
  reg_hash="$(ls "$reg_src" 2>/dev/null | grep '^index.crates.io-' | head -1)"
  if [[ -n "$reg_hash" ]]; then
    echo "[remap] /rust/deps/ -> $reg_src/$reg_hash/"
    sed_in_place "s|/rust/deps/|${reg_src}/${reg_hash}/|g" "$out"
  else
    echo "[remap] /rust/deps/ present but no crates.io registry on host; run 'cargo fetch' first."
  fi
  if grep -q '^fl=/rust/git/' "$out"; then
    echo "[remap] /rust/git/ -> $host_cargo/git/  (best-effort)"
    sed_in_place "s|/rust/git/|${host_cargo}/git/|g" "$out"
  fi
fi

# Resolve project toolchain (used by both /rustc/ and /usr/local/rustup/ remaps)
toolchain=""
if [[ -f "$project/rust-toolchain.toml" ]]; then
  toolchain="$(grep -E '^\s*channel\s*=' "$project/rust-toolchain.toml" \
                | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
elif [[ -f "$project/rust-toolchain" ]]; then
  toolchain="$(head -1 "$project/rust-toolchain" | tr -d '[:space:]')"
fi
host_target="$(uname -m | sed 's/arm64/aarch64/')-apple-darwin"
rustc_root="$HOME/.rustup/toolchains/${toolchain}-${host_target}/lib/rustlib/src/rust"

ensure_rust_src() {
  [[ -d "$rustc_root" ]] && return 0
  local cmd="rustup component add rust-src --toolchain $toolchain"
  if [[ $auto_rustup -eq 1 ]]; then
    echo "[remap] $cmd"; eval "$cmd"
  else
    echo "[remap] rust-src missing for toolchain '$toolchain'."
    echo "        to enable std-lib remap, run:"
    echo "          $cmd"
    echo "        then re-run this script (or pass --auto-rustup)."
  fi
  [[ -d "$rustc_root" ]]
}

if grep -qE '^fl=/rustc/[0-9a-f]{40}/' "$out"; then
  sha="$(grep -oE '^fl=/rustc/[0-9a-f]{40}' "$out" | head -1 | sed 's|^fl=/rustc/||')"
  if ensure_rust_src; then
    echo "[remap] /rustc/$sha/ -> $rustc_root/"
    sed_in_place "s|/rustc/${sha}/|${rustc_root}/|g" "$out"
  fi
fi

# Container rustup paths that bypass --remap-path-prefix
if grep -qE '^fl=/usr/local/rustup/toolchains/[^/]+-unknown-linux-gnu/' "$out"; then
  container_tc="$(grep -oE '^fl=/usr/local/rustup/toolchains/[^/]+-unknown-linux-gnu' "$out" \
                  | head -1 | sed 's|^fl=/usr/local/rustup/toolchains/||')"
  src_prefix="/usr/local/rustup/toolchains/${container_tc}/"
  if ensure_rust_src; then
    dst_prefix="$HOME/.rustup/toolchains/${toolchain}-${host_target}/"
    echo "[remap] $src_prefix -> $dst_prefix"
    sed_in_place "s|${src_prefix}|${dst_prefix}|g" "$out"
  fi
fi

echo "[remap] verifying sample of rewritten file paths..."
checked=0; missing=0; first_missing=""
while IFS= read -r p; do
  checked=$((checked+1))
  if [[ ! -e "$p" ]]; then
    missing=$((missing+1))
    [[ -z "$first_missing" ]] && first_missing="$p"
  fi
done < <(grep -E '^fl=' "$out" | awk -F= '{print $2}' | grep '^/' | sort -u | head -30)
echo "[remap] sample: $((checked-missing))/$checked exist on host"
if [[ $missing -gt 0 ]]; then
  echo "        first missing: $first_missing"
  echo "        for cargo deps: \`cargo fetch\` from the project root usually populates them."
fi
echo "[remap] done. backup at: $out.remap.bak"
