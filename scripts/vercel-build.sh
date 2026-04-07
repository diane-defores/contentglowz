#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CACHE_DIR="${VERCEL_CACHE_DIR:-$ROOT_DIR/.vercel/cache}"
FLUTTER_ROOT="${FLUTTER_ROOT:-$CACHE_DIR/flutter}"

export PATH="$FLUTTER_ROOT/bin:$PATH"

API_BASE_URL_VALUE="${API_BASE_URL:-}"
CLERK_PUBLISHABLE_KEY_VALUE="${CLERK_PUBLISHABLE_KEY:-}"

if [[ -z "$API_BASE_URL_VALUE" ]]; then
  echo "ERROR: API_BASE_URL is required for the Vercel build." >&2
  exit 1
fi

if [[ -z "$CLERK_PUBLISHABLE_KEY_VALUE" ]]; then
  echo "ERROR: CLERK_PUBLISHABLE_KEY is required for the Vercel build." >&2
  exit 1
fi

cd "$ROOT_DIR"

flutter --version
flutter pub get
flutter build web --release \
  --dart-define=API_BASE_URL="$API_BASE_URL_VALUE" \
  --dart-define=CLERK_PUBLISHABLE_KEY="$CLERK_PUBLISHABLE_KEY_VALUE"
