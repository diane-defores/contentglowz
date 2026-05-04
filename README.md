# ContentFlow

Canonical monorepo for the full ContentFlow platform.

## Repository Layout

- `contentflow_site` - Astro marketing site
- `contentflow_app` - Flutter application, including the web build deployed on Vercel
- `contentflow_lab` - FastAPI backend and internal tooling

## Setup

Start with [SETUP.md](SETUP.md) after cloning the repository. It lists the required local tools, Flox commands, app/site/backend checks, and Turso CLI authentication flow.

## Deployment Model

- GitHub source of truth: `dianedef/contentflow`
- Vercel project `Contentflow` uses `contentflow_site` as its Root Directory
- Vercel project `Contentflow-App` uses `contentflow_app` as its Root Directory
- `contentflow_lab` is maintained in this monorepo but deployed outside Vercel

## Working Rule

All ContentFlow surfaces now live in this single repository. Do not use the archived legacy repositories as active sources of truth.
