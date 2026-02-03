# Tools Integration Tasks

This folder contains implementation tasks for integrating external tools into the my-robots system. Each task file includes checkboxes, code examples, and process flows.

## Task Index

| Task | Robot(s) | Tools | Priority |
|------|----------|-------|----------|
| [mcpc Universal MCP](TASK-mcpc-universal-mcp.md) | All robots | mcpc + Apify/Composio | Medium |

## Tools Reference

| Tool | Purpose | API Docs |
|------|---------|----------|
| **mcpc** | Universal MCP CLI client (config hub) | [github.com/apify/mcpc](https://github.com/apify/mcpc) |
| **Apify** | 6000+ web scraping actors via MCP | [apify.com](https://apify.com) |
| **Composio** | 250+ app integrations via MCP | [composio.dev](https://composio.dev) |
| **Firecrawl** | Web crawling, content extraction | [docs.firecrawl.dev](https://docs.firecrawl.dev) |
| **Crawlee** | Open-source crawling framework | [crawlee.dev/python](https://crawlee.dev/python) |
| **Hexowatch** | Website monitoring, change detection | [hexowatch.com/api-documentation](https://hexowatch.com/api-documentation/) |
| **Paced Email** | Transactional email sending | [docs.paced.email](https://docs.paced.email/collection/38-api) |

## Quick Setup

```bash
# mcpc (universal MCP client)
npm install -g @apify/mcpc
mcpc mcp.apify.com login
mcpc mcp.composio.dev login

# Python dependencies (for direct API use)
pip install firecrawl-py crawlee[playwright] requests
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  CrewAI Agents                  │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│               mcpc (MCP Client)                 │
│         Centralized config & auth               │
└─────────────────────────────────────────────────┘
          │              │              │
          ▼              ▼              ▼
    ┌─────────┐    ┌──────────┐   ┌─────────┐
    │ @apify  │    │@composio │   │  @exa   │
    │ Scraping│    │App Integs│   │ Search  │
    └─────────┘    └──────────┘   └─────────┘
```

## Task File Structure

Each `TASK-*.md` file follows this format:

```
# TASK: Task Name
> Robot / Tools / Priority metadata

## Objective
Brief description of what this implements

## Implementation Checklist
- [ ] Phase 1: Setup
- [ ] Phase 2: Core implementation
- [ ] Phase N: Integration

## Process Flow
Visual diagram of the workflow

## Success Metrics
Measurable targets

## Dependencies
Required packages and modules

## Notes
Tips and considerations
```
