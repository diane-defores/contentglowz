#!/bin/bash
set -euo pipefail

export PATH="/home/claude/.flutter-sdk/bin:$PATH"
cd "$(cd "$(dirname "$0")" && pwd)"

API_BASE_URL_VALUE="${API_BASE_URL:-https://api.winflowz.com}"
CLERK_PUBLISHABLE_KEY_VALUE="${CLERK_PUBLISHABLE_KEY:-}"
APP_SITE_URL_VALUE="${APP_SITE_URL:-https://contentflow.winflowz.com}"
APP_WEB_URL_VALUE="${APP_WEB_URL:-https://app.contentflow.winflowz.com}"
BUILD_COMMIT_SHA_VALUE="${BUILD_COMMIT_SHA:-${VERCEL_GIT_COMMIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}}"
BUILD_ENVIRONMENT_VALUE="${BUILD_ENVIRONMENT:-${VERCEL_ENV:-local}}"
BUILD_TIMESTAMP_VALUE="${BUILD_TIMESTAMP:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
SENTRY_DSN_VALUE="${SENTRY_DSN:-}"
SENTRY_ENVIRONMENT_VALUE="${SENTRY_ENVIRONMENT:-${BUILD_ENVIRONMENT_VALUE}}"
SENTRY_RELEASE_VALUE="${SENTRY_RELEASE:-}"
SENTRY_TRACES_SAMPLE_RATE_VALUE="${SENTRY_TRACES_SAMPLE_RATE:-0.0}"
SENTRY_SEND_DEFAULT_PII_VALUE="${SENTRY_SEND_DEFAULT_PII:-false}"
SENTRY_DEBUG_VALUE="${SENTRY_DEBUG:-false}"
PORT_VALUE="${PORT:-3050}"

if [[ -z "${CLERK_PUBLISHABLE_KEY_VALUE}" ]]; then
  echo "ERROR: CLERK_PUBLISHABLE_KEY is required to build the Flutter web app." >&2
  echo "Run through Doppler or export CLERK_PUBLISHABLE_KEY before starting PM2." >&2
  exit 1
fi

flutter pub get
flutter build web --release \
  --dart-define=API_BASE_URL="${API_BASE_URL_VALUE}" \
  --dart-define=CLERK_PUBLISHABLE_KEY="${CLERK_PUBLISHABLE_KEY_VALUE}" \
  --dart-define=APP_SITE_URL="${APP_SITE_URL_VALUE}" \
  --dart-define=APP_WEB_URL="${APP_WEB_URL_VALUE}" \
  --dart-define=BUILD_COMMIT_SHA="${BUILD_COMMIT_SHA_VALUE}" \
  --dart-define=BUILD_ENVIRONMENT="${BUILD_ENVIRONMENT_VALUE}" \
  --dart-define=BUILD_TIMESTAMP="${BUILD_TIMESTAMP_VALUE}" \
  --dart-define=SENTRY_DSN="${SENTRY_DSN_VALUE}" \
  --dart-define=SENTRY_ENVIRONMENT="${SENTRY_ENVIRONMENT_VALUE}" \
  --dart-define=SENTRY_RELEASE="${SENTRY_RELEASE_VALUE}" \
  --dart-define=SENTRY_TRACES_SAMPLE_RATE="${SENTRY_TRACES_SAMPLE_RATE_VALUE}" \
  --dart-define=SENTRY_SEND_DEFAULT_PII="${SENTRY_SEND_DEFAULT_PII_VALUE}" \
  --dart-define=SENTRY_DEBUG="${SENTRY_DEBUG_VALUE}"

bash ./scripts/install-web-auth.sh ./build/web

exec node server.js "${PORT_VALUE}"
