#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CACHE_DIR="${VERCEL_CACHE_DIR:-$ROOT_DIR/.vercel/cache}"
FLUTTER_ROOT="${FLUTTER_ROOT:-$CACHE_DIR/flutter}"
FLUTTER_VERSION_FILE="${FLUTTER_VERSION_FILE:-$ROOT_DIR/.flutter-version}"
FLUTTER_RELEASES_JSON_URL="${FLUTTER_RELEASES_JSON_URL:-https://storage.googleapis.com/flutter_infra_release/releases/releases_linux.json}"
FLUTTER_RELEASES_BASE_URL="${FLUTTER_RELEASES_BASE_URL:-https://storage.googleapis.com/flutter_infra_release/releases}"
FLUTTER_TARGET_ARCH="${FLUTTER_TARGET_ARCH:-x64}"
HOST_ARCH="$(uname -m)"

mkdir -p "$CACHE_DIR"

mark_flutter_safe_directory() {
  if [[ -d "$FLUTTER_ROOT/.git" ]]; then
    git config --global --add safe.directory "$FLUTTER_ROOT"
  fi
}

if [[ ! -f "$FLUTTER_VERSION_FILE" ]]; then
  echo "ERROR: Flutter version file not found: $FLUTTER_VERSION_FILE" >&2
  exit 1
fi

FLUTTER_VERSION="$(tr -d '[:space:]' < "$FLUTTER_VERSION_FILE")"

if [[ -z "$FLUTTER_VERSION" ]]; then
  echo "ERROR: Flutter version file is empty: $FLUTTER_VERSION_FILE" >&2
  exit 1
fi

installed_version=""
if [[ -x "$FLUTTER_ROOT/bin/flutter" ]]; then
  installed_version="$("$FLUTTER_ROOT/bin/flutter" --version --machine 2>/dev/null | tr -d '\n' | sed -n 's/.*"frameworkVersion": *"\([^"]*\)".*/\1/p' || true)"
fi

if [[ "$installed_version" != "$FLUTTER_VERSION" ]]; then
  rm -rf "$FLUTTER_ROOT"

  releases_json="$(curl -fsSL "$FLUTTER_RELEASES_JSON_URL")"
  archive_path="$(awk -v version="$FLUTTER_VERSION" -v target_arch="$FLUTTER_TARGET_ARCH" '
    $0 ~ "\"version\": \"" version "\"" { found=1; next }
    found && /"dart_sdk_arch":/ {
      if ($0 !~ "\"dart_sdk_arch\": \"" target_arch "\"") {
        found=0
      }
      next
    }
    found && /"archive":/ {
      if (match($0, /"archive": "([^"]+)"/, m)) {
        print m[1]
        exit
      }
    }
    found && /"version":/ { found=0 }
  ' <<<"$releases_json")"
  archive_sha256="$(awk -v version="$FLUTTER_VERSION" -v target_arch="$FLUTTER_TARGET_ARCH" '
    $0 ~ "\"version\": \"" version "\"" { found=1; next }
    found && /"dart_sdk_arch":/ {
      if ($0 !~ "\"dart_sdk_arch\": \"" target_arch "\"") {
        found=0
      }
      next
    }
    found && /"sha256":/ {
      if (match($0, /"sha256": "([^"]+)"/, m)) {
        print m[1]
        exit
      }
    }
    found && /"version":/ { found=0 }
  ' <<<"$releases_json")"

  if [[ -z "$archive_path" || -z "$archive_sha256" ]]; then
    echo "ERROR: Could not resolve Flutter $FLUTTER_VERSION in $FLUTTER_RELEASES_JSON_URL" >&2
    exit 1
  fi

  archive_file="$CACHE_DIR/${archive_path##*/}"
  curl -fsSL "$FLUTTER_RELEASES_BASE_URL/$archive_path" -o "$archive_file"
  printf '%s  %s\n' "$archive_sha256" "$archive_file" | sha256sum -c -

  tar -xJf "$archive_file" -C "$CACHE_DIR"
fi

mark_flutter_safe_directory

if [[ "$FLUTTER_TARGET_ARCH" == "x64" && "$HOST_ARCH" != "x86_64" && "$HOST_ARCH" != "amd64" ]]; then
  echo "NOTE: Downloaded pinned Flutter $FLUTTER_VERSION for linux/$FLUTTER_TARGET_ARCH, but host arch is $HOST_ARCH." >&2
  echo "NOTE: This install path is reproducible for Vercel x64 builders; local execution on this host is not possible from the official archive." >&2
  exit 0
fi

export PATH="$FLUTTER_ROOT/bin:$PATH"

flutter --version
flutter config --enable-web
flutter precache --web
