"""
Sync Service - Bidirectional sync between local SQLite and Turso.

Push: After each transition, queue for sync. Background task pushes every 30s.
Pull: Check Turso for review actions (approve/reject) and apply locally.
Conflict resolution: last-write-wins by domain (robots=source for generation, user=source for review).
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from status.service import get_status_service, StatusService

logger = logging.getLogger(__name__)

SYNC_INTERVAL = int(os.environ.get("STATUS_SYNC_INTERVAL", "30"))


class SyncService:
    """
    Bidirectional sync between local SQLite status DB and Turso.
    Uses libsql-client (already in requirements.txt).
    """

    def __init__(self, turso_url: Optional[str] = None, turso_token: Optional[str] = None):
        self._turso_url = turso_url or os.environ.get("TURSO_DATABASE_URL", "")
        self._turso_token = turso_token or os.environ.get("TURSO_AUTH_TOKEN", "")
        self._client = None
        self._running = False
        self._status_svc: Optional[StatusService] = None

    @property
    def configured(self) -> bool:
        """Check if Turso credentials are configured."""
        return bool(self._turso_url and self._turso_token)

    async def _get_client(self):
        """Lazy-init the libsql client."""
        if self._client is None:
            if not self.configured:
                logger.warning("Turso not configured, sync disabled")
                return None
            try:
                import libsql_client
                self._client = libsql_client.create_client(
                    url=self._turso_url,
                    auth_token=self._turso_token,
                )
            except ImportError:
                logger.warning("libsql-client not installed, sync disabled")
                return None
            except Exception as e:
                logger.error(f"Failed to create Turso client: {e}")
                return None
        return self._client

    def _get_status_service(self) -> StatusService:
        """Get the local status service."""
        if self._status_svc is None:
            self._status_svc = get_status_service()
        return self._status_svc

    # ─── Push: Local → Turso ──────────────────────────

    async def push(self) -> Dict[str, Any]:
        """
        Push unsynced records from local SQLite to Turso.
        Records where synced_at is NULL or older than updated_at.
        """
        client = await self._get_client()
        if not client:
            return {"success": False, "error": "Turso client not available", "synced": 0}

        svc = self._get_status_service()
        unsynced = svc.get_unsynced_records()

        if not unsynced:
            return {"success": True, "synced": 0, "message": "No records to sync"}

        synced_count = 0
        errors = []

        for record in unsynced:
            try:
                await client.execute(
                    """
                    INSERT OR REPLACE INTO ContentRecord
                    (id, title, contentType, sourceRobot, status, projectId,
                     contentPath, contentPreview, contentHash, priority,
                     tags, metadata, targetUrl, reviewerNote, reviewedBy,
                     createdAt, updatedAt, scheduledFor, publishedAt, syncedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    [
                        record.id,
                        record.title,
                        record.content_type,
                        record.source_robot,
                        record.status,
                        record.project_id,
                        record.content_path,
                        record.content_preview,
                        record.content_hash,
                        record.priority,
                        json.dumps(record.tags),
                        json.dumps(record.metadata),
                        record.target_url,
                        record.reviewer_note,
                        record.reviewed_by,
                        int(record.created_at.timestamp() * 1000) if record.created_at else None,
                        int(record.updated_at.timestamp() * 1000) if record.updated_at else None,
                        int(record.scheduled_for.timestamp() * 1000) if record.scheduled_for else None,
                        int(record.published_at.timestamp() * 1000) if record.published_at else None,
                        int(datetime.utcnow().timestamp() * 1000),
                    ],
                )
                svc.mark_synced(record.id)
                synced_count += 1
            except Exception as e:
                errors.append(f"Record {record.id}: {e}")
                logger.error(f"Failed to sync record {record.id}: {e}")

        # Also sync status changes
        await self._push_status_changes(client)

        return {
            "success": len(errors) == 0,
            "synced": synced_count,
            "errors": errors if errors else None,
        }

    async def _push_status_changes(self, client) -> int:
        """Push status change audit trail to Turso."""
        svc = self._get_status_service()
        synced = 0

        # Get all unsynced content records and push their changes
        unsynced = svc.get_unsynced_records()
        content_ids = {r.id for r in unsynced}

        for content_id in content_ids:
            history = svc.get_history(content_id)
            for change in history:
                try:
                    await client.execute(
                        """
                        INSERT OR IGNORE INTO StatusChange
                        (id, contentId, fromStatus, toStatus, changedBy, reason, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        [
                            change.id,
                            change.content_id,
                            change.from_status,
                            change.to_status,
                            change.changed_by,
                            change.reason,
                            int(change.timestamp.timestamp() * 1000),
                        ],
                    )
                    synced += 1
                except Exception as e:
                    logger.error(f"Failed to sync change {change.id}: {e}")

        return synced

    # ─── Pull: Turso → Local ──────────────────────────

    async def pull(self) -> Dict[str, Any]:
        """
        Pull review actions from Turso.
        When a user approves/rejects via the dashboard, the action is written to Turso.
        This pulls those changes and applies them locally.
        """
        client = await self._get_client()
        if not client:
            return {"success": False, "error": "Turso client not available", "pulled": 0}

        svc = self._get_status_service()
        pulled_count = 0
        errors = []

        try:
            # Find records in Turso that have been reviewed (status changed to approved/rejected)
            # and are newer than our local version
            result = await client.execute(
                """
                SELECT id, status, reviewerNote, reviewedBy, updatedAt
                FROM ContentRecord
                WHERE status IN ('approved', 'rejected')
                AND reviewedBy IS NOT NULL
                ORDER BY updatedAt DESC
                LIMIT 100
                """
            )

            for row in result.rows:
                turso_id = row[0]
                turso_status = row[1]
                turso_note = row[2]
                turso_reviewed_by = row[3]
                turso_updated_at = row[4]

                try:
                    local_record = svc.get_content(turso_id)

                    # Only apply if Turso is newer and status is different
                    local_ts = int(local_record.updated_at.timestamp() * 1000)
                    if turso_updated_at and turso_updated_at > local_ts and local_record.status != turso_status:
                        svc.transition(
                            turso_id,
                            turso_status,
                            turso_reviewed_by or "dashboard_user",
                            reason=turso_note,
                        )
                        if turso_note:
                            svc.update_content(turso_id, reviewer_note=turso_note, reviewed_by=turso_reviewed_by)
                        pulled_count += 1
                        logger.info(f"Pulled review for {turso_id}: {turso_status}")
                except Exception as e:
                    errors.append(f"Record {turso_id}: {e}")
                    logger.warning(f"Failed to pull record {turso_id}: {e}")

        except Exception as e:
            return {"success": False, "error": str(e), "pulled": 0}

        return {
            "success": len(errors) == 0,
            "pulled": pulled_count,
            "errors": errors if errors else None,
        }

    # ─── Background Sync Loop ─────────────────────────

    async def start_background_sync(self):
        """Start the background sync loop."""
        if not self.configured:
            logger.info("Turso not configured, background sync disabled")
            return

        self._running = True
        logger.info(f"Starting background sync (interval: {SYNC_INTERVAL}s)")

        while self._running:
            try:
                push_result = await self.push()
                if push_result.get("synced", 0) > 0:
                    logger.info(f"Sync push: {push_result['synced']} records")

                pull_result = await self.pull()
                if pull_result.get("pulled", 0) > 0:
                    logger.info(f"Sync pull: {pull_result['pulled']} records")

            except Exception as e:
                logger.error(f"Sync cycle error: {e}")

            await asyncio.sleep(SYNC_INTERVAL)

    def stop_background_sync(self):
        """Stop the background sync loop."""
        self._running = False
        logger.info("Background sync stopped")


# ─── Singleton ────────────────────────────────────────

_sync_instance: Optional[SyncService] = None


def get_sync_service() -> SyncService:
    """Get or create the singleton SyncService instance."""
    global _sync_instance
    if _sync_instance is None:
        _sync_instance = SyncService()
    return _sync_instance
