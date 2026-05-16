from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any

from api.services.ai_runtime_service import AIRuntimeServiceError, ai_runtime_service
from api.services.project_intelligence_processor import (
    MAX_CONNECTOR_ITEMS,
    build_chunks,
    build_provider_readiness,
    build_recommendations,
    extract_facts_from_chunks,
    extract_text,
    normalize_text,
    sha256_text,
    similarity_score,
)
from api.services.project_intelligence_store import ProjectIntelligenceStore, project_intelligence_store
from api.services.search_console_store import search_console_store
from api.services.user_data_store import user_data_store
from status import get_status_service


CONNECTOR_DEFAULTS = (
    "project_profile",
    "work_domains",
    "creator_profile",
    "personas",
    "search_console",
    "idea_pool",
    "project_assets",
)

CONNECTOR_PERIODS = ("today", "7d", "30d", "90d", "6m")
CONNECTOR_MAX_PERSONAS = 25
CONNECTOR_MAX_IDEAS = 200
CONNECTOR_MAX_SEARCH_CONSOLE_OPPS = 200
CONNECTOR_MAX_PROJECT_ASSETS = 120


@dataclass
class UploadPayload:
    file_name: str
    content_type: str
    body: bytes


class ProjectIntelligenceService:
    def __init__(self, store: ProjectIntelligenceStore | None = None) -> None:
        self.store = store or project_intelligence_store

    async def get_status(self, *, user_id: str, project_id: str) -> dict[str, Any]:
        sources = await self.store.list_sources(user_id=user_id, project_id=project_id, limit=500)
        documents = await self.store.list_documents(user_id=user_id, project_id=project_id, limit=500)
        facts = await self.store.list_facts(user_id=user_id, project_id=project_id, limit=500)
        recommendations = await self.store.list_recommendations(user_id=user_id, project_id=project_id, limit=500)
        active_job = await self.store.get_active_job(user_id=user_id, project_id=project_id)
        jobs = await self.store.list_jobs(user_id=user_id, project_id=project_id, limit=1)
        return {
            "projectId": project_id,
            "counts": {
                "sources": len(sources),
                "documents": len(documents),
                "facts": len(facts),
                "recommendations": len(recommendations),
            },
            "activeJob": active_job,
            "lastJob": jobs[0] if jobs else None,
            "degraded": False,
            "degradedReason": None,
        }

    async def list_jobs(self, *, user_id: str, project_id: str) -> list[dict[str, Any]]:
        return await self.store.list_jobs(user_id=user_id, project_id=project_id, limit=50)

    async def get_job(self, *, user_id: str, project_id: str, job_id: str) -> dict[str, Any] | None:
        return await self.store.get_job(user_id=user_id, project_id=project_id, job_id=job_id)

    async def list_sources(self, *, user_id: str, project_id: str) -> list[dict[str, Any]]:
        return await self.store.list_sources(user_id=user_id, project_id=project_id, limit=500)

    async def list_documents(self, *, user_id: str, project_id: str) -> list[dict[str, Any]]:
        return await self.store.list_documents(user_id=user_id, project_id=project_id, limit=500)

    async def list_facts(self, *, user_id: str, project_id: str) -> list[dict[str, Any]]:
        return await self.store.list_facts(user_id=user_id, project_id=project_id, limit=500)

    async def list_recommendations(self, *, user_id: str, project_id: str) -> list[dict[str, Any]]:
        return await self.store.list_recommendations(user_id=user_id, project_id=project_id, limit=500)

    async def ingest_uploads(
        self,
        *,
        user_id: str,
        project_id: str,
        uploads: list[UploadPayload],
        include_ai_synthesis: bool = False,
    ) -> dict[str, Any]:
        active = await self.store.get_active_job(user_id=user_id, project_id=project_id)
        if active:
            return {
                "projectId": project_id,
                "job": active,
                "accepted": 0,
                "failed": 0,
                "duplicated": 0,
                "errors": [{"code": "active_job_conflict", "message": "An ingestion job is already running."}],
            }

        job = await self.store.create_job(
            user_id=user_id,
            project_id=project_id,
            job_type="project_intelligence.ingest",
            status="running",
            summary={"accepted": 0, "failed": 0, "duplicated": 0},
        )
        accepted = 0
        failed = 0
        duplicated = 0
        errors: list[dict[str, Any]] = []
        try:
            for upload in uploads:
                result = await self._ingest_text_source(
                    user_id=user_id,
                    project_id=project_id,
                    source_type="upload",
                    source_label="Uploaded File",
                    source_origin=upload.file_name,
                    mime_type=upload.content_type,
                    raw_bytes=upload.body,
                    metadata={"fileName": upload.file_name, "mimeType": upload.content_type},
                )
                if result["status"] == "failed":
                    failed += 1
                    errors.append(
                        {
                            "fileName": upload.file_name,
                            "code": result.get("code", "ingest_failed"),
                            "message": result.get("message", "Failed to ingest upload."),
                        }
                    )
                    continue
                accepted += 1
                if result["duplicate"]:
                    duplicated += 1

            degraded_reason = await self._try_ai_synthesis_preflight(
                user_id=user_id,
                include_ai_synthesis=include_ai_synthesis,
            )
            await self._rebuild_recommendations(user_id=user_id, project_id=project_id)
            summary = {
                "accepted": accepted,
                "failed": failed,
                "duplicated": duplicated,
                "errors": errors,
                "degradedReason": degraded_reason,
            }
            status = "degraded" if degraded_reason else "completed"
            job = await self.store.update_job(
                user_id=user_id,
                project_id=project_id,
                job_id=job["id"],
                status=status,
                summary=summary,
            )
            return {
                "projectId": project_id,
                "job": job,
                "accepted": accepted,
                "failed": failed,
                "duplicated": duplicated,
                "errors": errors,
            }
        except Exception as exc:
            job = await self.store.update_job(
                user_id=user_id,
                project_id=project_id,
                job_id=job["id"],
                status="failed",
                summary={"accepted": accepted, "failed": failed, "duplicated": duplicated},
                error_code="project_intelligence_ingest_failed",
                error_message=str(exc),
            )
            return {
                "projectId": project_id,
                "job": job,
                "accepted": accepted,
                "failed": failed + 1,
                "duplicated": duplicated,
                "errors": [{"code": "project_intelligence_ingest_failed", "message": "Ingestion failed."}],
            }

    async def sync_connectors(
        self,
        *,
        user_id: str,
        project_id: str,
        project_payload: dict[str, Any],
        connectors: list[str] | None = None,
        include_ai_synthesis: bool = False,
    ) -> dict[str, Any]:
        active = await self.store.get_active_job(user_id=user_id, project_id=project_id)
        if active:
            return {
                "projectId": project_id,
                "job": active,
                "accepted": 0,
                "failed": 0,
                "duplicated": 0,
                "errors": [{"code": "active_job_conflict", "message": "A sync job is already running."}],
            }

        job = await self.store.create_job(
            user_id=user_id,
            project_id=project_id,
            job_type="project_intelligence.sync",
            status="running",
            summary={"accepted": 0, "failed": 0, "duplicated": 0},
        )
        accepted = 0
        failed = 0
        duplicated = 0
        errors: list[dict[str, Any]] = []
        selected = tuple(connectors or CONNECTOR_DEFAULTS)
        try:
            records = await self._build_connector_records(
                user_id=user_id,
                project_id=project_id,
                project_payload=project_payload,
                connectors=selected,
            )
            for record in records:
                result = await self._ingest_text_source(
                    user_id=user_id,
                    project_id=project_id,
                    source_type=record["sourceType"],
                    source_label=record["sourceLabel"],
                    source_origin=record["originRef"],
                    mime_type=record.get("mimeType", "text/plain"),
                    raw_bytes=record["body"].encode("utf-8"),
                    metadata=record.get("metadata", {}),
                )
                if result["status"] == "failed":
                    failed += 1
                    errors.append(
                        {
                            "connector": record["sourceType"],
                            "code": result.get("code", "sync_ingest_failed"),
                            "message": result.get("message", "Failed to sync connector source."),
                        }
                    )
                    continue
                accepted += 1
                if result["duplicate"]:
                    duplicated += 1

            degraded_reason = await self._try_ai_synthesis_preflight(
                user_id=user_id,
                include_ai_synthesis=include_ai_synthesis,
            )
            await self._rebuild_recommendations(user_id=user_id, project_id=project_id)
            summary = {
                "accepted": accepted,
                "failed": failed,
                "duplicated": duplicated,
                "errors": errors,
                "connectors": list(selected),
                "degradedReason": degraded_reason,
            }
            status = "degraded" if degraded_reason else "completed"
            job = await self.store.update_job(
                user_id=user_id,
                project_id=project_id,
                job_id=job["id"],
                status=status,
                summary=summary,
            )
            return {
                "projectId": project_id,
                "job": job,
                "accepted": accepted,
                "failed": failed,
                "duplicated": duplicated,
                "errors": errors,
            }
        except Exception as exc:
            job = await self.store.update_job(
                user_id=user_id,
                project_id=project_id,
                job_id=job["id"],
                status="failed",
                summary={"accepted": accepted, "failed": failed, "duplicated": duplicated},
                error_code="project_intelligence_sync_failed",
                error_message=str(exc),
            )
            return {
                "projectId": project_id,
                "job": job,
                "accepted": accepted,
                "failed": failed + 1,
                "duplicated": duplicated,
                "errors": [{"code": "project_intelligence_sync_failed", "message": "Sync failed."}],
            }

    async def remove_source(self, *, user_id: str, project_id: str, source_id: str) -> bool:
        removed = await self.store.mark_source_removed(
            user_id=user_id,
            project_id=project_id,
            source_id=source_id,
        )
        if removed:
            await self._rebuild_recommendations(user_id=user_id, project_id=project_id)
        return removed

    async def provider_readiness(self, *, user_id: str, project_id: str) -> dict[str, Any]:
        sources = await self.store.list_sources(user_id=user_id, project_id=project_id, limit=500)
        facts = await self.store.list_facts(user_id=user_id, project_id=project_id, limit=500)
        return build_provider_readiness(project_id=project_id, sources=sources, facts=facts)

    async def add_recommendation_to_idea_pool(
        self,
        *,
        user_id: str,
        project_id: str,
        recommendation_id: str,
    ) -> dict[str, Any]:
        recommendation = await self.store.get_recommendation(
            user_id=user_id,
            project_id=project_id,
            recommendation_id=recommendation_id,
        )
        if not recommendation:
            raise RuntimeError("Recommendation not found")

        svc = get_status_service()
        existing, _ = svc.list_ideas(
            source="project_intelligence",
            project_id=project_id,
            user_id=user_id,
            limit=500,
            offset=0,
        )
        stable_key = str(recommendation["recommendationKey"])
        for item in existing:
            raw = item.get("raw_data") or {}
            if str(raw.get("recommendation_key") or "") == stable_key:
                await self.store.update_recommendation_status(
                    user_id=user_id,
                    project_id=project_id,
                    recommendation_id=recommendation_id,
                    status="applied",
                )
                return {
                    "projectId": project_id,
                    "recommendationId": recommendation_id,
                    "action": "reused",
                    "ideaId": item.get("id"),
                    "message": "Recommendation already exists in Idea Pool.",
                }

        created = svc.create_idea(
            source="project_intelligence",
            title=str(recommendation["title"]),
            raw_data={
                "recommendation_key": stable_key,
                "recommendation_type": recommendation.get("recommendationType"),
                "summary": recommendation.get("summary"),
                "rationale": recommendation.get("rationale"),
                "evidence_ids": recommendation.get("evidenceIds") or [],
                "project_id": project_id,
                "source": "project_intelligence",
            },
            seo_signals={"source": "project_intelligence"},
            tags=["project-intelligence"],
            priority_score=float(recommendation.get("confidence") or 0.0),
            project_id=project_id,
            user_id=user_id,
        )
        await self.store.update_recommendation_status(
            user_id=user_id,
            project_id=project_id,
            recommendation_id=recommendation_id,
            status="applied",
        )
        return {
            "projectId": project_id,
            "recommendationId": recommendation_id,
            "action": "created",
            "ideaId": created.get("id"),
            "message": "Recommendation added to Idea Pool.",
        }

    async def _try_ai_synthesis_preflight(self, *, user_id: str, include_ai_synthesis: bool) -> str | None:
        if not include_ai_synthesis:
            return None
        try:
            await ai_runtime_service.preflight_providers(
                user_id=user_id,
                route="project_intelligence.recommendations",
                required_providers=["openrouter"],
            )
            return None
        except AIRuntimeServiceError as exc:
            detail = exc.detail if isinstance(exc.detail, dict) else {}
            message = str(detail.get("message") or "AI synthesis unavailable.")
            return message

    async def _rebuild_recommendations(self, *, user_id: str, project_id: str) -> list[dict[str, Any]]:
        sources = await self.store.list_sources(user_id=user_id, project_id=project_id, limit=500)
        facts = await self.store.list_facts(user_id=user_id, project_id=project_id, limit=500)
        duplicates = await self.store.list_duplicates(user_id=user_id, project_id=project_id, limit=500)
        recommendations = build_recommendations(
            user_id=user_id,
            project_id=project_id,
            sources=sources,
            facts=facts,
            duplicates=duplicates,
        )
        await self.store.clear_recommendations(user_id=user_id, project_id=project_id)
        return await self.store.upsert_recommendations(recommendations)

    async def _ingest_text_source(
        self,
        *,
        user_id: str,
        project_id: str,
        source_type: str,
        source_label: str,
        source_origin: str | None,
        mime_type: str,
        raw_bytes: bytes,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        if not raw_bytes:
            return {"status": "failed", "code": "empty_file", "message": "Source content is empty.", "duplicate": False}
        processed = extract_text(raw_bytes, mime_type, source_origin)
        if not processed.text:
            return {"status": "failed", "code": "empty_after_cleaning", "message": "No text content found.", "duplicate": False}

        source_hash = sha256_text(f"{source_type}:{source_origin or ''}:{processed.normalized_hash}")
        existing_source = await self.store.find_source(
            user_id=user_id,
            project_id=project_id,
            source_type=source_type,
            origin_ref=source_origin,
            content_hash=source_hash,
        )
        if existing_source:
            return {
                "status": "ok",
                "duplicate": True,
                "sourceId": existing_source["id"],
                "documentId": None,
            }

        source = await self.store.create_source(
            user_id=user_id,
            project_id=project_id,
            source_type=source_type,
            source_label=source_label,
            status="ingested",
            origin_ref=source_origin,
            content_hash=source_hash,
            summary_text=processed.snippet,
            metadata=metadata,
        )
        exact_duplicate = await self.store.get_document_by_normalized_hash(
            user_id=user_id,
            project_id=project_id,
            normalized_hash=processed.normalized_hash,
        )
        canonical_document_id: str | None = None
        near_duplicate_score: float | None = None
        duplicate_kind: str | None = None

        if exact_duplicate:
            canonical_document_id = exact_duplicate["id"]
            near_duplicate_score = 1.0
            duplicate_kind = "exact"
        else:
            existing_documents = await self.store.list_documents(user_id=user_id, project_id=project_id, limit=120)
            for doc in existing_documents:
                score = similarity_score(processed.text, str(doc.get("textBody") or ""))
                if score >= 0.92:
                    canonical_document_id = doc["id"]
                    near_duplicate_score = score
                    duplicate_kind = "near"
                    break

        is_duplicate = canonical_document_id is not None
        document = await self.store.create_document(
            source_id=source["id"],
            user_id=user_id,
            project_id=project_id,
            title=source_origin or source_label,
            mime_type=mime_type,
            file_name=source_origin,
            content_hash=processed.raw_hash,
            normalized_hash=processed.normalized_hash,
            text_body=processed.text,
            snippet=processed.snippet,
            char_count=processed.char_count,
            is_duplicate=is_duplicate,
            canonical_document_id=canonical_document_id,
            near_duplicate_score=near_duplicate_score,
        )

        if is_duplicate and canonical_document_id:
            await self.store.create_duplicate(
                user_id=user_id,
                project_id=project_id,
                document_id=document["id"],
                canonical_document_id=canonical_document_id,
                kind=duplicate_kind or "exact",
                similarity=float(near_duplicate_score or 1.0),
                reason=f"{duplicate_kind or 'exact'} duplicate detected",
            )
            return {
                "status": "ok",
                "duplicate": True,
                "sourceId": source["id"],
                "documentId": document["id"],
            }

        chunk_payloads = build_chunks(processed.text)
        chunks = await self.store.create_chunks(
            [
                {
                    "documentId": document["id"],
                    "sourceId": source["id"],
                    "userId": user_id,
                    "projectId": project_id,
                    "orderIndex": chunk.order_index,
                    "startOffset": chunk.start_offset,
                    "endOffset": chunk.end_offset,
                    "text": chunk.text,
                    "contentHash": chunk.content_hash,
                }
                for chunk in chunk_payloads
            ]
        )
        facts = extract_facts_from_chunks(
            user_id=user_id,
            project_id=project_id,
            source_id=source["id"],
            document_id=document["id"],
            chunks=chunks,
        )
        if facts:
            await self.store.create_facts(facts)
        return {
            "status": "ok",
            "duplicate": False,
            "sourceId": source["id"],
            "documentId": document["id"],
        }

    async def _build_connector_records(
        self,
        *,
        user_id: str,
        project_id: str,
        project_payload: dict[str, Any],
        connectors: tuple[str, ...],
    ) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []

        if "project_profile" in connectors:
            project_text = json.dumps(project_payload, ensure_ascii=True, default=str)
            out.append(
                {
                    "sourceType": "project_profile",
                    "sourceLabel": "Project Profile",
                    "originRef": f"project:{project_id}",
                    "mimeType": "application/json",
                    "body": project_text,
                    "metadata": {"connector": "project_profile"},
                }
            )

        if "work_domains" in connectors:
            domains = await user_data_store.list_work_domains(user_id, project_id)
            if domains:
                out.append(
                    {
                        "sourceType": "work_domain",
                        "sourceLabel": "Work Domains",
                        "originRef": f"work-domains:{project_id}",
                        "mimeType": "application/json",
                        "body": json.dumps(domains[:MAX_CONNECTOR_ITEMS], ensure_ascii=True, default=str),
                        "metadata": {"connector": "work_domains", "count": min(len(domains), MAX_CONNECTOR_ITEMS)},
                    }
                )

        if "creator_profile" in connectors:
            creator = await user_data_store.get_creator_profile(user_id, project_id)
            if creator:
                out.append(
                    {
                        "sourceType": "creator_profile",
                        "sourceLabel": "Creator Profile",
                        "originRef": f"creator-profile:{project_id}",
                        "mimeType": "application/json",
                        "body": json.dumps(creator, ensure_ascii=True, default=str),
                        "metadata": {"connector": "creator_profile"},
                    }
                )

        if "personas" in connectors:
            personas = await user_data_store.list_personas(user_id, project_id)
            if personas:
                capped = personas[:CONNECTOR_MAX_PERSONAS]
                out.append(
                    {
                        "sourceType": "persona",
                        "sourceLabel": "Personas",
                        "originRef": f"personas:{project_id}",
                        "mimeType": "application/json",
                        "body": json.dumps(capped, ensure_ascii=True, default=str),
                        "metadata": {"connector": "personas", "count": len(capped)},
                    }
                )

        if "search_console" in connectors:
            connection = await search_console_store.get_connection(user_id, project_id)
            property_url = (connection or {}).get("propertyUrl") if connection else None
            if property_url:
                imported_opportunities = 0
                for period in CONNECTOR_PERIODS:
                    snapshot = await search_console_store.get_snapshot(user_id, project_id, str(property_url), period)
                    if not snapshot:
                        continue
                    google_payload = snapshot.get("googleSearchPayload") or {}
                    opportunities = google_payload.get("opportunities") if isinstance(google_payload, dict) else []
                    if isinstance(opportunities, list):
                        imported_opportunities += len(opportunities)
                    out.append(
                        {
                            "sourceType": "search_console_snapshot",
                            "sourceLabel": "Search Console Snapshot",
                            "originRef": f"search-console:{property_url}:{period}",
                            "mimeType": "application/json",
                            "body": json.dumps(
                                {
                                    "propertyUrl": property_url,
                                    "period": period,
                                    "status": snapshot.get("status"),
                                    "isPartial": snapshot.get("isPartial"),
                                    "googleSummary": google_payload.get("overview") if isinstance(google_payload, dict) else None,
                                    "opportunities": (opportunities or [])[:CONNECTOR_MAX_SEARCH_CONSOLE_OPPS],
                                },
                                ensure_ascii=True,
                                default=str,
                            ),
                            "metadata": {"connector": "search_console", "period": period},
                        }
                    )
                if imported_opportunities > CONNECTOR_MAX_SEARCH_CONSOLE_OPPS:
                    out.append(
                        {
                            "sourceType": "search_console_opportunity",
                            "sourceLabel": "Search Console Opportunity Cap",
                            "originRef": f"search-console-cap:{project_id}",
                            "mimeType": "text/plain",
                            "body": (
                                f"Connector cap applied at {CONNECTOR_MAX_SEARCH_CONSOLE_OPPS} opportunities. "
                                f"Imported opportunities: {CONNECTOR_MAX_SEARCH_CONSOLE_OPPS}."
                            ),
                            "metadata": {"connector": "search_console", "capApplied": True},
                        }
                    )

        status_service = get_status_service()
        if "idea_pool" in connectors:
            ideas, _ = status_service.list_ideas(
                project_id=project_id,
                user_id=user_id,
                limit=CONNECTOR_MAX_IDEAS,
                offset=0,
            )
            if ideas:
                out.append(
                    {
                        "sourceType": "idea_pool",
                        "sourceLabel": "Idea Pool",
                        "originRef": f"idea-pool:{project_id}",
                        "mimeType": "application/json",
                        "body": json.dumps(ideas, ensure_ascii=True, default=str),
                        "metadata": {"connector": "idea_pool", "count": len(ideas), "cap": CONNECTOR_MAX_IDEAS},
                    }
                )

        if "project_assets" in connectors:
            assets = status_service.list_project_assets(
                project_id=project_id,
                user_id=user_id,
                limit=CONNECTOR_MAX_PROJECT_ASSETS,
                offset=0,
            )
            if assets:
                rows = [asset.model_dump(mode="json") for asset in assets]
                out.append(
                    {
                        "sourceType": "project_asset",
                        "sourceLabel": "Project Assets Metadata",
                        "originRef": f"project-assets:{project_id}",
                        "mimeType": "application/json",
                        "body": json.dumps(rows, ensure_ascii=True, default=str),
                        "metadata": {
                            "connector": "project_assets",
                            "count": len(rows),
                            "cap": CONNECTOR_MAX_PROJECT_ASSETS,
                        },
                    }
                )

        return out


project_intelligence_service = ProjectIntelligenceService()
