"""HTTP client for the internal Remotion render worker."""

from __future__ import annotations

import os
from typing import Any

import httpx


class RemotionRenderClientError(RuntimeError):
    """Base error for worker client failures."""


class RemotionRenderUnavailableError(RemotionRenderClientError):
    """Raised when worker cannot be reached."""


class RemotionRenderResponseError(RemotionRenderClientError):
    """Raised when worker returns invalid or failed responses."""

    def __init__(self, message: str, *, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


def _sanitize_error_text(message: str) -> str:
    return message.strip()[:500] or "Worker request failed"


class RemotionRenderClient:
    """Client wrapper for create/status/cancel worker operations."""

    def __init__(
        self,
        *,
        base_url: str | None = None,
        worker_token: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.base_url = (base_url or os.getenv("REMOTION_WORKER_URL", "")).strip().rstrip("/")
        self.worker_token = (worker_token or os.getenv("REMOTION_WORKER_TOKEN", "")).strip()
        self.timeout_seconds = timeout_seconds or float(
            os.getenv("REMOTION_WORKER_TIMEOUT_SECONDS", "65")
        )
        if not self.base_url:
            raise RemotionRenderUnavailableError("REMOTION_WORKER_URL is required")
        if not self.worker_token:
            raise RemotionRenderUnavailableError("REMOTION_WORKER_TOKEN is required")

    async def create_render(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request_json("POST", "/renders", json=payload)

    async def get_render(self, worker_job_id: str) -> dict[str, Any]:
        return await self._request_json("GET", f"/renders/{worker_job_id}")

    async def cancel_render(self, worker_job_id: str) -> dict[str, Any]:
        return await self._request_json("DELETE", f"/renders/{worker_job_id}")

    async def _request_json(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.worker_token}",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.request(
                    method=method,
                    url=f"{self.base_url}{path}",
                    headers=headers,
                    json=json,
                )
        except httpx.RequestError as exc:
            raise RemotionRenderUnavailableError("Render worker is unavailable") from exc

        if response.status_code >= 500:
            raise RemotionRenderUnavailableError("Render worker is unavailable")
        if response.status_code >= 400:
            detail = _sanitize_error_text(response.text)
            raise RemotionRenderResponseError(
                f"Render worker rejected request: {detail}",
                status_code=response.status_code,
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise RemotionRenderResponseError("Render worker returned invalid JSON") from exc

        if not isinstance(payload, dict):
            raise RemotionRenderResponseError("Render worker returned invalid payload")

        return payload


_render_client: RemotionRenderClient | None = None


def get_remotion_render_client() -> RemotionRenderClient:
    global _render_client
    if _render_client is None:
        _render_client = RemotionRenderClient()
    return _render_client
