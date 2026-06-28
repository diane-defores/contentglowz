from datetime import datetime, timedelta
from types import SimpleNamespace

from api.services.project_asset_cleanup import build_project_asset_cleanup_report


def test_cleanup_report_is_non_destructive_and_classifies_assets():
    now = datetime.utcnow()
    report = build_project_asset_cleanup_report(
        [
            SimpleNamespace(
                id="asset-old",
                media_kind="image",
                status="tombstoned",
                cleanup_eligible_at=now - timedelta(seconds=1),
                storage_uri="bunny://zone/path.png",
            ),
            SimpleNamespace(
                id="asset-degraded",
                media_kind="audio",
                status="degraded",
                cleanup_eligible_at=None,
                storage_uri="bunny://zone/audio.mp3",
            ),
            SimpleNamespace(
                id="asset-missing",
                media_kind="image",
                status="active",
                cleanup_eligible_at=None,
                storage_uri=None,
            ),
        ],
        now=now,
    )

    assert report["physical_delete_allowed"] is False
    assert report["cleanup_eligible"][0]["asset_id"] == "asset-old"
    assert report["degraded"][0]["asset_id"] == "asset-degraded"
    assert report["missing_storage"][0]["asset_id"] == "asset-missing"
