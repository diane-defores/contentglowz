# ContentGlowz

Canonical monorepo for the full ContentGlowz platform.

## Repository Layout

- `contentglowz_site` - Astro marketing site
- `contentglowz_app` - Flutter application, including the web build deployed on Vercel
- `contentglowz_lab` - FastAPI backend and internal tooling

## Setup

Start with [SETUP.md](SETUP.md) after cloning the repository. It lists the required local tools, Flox commands, app/site/backend checks, and Turso CLI authentication flow.

## Deployment Model

- GitHub source of truth: `diane-defores/contentglowz`
- Vercel project `ContentGlowz` uses `contentglowz_site` as its Root Directory
- Vercel project `ContentGlowz-App` uses `contentglowz_app` as its Root Directory
- `contentglowz_lab` is maintained in this monorepo but deployed outside Vercel

## Working Rule

All ContentGlowz surfaces now live in this single repository. Do not use the archived legacy repositories as active sources of truth.
