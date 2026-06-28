from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

from utils.libsql_async import create_client


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ts(raw: Any) -> datetime:
    if isinstance(raw, datetime):
        return raw
    if isinstance(raw, str):
        try:
            return datetime.fromisoformat(raw)
        except ValueError:
            pass
    return datetime.now(timezone.utc)


def _json_load(raw: Any, fallback: Any) -> Any:
    if raw is None:
        return fallback
    if isinstance(raw, (dict, list)):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8", errors="ignore")
    try:
        return json.loads(raw)
    except Exception:
        return fallback


def _json_dump(raw: Any) -> str:
    return json.dumps(raw, separators=(",", ":"), ensure_ascii=True)


class ProjectIntelligenceStore:
    def __init__(self, db_client: Any | None = None) -> None:
        self.db_client = db_client
        if self.db_client is None and os.getenv("TURSO_DATABASE_URL") and os.getenv("TURSO_AUTH_TOKEN"):
            self.db_client = create_client(
                url=os.getenv("TURSO_DATABASE_URL"),
                auth_token=os.getenv("TURSO_AUTH_TOKEN"),
            )

    def _ensure_connected(self) -> None:
        if not self.db_client:
            raise RuntimeError("Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.")

    async def ensure_tables(self) -> None:
        self._ensure_connected()
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS ProjectIntelligenceJob (
                id TEXT PRIMARY KEY NOT NULL,
                userId TEXT NOT NULL,
                projectId TEXT NOT NULL,
                jobType TEXT NOT NULL,
                status TEXT NOT NULL,
                summaryJson TEXT,
                errorCode TEXT,
                errorMessage TEXT,
                startedAt TEXT,
                completedAt TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            """
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_job_scope ON ProjectIntelligenceJob (userId, projectId, createdAt DESC)"
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_job_active ON ProjectIntelligenceJob (userId, projectId, status)"
        )
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS ProjectIntelligenceSource (
                id TEXT PRIMARY KEY NOT NULL,
                userId TEXT NOT NULL,
                projectId TEXT NOT NULL,
                sourceType TEXT NOT NULL,
                sourceLabel TEXT NOT NULL,
                status TEXT NOT NULL,
                originRef TEXT,
                contentHash TEXT,
                summaryText TEXT,
                metadataJson TEXT,
                removedAt TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            """
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_source_scope ON ProjectIntelligenceSource (userId, projectId, updatedAt DESC)"
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_source_status ON ProjectIntelligenceSource (userId, projectId, status, removedAt)"
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_source_hash ON ProjectIntelligenceSource (userId, projectId, contentHash)"
        )
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS ProjectIntelligenceDocument (
                id TEXT PRIMARY KEY NOT NULL,
                sourceId TEXT NOT NULL,
                userId TEXT NOT NULL,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                mimeType TEXT,
                fileName TEXT,
                contentHash TEXT NOT NULL,
                normalizedHash TEXT NOT NULL,
                snippet TEXT,
                textBody TEXT NOT NULL,
                charCount INTEGER NOT NULL DEFAULT 0,
                isDuplicate INTEGER NOT NULL DEFAULT 0,
                canonicalDocumentId TEXT,
                nearDuplicateScore REAL,
                removedAt TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            """
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_document_scope ON ProjectIntelligenceDocument (userId, projectId, updatedAt DESC)"
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_document_source ON ProjectIntelligenceDocument (sourceId, removedAt)"
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_document_normalized_hash ON ProjectIntelligenceDocument (userId, projectId, normalizedHash)"
        )
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS ProjectIntelligenceChunk (
                id TEXT PRIMARY KEY NOT NULL,
                documentId TEXT NOT NULL,
                sourceId TEXT NOT NULL,
                userId TEXT NOT NULL,
                projectId TEXT NOT NULL,
                orderIndex INTEGER NOT NULL,
                startOffset INTEGER NOT NULL,
                endOffset INTEGER NOT NULL,
                text TEXT NOT NULL,
                contentHash TEXT NOT NULL,
                removedAt TEXT,
                createdAt TEXT NOT NULL
            )
            """
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_chunk_scope ON ProjectIntelligenceChunk (userId, projectId, documentId, orderIndex)"
        )
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS ProjectIntelligenceFact (
                id TEXT PRIMARY KEY NOT NULL,
                sourceId TEXT NOT NULL,
                documentId TEXT NOT NULL,
                chunkId TEXT,
                userId TEXT NOT NULL,
                projectId TEXT NOT NULL,
                category TEXT NOT NULL,
                subject TEXT NOT NULL,
                statement TEXT NOT NULL,
                confidence REAL NOT NULL DEFAULT 0,
                priority INTEGER NOT NULL DEFAULT 3,
                evidenceSnippet TEXT,
                metadataJson TEXT,
                removedAt TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            """
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_fact_scope ON ProjectIntelligenceFact (userId, projectId, category, updatedAt DESC)"
        )
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS ProjectIntelligenceRecommendation (
                id TEXT PRIMARY KEY NOT NULL,
                userId TEXT NOT NULL,
                projectId TEXT NOT NULL,
                recommendationKey TEXT NOT NULL,
                recommendationType TEXT NOT NULL,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                rationale TEXT,
                priority INTEGER NOT NULL DEFAULT 3,
                confidence REAL NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'open',
                evidenceIdsJson TEXT,
                evidenceJson TEXT,
                metadataJson TEXT,
                removedAt TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            """
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_rec_scope ON ProjectIntelligenceRecommendation (userId, projectId, status, updatedAt DESC)"
        )
        await self.db_client.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_pi_rec_key_scope ON ProjectIntelligenceRecommendation (userId, projectId, recommendationKey)"
        )
        await self.db_client.execute(
            """
            CREATE TABLE IF NOT EXISTS ProjectIntelligenceDuplicate (
                id TEXT PRIMARY KEY NOT NULL,
                userId TEXT NOT NULL,
                projectId TEXT NOT NULL,
                documentId TEXT NOT NULL,
                canonicalDocumentId TEXT NOT NULL,
                kind TEXT NOT NULL,
                similarity REAL NOT NULL DEFAULT 1,
                reason TEXT NOT NULL,
                createdAt TEXT NOT NULL
            )
            """
        )
        await self.db_client.execute(
            "CREATE INDEX IF NOT EXISTS idx_pi_dup_scope ON ProjectIntelligenceDuplicate (userId, projectId, createdAt DESC)"
        )

    def _job_from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "id": row[0],
            "userId": row[1],
            "projectId": row[2],
            "jobType": row[3],
            "status": row[4],
            "summary": _json_load(row[5], {}),
            "errorCode": row[6],
            "errorMessage": row[7],
            "startedAt": _ts(row[8]) if row[8] else None,
            "completedAt": _ts(row[9]) if row[9] else None,
            "createdAt": _ts(row[10]),
            "updatedAt": _ts(row[11]),
        }

    def _source_from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "id": row[0],
            "userId": row[1],
            "projectId": row[2],
            "sourceType": row[3],
            "sourceLabel": row[4],
            "status": row[5],
            "originRef": row[6],
            "contentHash": row[7],
            "summaryText": row[8],
            "metadata": _json_load(row[9], {}),
            "removedAt": _ts(row[10]) if row[10] else None,
            "createdAt": _ts(row[11]),
            "updatedAt": _ts(row[12]),
        }

    def _document_from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "id": row[0],
            "sourceId": row[1],
            "userId": row[2],
            "projectId": row[3],
            "title": row[4],
            "mimeType": row[5],
            "fileName": row[6],
            "contentHash": row[7],
            "normalizedHash": row[8],
            "snippet": row[9],
            "textBody": row[10],
            "charCount": int(row[11] or 0),
            "isDuplicate": bool(row[12]),
            "canonicalDocumentId": row[13],
            "nearDuplicateScore": float(row[14]) if row[14] is not None else None,
            "removedAt": _ts(row[15]) if row[15] else None,
            "createdAt": _ts(row[16]),
            "updatedAt": _ts(row[17]),
        }

    def _chunk_from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "id": row[0],
            "documentId": row[1],
            "sourceId": row[2],
            "userId": row[3],
            "projectId": row[4],
            "orderIndex": int(row[5] or 0),
            "startOffset": int(row[6] or 0),
            "endOffset": int(row[7] or 0),
            "text": row[8] or "",
            "contentHash": row[9] or "",
            "removedAt": _ts(row[10]) if row[10] else None,
            "createdAt": _ts(row[11]),
        }

    def _fact_from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "id": row[0],
            "sourceId": row[1],
            "documentId": row[2],
            "chunkId": row[3],
            "userId": row[4],
            "projectId": row[5],
            "category": row[6],
            "subject": row[7],
            "statement": row[8],
            "confidence": float(row[9] or 0),
            "priority": int(row[10] or 3),
            "evidenceSnippet": row[11],
            "metadata": _json_load(row[12], {}),
            "removedAt": _ts(row[13]) if row[13] else None,
            "createdAt": _ts(row[14]),
            "updatedAt": _ts(row[15]),
        }

    def _recommendation_from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "id": row[0],
            "userId": row[1],
            "projectId": row[2],
            "recommendationKey": row[3],
            "recommendationType": row[4],
            "title": row[5],
            "summary": row[6],
            "rationale": row[7],
            "priority": int(row[8] or 3),
            "confidence": float(row[9] or 0),
            "status": row[10],
            "evidenceIds": _json_load(row[11], []),
            "evidence": _json_load(row[12], []),
            "metadata": _json_load(row[13], {}),
            "removedAt": _ts(row[14]) if row[14] else None,
            "createdAt": _ts(row[15]),
            "updatedAt": _ts(row[16]),
        }

    def _duplicate_from_row(self, row: tuple[Any, ...]) -> dict[str, Any]:
        return {
            "id": row[0],
            "userId": row[1],
            "projectId": row[2],
            "documentId": row[3],
            "canonicalDocumentId": row[4],
            "kind": row[5],
            "similarity": float(row[6] or 0),
            "reason": row[7],
            "createdAt": _ts(row[8]),
        }

    async def create_job(
        self,
        *,
        user_id: str,
        project_id: str,
        job_type: str,
        status: str = "running",
        summary: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        self._ensure_connected()
        job_id = str(uuid.uuid4())
        now = _now_iso()
        await self.db_client.execute(
            """
            INSERT INTO ProjectIntelligenceJob (
                id, userId, projectId, jobType, status, summaryJson, errorCode, errorMessage,
                startedAt, completedAt, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, ?, ?)
            """,
            [job_id, user_id, project_id, job_type, status, _json_dump(summary or {}), now, now, now],
        )
        job = await self.get_job(user_id=user_id, project_id=project_id, job_id=job_id)
        if not job:
            raise RuntimeError("Failed to create project intelligence job")
        return job

    async def update_job(
        self,
        *,
        user_id: str,
        project_id: str,
        job_id: str,
        status: str,
        summary: dict[str, Any] | None = None,
        error_code: str | None = None,
        error_message: str | None = None,
    ) -> dict[str, Any]:
        self._ensure_connected()
        now = _now_iso()
        completed_at = now if status in {"completed", "failed", "conflict", "degraded"} else None
        await self.db_client.execute(
            """
            UPDATE ProjectIntelligenceJob
            SET status = ?, summaryJson = ?, errorCode = ?, errorMessage = ?,
                completedAt = COALESCE(?, completedAt), updatedAt = ?
            WHERE id = ? AND userId = ? AND projectId = ?
            """,
            [
                status,
                _json_dump(summary or {}),
                error_code,
                error_message,
                completed_at,
                now,
                job_id,
                user_id,
                project_id,
            ],
        )
        updated = await self.get_job(user_id=user_id, project_id=project_id, job_id=job_id)
        if not updated:
            raise RuntimeError("Job not found")
        return updated

    async def get_job(self, *, user_id: str, project_id: str, job_id: str) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, jobType, status, summaryJson, errorCode, errorMessage,
                   startedAt, completedAt, createdAt, updatedAt
            FROM ProjectIntelligenceJob
            WHERE id = ? AND userId = ? AND projectId = ?
            LIMIT 1
            """,
            [job_id, user_id, project_id],
        )
        if not rs.rows:
            return None
        return self._job_from_row(rs.rows[0])

    async def list_jobs(self, *, user_id: str, project_id: str, limit: int = 20) -> list[dict[str, Any]]:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, jobType, status, summaryJson, errorCode, errorMessage,
                   startedAt, completedAt, createdAt, updatedAt
            FROM ProjectIntelligenceJob
            WHERE userId = ? AND projectId = ?
            ORDER BY createdAt DESC
            LIMIT ?
            """,
            [user_id, project_id, limit],
        )
        return [self._job_from_row(row) for row in rs.rows]

    async def get_active_job(self, *, user_id: str, project_id: str) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, jobType, status, summaryJson, errorCode, errorMessage,
                   startedAt, completedAt, createdAt, updatedAt
            FROM ProjectIntelligenceJob
            WHERE userId = ? AND projectId = ? AND status IN ('queued', 'running')
            ORDER BY createdAt DESC
            LIMIT 1
            """,
            [user_id, project_id],
        )
        if not rs.rows:
            return None
        return self._job_from_row(rs.rows[0])

    async def create_source(
        self,
        *,
        user_id: str,
        project_id: str,
        source_type: str,
        source_label: str,
        status: str,
        origin_ref: str | None = None,
        content_hash: str | None = None,
        summary_text: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        self._ensure_connected()
        source_id = str(uuid.uuid4())
        now = _now_iso()
        await self.db_client.execute(
            """
            INSERT INTO ProjectIntelligenceSource (
                id, userId, projectId, sourceType, sourceLabel, status, originRef, contentHash,
                summaryText, metadataJson, removedAt, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
            """,
            [
                source_id,
                user_id,
                project_id,
                source_type,
                source_label,
                status,
                origin_ref,
                content_hash,
                summary_text,
                _json_dump(metadata or {}),
                now,
                now,
            ],
        )
        source = await self.get_source(user_id=user_id, project_id=project_id, source_id=source_id)
        if not source:
            raise RuntimeError("Failed to create source")
        return source

    async def list_sources(
        self,
        *,
        user_id: str,
        project_id: str,
        include_removed: bool = False,
        limit: int = 200,
    ) -> list[dict[str, Any]]:
        self._ensure_connected()
        where_removed = "" if include_removed else " AND removedAt IS NULL"
        rs = await self.db_client.execute(
            f"""
            SELECT id, userId, projectId, sourceType, sourceLabel, status, originRef, contentHash,
                   summaryText, metadataJson, removedAt, createdAt, updatedAt
            FROM ProjectIntelligenceSource
            WHERE userId = ? AND projectId = ?{where_removed}
            ORDER BY updatedAt DESC
            LIMIT ?
            """,
            [user_id, project_id, limit],
        )
        return [self._source_from_row(row) for row in rs.rows]

    async def get_source(self, *, user_id: str, project_id: str, source_id: str) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, sourceType, sourceLabel, status, originRef, contentHash,
                   summaryText, metadataJson, removedAt, createdAt, updatedAt
            FROM ProjectIntelligenceSource
            WHERE id = ? AND userId = ? AND projectId = ?
            LIMIT 1
            """,
            [source_id, user_id, project_id],
        )
        if not rs.rows:
            return None
        return self._source_from_row(rs.rows[0])

    async def find_source(
        self,
        *,
        user_id: str,
        project_id: str,
        source_type: str,
        origin_ref: str | None,
        content_hash: str | None,
    ) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, sourceType, sourceLabel, status, originRef, contentHash,
                   summaryText, metadataJson, removedAt, createdAt, updatedAt
            FROM ProjectIntelligenceSource
            WHERE userId = ? AND projectId = ? AND sourceType = ?
              AND COALESCE(originRef, '') = COALESCE(?, '')
              AND COALESCE(contentHash, '') = COALESCE(?, '')
              AND removedAt IS NULL
            LIMIT 1
            """,
            [user_id, project_id, source_type, origin_ref, content_hash],
        )
        if not rs.rows:
            return None
        return self._source_from_row(rs.rows[0])

    async def mark_source_removed(self, *, user_id: str, project_id: str, source_id: str) -> bool:
        self._ensure_connected()
        now = _now_iso()
        source = await self.get_source(user_id=user_id, project_id=project_id, source_id=source_id)
        if not source:
            return False
        await self.db_client.execute(
            """
            UPDATE ProjectIntelligenceSource
            SET removedAt = COALESCE(removedAt, ?), status = 'removed', updatedAt = ?
            WHERE id = ? AND userId = ? AND projectId = ?
            """,
            [now, now, source_id, user_id, project_id],
        )
        await self.db_client.execute(
            "UPDATE ProjectIntelligenceDocument SET removedAt = COALESCE(removedAt, ?), updatedAt = ? WHERE sourceId = ? AND userId = ? AND projectId = ?",
            [now, now, source_id, user_id, project_id],
        )
        await self.db_client.execute(
            "UPDATE ProjectIntelligenceChunk SET removedAt = COALESCE(removedAt, ?) WHERE sourceId = ? AND userId = ? AND projectId = ?",
            [now, source_id, user_id, project_id],
        )
        await self.db_client.execute(
            "UPDATE ProjectIntelligenceFact SET removedAt = COALESCE(removedAt, ?), updatedAt = ? WHERE sourceId = ? AND userId = ? AND projectId = ?",
            [now, now, source_id, user_id, project_id],
        )
        await self.db_client.execute(
            """
            UPDATE ProjectIntelligenceRecommendation
            SET removedAt = COALESCE(removedAt, ?), status = 'removed', updatedAt = ?
            WHERE userId = ? AND projectId = ?
              AND id IN (
                  SELECT r.id
                  FROM ProjectIntelligenceRecommendation r
                  WHERE r.userId = ? AND r.projectId = ?
                    AND r.removedAt IS NULL
              )
              AND (
                  evidenceIdsJson LIKE ?
                  OR evidenceJson LIKE ?
              )
            """,
            [now, now, user_id, project_id, user_id, project_id, f"%{source_id}%", f"%{source_id}%"],
        )
        return True

    async def create_document(
        self,
        *,
        source_id: str,
        user_id: str,
        project_id: str,
        title: str,
        mime_type: str | None,
        file_name: str | None,
        content_hash: str,
        normalized_hash: str,
        text_body: str,
        snippet: str | None,
        char_count: int,
        is_duplicate: bool = False,
        canonical_document_id: str | None = None,
        near_duplicate_score: float | None = None,
    ) -> dict[str, Any]:
        self._ensure_connected()
        document_id = str(uuid.uuid4())
        now = _now_iso()
        await self.db_client.execute(
            """
            INSERT INTO ProjectIntelligenceDocument (
                id, sourceId, userId, projectId, title, mimeType, fileName,
                contentHash, normalizedHash, snippet, textBody, charCount, isDuplicate,
                canonicalDocumentId, nearDuplicateScore, removedAt, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
            """,
            [
                document_id,
                source_id,
                user_id,
                project_id,
                title,
                mime_type,
                file_name,
                content_hash,
                normalized_hash,
                snippet,
                text_body,
                char_count,
                1 if is_duplicate else 0,
                canonical_document_id,
                near_duplicate_score,
                now,
                now,
            ],
        )
        document = await self.get_document(user_id=user_id, project_id=project_id, document_id=document_id)
        if not document:
            raise RuntimeError("Failed to create document")
        return document

    async def get_document(self, *, user_id: str, project_id: str, document_id: str) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, sourceId, userId, projectId, title, mimeType, fileName, contentHash,
                   normalizedHash, snippet, textBody, charCount, isDuplicate, canonicalDocumentId,
                   nearDuplicateScore, removedAt, createdAt, updatedAt
            FROM ProjectIntelligenceDocument
            WHERE id = ? AND userId = ? AND projectId = ?
            LIMIT 1
            """,
            [document_id, user_id, project_id],
        )
        if not rs.rows:
            return None
        return self._document_from_row(rs.rows[0])

    async def get_document_by_normalized_hash(
        self,
        *,
        user_id: str,
        project_id: str,
        normalized_hash: str,
    ) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, sourceId, userId, projectId, title, mimeType, fileName, contentHash,
                   normalizedHash, snippet, textBody, charCount, isDuplicate, canonicalDocumentId,
                   nearDuplicateScore, removedAt, createdAt, updatedAt
            FROM ProjectIntelligenceDocument
            WHERE userId = ? AND projectId = ? AND normalizedHash = ? AND removedAt IS NULL
            ORDER BY createdAt ASC
            LIMIT 1
            """,
            [user_id, project_id, normalized_hash],
        )
        if not rs.rows:
            return None
        return self._document_from_row(rs.rows[0])

    async def list_documents(
        self,
        *,
        user_id: str,
        project_id: str,
        include_removed: bool = False,
        limit: int = 300,
    ) -> list[dict[str, Any]]:
        self._ensure_connected()
        where_removed = "" if include_removed else " AND d.removedAt IS NULL AND s.removedAt IS NULL"
        rs = await self.db_client.execute(
            f"""
            SELECT d.id, d.sourceId, d.userId, d.projectId, d.title, d.mimeType, d.fileName, d.contentHash,
                   d.normalizedHash, d.snippet, d.textBody, d.charCount, d.isDuplicate, d.canonicalDocumentId,
                   d.nearDuplicateScore, d.removedAt, d.createdAt, d.updatedAt
            FROM ProjectIntelligenceDocument d
            JOIN ProjectIntelligenceSource s ON s.id = d.sourceId
            WHERE d.userId = ? AND d.projectId = ?{where_removed}
            ORDER BY d.updatedAt DESC
            LIMIT ?
            """,
            [user_id, project_id, limit],
        )
        return [self._document_from_row(row) for row in rs.rows]

    async def create_chunks(self, chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
        self._ensure_connected()
        now = _now_iso()
        created: list[dict[str, Any]] = []
        for item in chunks:
            chunk_id = str(uuid.uuid4())
            await self.db_client.execute(
                """
                INSERT INTO ProjectIntelligenceChunk (
                    id, documentId, sourceId, userId, projectId, orderIndex,
                    startOffset, endOffset, text, contentHash, removedAt, createdAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
                """,
                [
                    chunk_id,
                    item["documentId"],
                    item["sourceId"],
                    item["userId"],
                    item["projectId"],
                    int(item["orderIndex"]),
                    int(item["startOffset"]),
                    int(item["endOffset"]),
                    item["text"],
                    item["contentHash"],
                    now,
                ],
            )
            created.append(
                {
                    "id": chunk_id,
                    "documentId": item["documentId"],
                    "sourceId": item["sourceId"],
                    "userId": item["userId"],
                    "projectId": item["projectId"],
                    "orderIndex": int(item["orderIndex"]),
                    "startOffset": int(item["startOffset"]),
                    "endOffset": int(item["endOffset"]),
                    "text": item["text"],
                    "contentHash": item["contentHash"],
                    "createdAt": _ts(now),
                    "removedAt": None,
                }
            )
        return created

    async def list_chunks(self, *, user_id: str, project_id: str, document_id: str | None = None) -> list[dict[str, Any]]:
        self._ensure_connected()
        doc_where = " AND documentId = ?" if document_id else ""
        params: list[Any] = [user_id, project_id]
        if document_id:
            params.append(document_id)
        rs = await self.db_client.execute(
            f"""
            SELECT id, documentId, sourceId, userId, projectId, orderIndex, startOffset,
                   endOffset, text, contentHash, removedAt, createdAt
            FROM ProjectIntelligenceChunk
            WHERE userId = ? AND projectId = ? AND removedAt IS NULL{doc_where}
            ORDER BY createdAt ASC
            """,
            params,
        )
        return [self._chunk_from_row(row) for row in rs.rows]

    async def create_facts(self, facts: list[dict[str, Any]]) -> list[dict[str, Any]]:
        self._ensure_connected()
        now = _now_iso()
        created: list[dict[str, Any]] = []
        for item in facts:
            fact_id = str(uuid.uuid4())
            await self.db_client.execute(
                """
                INSERT INTO ProjectIntelligenceFact (
                    id, sourceId, documentId, chunkId, userId, projectId, category, subject,
                    statement, confidence, priority, evidenceSnippet, metadataJson, removedAt, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
                """,
                [
                    fact_id,
                    item["sourceId"],
                    item["documentId"],
                    item.get("chunkId"),
                    item["userId"],
                    item["projectId"],
                    item["category"],
                    item["subject"],
                    item["statement"],
                    float(item.get("confidence", 0.0)),
                    int(item.get("priority", 3)),
                    item.get("evidenceSnippet"),
                    _json_dump(item.get("metadata", {})),
                    now,
                    now,
                ],
            )
            created.append(
                {
                    "id": fact_id,
                    "sourceId": item["sourceId"],
                    "documentId": item["documentId"],
                    "chunkId": item.get("chunkId"),
                    "userId": item["userId"],
                    "projectId": item["projectId"],
                    "category": item["category"],
                    "subject": item["subject"],
                    "statement": item["statement"],
                    "confidence": float(item.get("confidence", 0.0)),
                    "priority": int(item.get("priority", 3)),
                    "evidenceSnippet": item.get("evidenceSnippet"),
                    "metadata": item.get("metadata", {}),
                    "createdAt": _ts(now),
                    "updatedAt": _ts(now),
                    "removedAt": None,
                }
            )
        return created

    async def list_facts(
        self,
        *,
        user_id: str,
        project_id: str,
        limit: int = 300,
    ) -> list[dict[str, Any]]:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT f.id, f.sourceId, f.documentId, f.chunkId, f.userId, f.projectId, f.category, f.subject,
                   f.statement, f.confidence, f.priority, f.evidenceSnippet, f.metadataJson, f.removedAt,
                   f.createdAt, f.updatedAt
            FROM ProjectIntelligenceFact f
            JOIN ProjectIntelligenceSource s ON s.id = f.sourceId
            WHERE f.userId = ? AND f.projectId = ?
              AND f.removedAt IS NULL
              AND s.removedAt IS NULL
            ORDER BY f.priority ASC, f.confidence DESC, f.updatedAt DESC
            LIMIT ?
            """,
            [user_id, project_id, limit],
        )
        return [self._fact_from_row(row) for row in rs.rows]

    async def clear_recommendations(self, *, user_id: str, project_id: str) -> None:
        self._ensure_connected()
        now = _now_iso()
        await self.db_client.execute(
            """
            UPDATE ProjectIntelligenceRecommendation
            SET removedAt = COALESCE(removedAt, ?), status = 'superseded', updatedAt = ?
            WHERE userId = ? AND projectId = ? AND removedAt IS NULL
            """,
            [now, now, user_id, project_id],
        )

    async def upsert_recommendations(self, recommendations: list[dict[str, Any]]) -> list[dict[str, Any]]:
        self._ensure_connected()
        now = _now_iso()
        created: list[dict[str, Any]] = []
        for item in recommendations:
            existing_rs = await self.db_client.execute(
                """
                SELECT id
                FROM ProjectIntelligenceRecommendation
                WHERE userId = ? AND projectId = ? AND recommendationKey = ?
                LIMIT 1
                """,
                [item["userId"], item["projectId"], item["recommendationKey"]],
            )
            rec_id = existing_rs.rows[0][0] if existing_rs.rows else str(uuid.uuid4())
            if existing_rs.rows:
                await self.db_client.execute(
                    """
                    UPDATE ProjectIntelligenceRecommendation
                    SET recommendationType = ?, title = ?, summary = ?, rationale = ?,
                        priority = ?, confidence = ?, status = ?, evidenceIdsJson = ?,
                        evidenceJson = ?, metadataJson = ?, removedAt = NULL, updatedAt = ?
                    WHERE id = ?
                    """,
                    [
                        item["recommendationType"],
                        item["title"],
                        item["summary"],
                        item.get("rationale"),
                        int(item.get("priority", 3)),
                        float(item.get("confidence", 0.0)),
                        item.get("status", "open"),
                        _json_dump(item.get("evidenceIds", [])),
                        _json_dump(item.get("evidence", [])),
                        _json_dump(item.get("metadata", {})),
                        now,
                        rec_id,
                    ],
                )
            else:
                await self.db_client.execute(
                    """
                    INSERT INTO ProjectIntelligenceRecommendation (
                        id, userId, projectId, recommendationKey, recommendationType, title, summary,
                        rationale, priority, confidence, status, evidenceIdsJson, evidenceJson, metadataJson,
                        removedAt, createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
                    """,
                    [
                        rec_id,
                        item["userId"],
                        item["projectId"],
                        item["recommendationKey"],
                        item["recommendationType"],
                        item["title"],
                        item["summary"],
                        item.get("rationale"),
                        int(item.get("priority", 3)),
                        float(item.get("confidence", 0.0)),
                        item.get("status", "open"),
                        _json_dump(item.get("evidenceIds", [])),
                        _json_dump(item.get("evidence", [])),
                        _json_dump(item.get("metadata", {})),
                        now,
                        now,
                    ],
                )
            rec = await self.get_recommendation(
                user_id=item["userId"],
                project_id=item["projectId"],
                recommendation_id=rec_id,
            )
            if rec:
                created.append(rec)
        return created

    async def list_recommendations(
        self,
        *,
        user_id: str,
        project_id: str,
        limit: int = 200,
    ) -> list[dict[str, Any]]:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, recommendationKey, recommendationType, title, summary,
                   rationale, priority, confidence, status, evidenceIdsJson, evidenceJson, metadataJson,
                   removedAt, createdAt, updatedAt
            FROM ProjectIntelligenceRecommendation
            WHERE userId = ? AND projectId = ? AND removedAt IS NULL
            ORDER BY priority ASC, confidence DESC, updatedAt DESC
            LIMIT ?
            """,
            [user_id, project_id, limit],
        )
        return [self._recommendation_from_row(row) for row in rs.rows]

    async def get_recommendation(
        self,
        *,
        user_id: str,
        project_id: str,
        recommendation_id: str,
    ) -> dict[str, Any] | None:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, recommendationKey, recommendationType, title, summary,
                   rationale, priority, confidence, status, evidenceIdsJson, evidenceJson, metadataJson,
                   removedAt, createdAt, updatedAt
            FROM ProjectIntelligenceRecommendation
            WHERE id = ? AND userId = ? AND projectId = ? AND removedAt IS NULL
            LIMIT 1
            """,
            [recommendation_id, user_id, project_id],
        )
        if not rs.rows:
            return None
        return self._recommendation_from_row(rs.rows[0])

    async def update_recommendation_status(
        self,
        *,
        user_id: str,
        project_id: str,
        recommendation_id: str,
        status: str,
    ) -> None:
        self._ensure_connected()
        await self.db_client.execute(
            """
            UPDATE ProjectIntelligenceRecommendation
            SET status = ?, updatedAt = ?
            WHERE id = ? AND userId = ? AND projectId = ?
            """,
            [status, _now_iso(), recommendation_id, user_id, project_id],
        )

    async def create_duplicate(
        self,
        *,
        user_id: str,
        project_id: str,
        document_id: str,
        canonical_document_id: str,
        kind: str,
        similarity: float,
        reason: str,
    ) -> dict[str, Any]:
        self._ensure_connected()
        duplicate_id = str(uuid.uuid4())
        now = _now_iso()
        await self.db_client.execute(
            """
            INSERT INTO ProjectIntelligenceDuplicate (
                id, userId, projectId, documentId, canonicalDocumentId, kind, similarity, reason, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [duplicate_id, user_id, project_id, document_id, canonical_document_id, kind, similarity, reason, now],
        )
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, documentId, canonicalDocumentId, kind, similarity, reason, createdAt
            FROM ProjectIntelligenceDuplicate
            WHERE id = ?
            LIMIT 1
            """,
            [duplicate_id],
        )
        if not rs.rows:
            raise RuntimeError("Failed to create duplicate")
        return self._duplicate_from_row(rs.rows[0])

    async def list_duplicates(self, *, user_id: str, project_id: str, limit: int = 200) -> list[dict[str, Any]]:
        self._ensure_connected()
        rs = await self.db_client.execute(
            """
            SELECT id, userId, projectId, documentId, canonicalDocumentId, kind, similarity, reason, createdAt
            FROM ProjectIntelligenceDuplicate
            WHERE userId = ? AND projectId = ?
            ORDER BY createdAt DESC
            LIMIT ?
            """,
            [user_id, project_id, limit],
        )
        return [self._duplicate_from_row(row) for row in rs.rows]


project_intelligence_store = ProjectIntelligenceStore()
