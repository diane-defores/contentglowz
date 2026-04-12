#!/bin/bash
# Build & serve ContentFlow Flutter app
# Usage: ./build.sh [--serve]

set -e

export PATH="/home/claude/.flutter-sdk/bin:$PATH"
cd "$(dirname "$0")"

API_BASE_URL_VALUE="${API_BASE_URL:-https://api.winflowz.com}"
CLERK_PUBLISHABLE_KEY_VALUE="${CLERK_PUBLISHABLE_KEY:-}"
PORT_VALUE="${PORT:-3050}"

if [[ -z "${CLERK_PUBLISHABLE_KEY_VALUE}" ]]; then
    echo "ERROR: CLERK_PUBLISHABLE_KEY is required to build the Flutter web app." >&2
    echo "Run through Doppler or export CLERK_PUBLISHABLE_KEY before building." >&2
    exit 1
fi

echo "🔨 Building Flutter web..."
flutter build web --release \
  --dart-define=API_BASE_URL="${API_BASE_URL_VALUE}" \
  --dart-define=CLERK_PUBLISHABLE_KEY="${CLERK_PUBLISHABLE_KEY_VALUE}" \
  2>&1 | tail -3

echo ""
echo "✅ Build complete: build/web/"

if [[ "$1" == "--serve" ]]; then
    echo ""
    echo "🚀 Starting server on port ${PORT_VALUE}..."
    # Kill existing if running
    pkill -f "node.*server.js.*${PORT_VALUE}" 2>/dev/null || true
    sleep 0.5
    node server.js "${PORT_VALUE}"
fi
