#!/bin/bash
set -euo pipefail

export PATH="/home/claude/.flutter-sdk/bin:$PATH"
cd "$(cd "$(dirname "$0")" && pwd)"

API_BASE_URL_VALUE="${API_BASE_URL:-https://api.winflowz.com}"
CLERK_PUBLISHABLE_KEY_VALUE="${CLERK_PUBLISHABLE_KEY:-}"
PORT_VALUE="${PORT:-3050}"

if [[ -z "${CLERK_PUBLISHABLE_KEY_VALUE}" ]]; then
  echo "ERROR: CLERK_PUBLISHABLE_KEY is required to build the Flutter web app." >&2
  echo "Run through Doppler or export CLERK_PUBLISHABLE_KEY before starting PM2." >&2
  exit 1
fi

flutter pub get
flutter build web --release \
  --dart-define=API_BASE_URL="${API_BASE_URL_VALUE}" \
  --dart-define=CLERK_PUBLISHABLE_KEY="${CLERK_PUBLISHABLE_KEY_VALUE}"

exec node server.js "${PORT_VALUE}"
