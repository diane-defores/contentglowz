"""Non-destructive cleanup reporting for project assets."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Iterable, Optional


def build_project_asset_cleanup_report(
    assets: Iterable[Any],
    *,
    now: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Classify assets that need retention cleanup or operator repair."""

    current = now or datetime.utcnow()
    cleanup_eligible = []
    degraded = []
    missing_storage = []

    for asset in assets:
        item = {
            "asset_id": asset.id,
            "media_kind": asset.media_kind,
            "status": asset.status,
            "cleanup_eligible_at": asset.cleanup_eligible_at,
            "reason": None,
        }
        if asset.status == "tombstoned" and asset.cleanup_eligible_at:
            if asset.cleanup_eligible_at <= current:
                item["reason"] = "tombstone_retention_elapsed"
                cleanup_eligible.append(item)
        if asset.status == "degraded":
            item["reason"] = "degraded_storage_state"
            degraded.append(item)
        if asset.status == "active" and not asset.storage_uri:
            item["reason"] = "active_asset_missing_storage_uri"
            missing_storage.append(item)

    return {
        "cleanup_eligible": cleanup_eligible,
        "degraded": degraded,
        "missing_storage": missing_storage,
        "physical_delete_allowed": False,
    }
