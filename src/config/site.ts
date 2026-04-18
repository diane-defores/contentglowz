function normalizeUrl(value: string | undefined, fallback: string) {
  return (value ?? fallback).replace(/\/$/, '');
}

export const siteUrl = normalizeUrl(
  import.meta.env.APP_SITE_URL,
  'https://contentflow.winflowz.com',
);

export const appWebUrl = normalizeUrl(
  import.meta.env.APP_WEB_URL,
  'https://app.contentflow.winflowz.com',
);

export const apiBaseUrl = normalizeUrl(
  import.meta.env.API_BASE_URL,
  'https://api.winflowz.com',
);
