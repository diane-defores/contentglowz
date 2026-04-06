"""
Rebuild Trigger — Trigger SSG rebuilds after drip publications.

Supports:
- Webhook (Vercel, Netlify, Cloudflare deploy hooks)
- GitHub Actions (workflow_dispatch)
- Manual (no-op, logs a message)
"""

import os
from typing import Any, Dict, Optional

import httpx


async def trigger_webhook(url: str) -> Dict[str, Any]:
    """POST to a deploy hook URL (Vercel, Netlify, Cloudflare Pages)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url)
        return {
            "method": "webhook",
            "status_code": resp.status_code,
            "success": resp.status_code < 400,
            "response": resp.text[:200],
        }


async def trigger_github_actions(
    repo: str,
    branch: str = "main",
    workflow: str = "daily-drip.yml",
    token: Optional[str] = None,
) -> Dict[str, Any]:
    """Trigger a GitHub Actions workflow via workflow_dispatch."""
    gh_token = token or os.getenv("GITHUB_TOKEN")
    if not gh_token:
        return {
            "method": "github_actions",
            "success": False,
            "error": "GITHUB_TOKEN not configured",
        }

    url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow}/dispatches"
    headers = {
        "Authorization": f"Bearer {gh_token}",
        "Accept": "application/vnd.github.v3+json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=headers, json={"ref": branch})
        return {
            "method": "github_actions",
            "status_code": resp.status_code,
            "success": resp.status_code == 204,
            "repo": repo,
            "workflow": workflow,
            "branch": branch,
        }


async def trigger_rebuild(ssg_config: Dict[str, Any]) -> Dict[str, Any]:
    """Dispatch to the correct rebuild method based on SSG config."""
    method = ssg_config.get("rebuild_method", "manual")

    if method == "webhook":
        url = ssg_config.get("rebuild_webhook_url")
        if not url:
            return {"method": "webhook", "success": False, "error": "No webhook URL configured"}
        return await trigger_webhook(url)

    elif method == "github_actions":
        repo = ssg_config.get("rebuild_github_repo")
        if not repo:
            return {"method": "github_actions", "success": False, "error": "No repo configured"}
        return await trigger_github_actions(
            repo=repo,
            branch=ssg_config.get("rebuild_github_branch", "main"),
        )

    elif method == "manual":
        return {"method": "manual", "success": True, "message": "Manual rebuild required"}

    elif method == "local_script":
        return {"method": "local_script", "success": False, "error": "Local script not supported in API context"}

    return {"method": method, "success": False, "error": f"Unknown rebuild method: {method}"}
