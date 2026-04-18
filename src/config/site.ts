function normalizeUrl(value: string | undefined, fallback: string) {
  return (value ?? fallback).replace(/\/$/, '');
}

function normalizeBuildValue(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

export const siteUrl = normalizeUrl(
  import.meta.env.APP_SITE_URL,
  'https://contentflow.winflowz.com',
);

export const appWebUrl = normalizeUrl(
  import.meta.env.APP_WEB_URL,
  'https://app.contentflow.winflowz.com',
);

export const appSignInUrl = `${appWebUrl}/sign-in`;

export const appEntryUrl = `${appWebUrl}/#/entry`;

export const apiBaseUrl = normalizeUrl(
  import.meta.env.API_BASE_URL,
  'https://api.winflowz.com',
);

export const buildCommitSha = normalizeBuildValue(
  import.meta.env.VERCEL_GIT_COMMIT_SHA,
  'unknown',
);

export const buildEnvironment = normalizeBuildValue(
  import.meta.env.VERCEL_ENV,
  import.meta.env.PROD ? 'production' : 'development',
);

export const buildTimestamp = normalizeBuildValue(
  import.meta.env.BUILD_TIMESTAMP,
  new Date().toISOString(),
);
