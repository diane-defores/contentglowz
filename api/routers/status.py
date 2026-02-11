"""Content status management endpoints."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from api.models.status import (
    CreateContentRequest,
    UpdateContentRequest,
    TransitionRequest,
    ContentResponse,
    StatusChangeResponse,
    StatsResponse,
    ContentListResponse,
    WorkDomainResponse,
    UpdateDomainRequest,
)
from status.service import (
    get_status_service,
    InvalidTransitionError,
    ContentNotFoundError,
)

router = APIRouter(prefix="/api/status", tags=["Status"])


def _record_to_response(record) -> ContentResponse:
    """Convert a ContentRecord to a ContentResponse."""
    return ContentResponse(
        id=record.id,
        title=record.title,
        content_type=record.content_type,
        source_robot=record.source_robot,
        status=record.status,
        project_id=record.project_id,
        content_path=record.content_path,
        content_preview=record.content_preview,
        content_hash=record.content_hash,
        priority=record.priority,
        tags=record.tags,
        metadata=record.metadata,
        target_url=record.target_url,
        reviewer_note=record.reviewer_note,
        reviewed_by=record.reviewed_by,
        created_at=record.created_at,
        updated_at=record.updated_at,
        scheduled_for=record.scheduled_for,
        published_at=record.published_at,
        synced_at=record.synced_at,
    )


# ─── Content CRUD ─────────────────────────────────────


@router.get(
    "/content",
    response_model=ContentListResponse,
    summary="List content records",
    description="List content records with optional filters by status, type, robot, and project",
)
async def list_content(
    status: Optional[str] = Query(None, description="Filter by status"),
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    source_robot: Optional[str] = Query(None, description="Filter by source robot"),
    project_id: Optional[str] = Query(None, description="Filter by project"),
    limit: int = Query(50, ge=1, le=200, description="Max results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    """List content records with filters."""
    svc = get_status_service()
    items = svc.list_content(
        status=status,
        content_type=content_type,
        source_robot=source_robot,
        project_id=project_id,
        limit=limit,
        offset=offset,
    )
    return ContentListResponse(
        items=[_record_to_response(r) for r in items],
        total=len(items),
    )


@router.post(
    "/content",
    response_model=ContentResponse,
    status_code=201,
    summary="Create content record",
    description="Create a new content record to track through the lifecycle",
)
async def create_content(request: CreateContentRequest):
    """Create a new content record."""
    svc = get_status_service()
    try:
        record = svc.create_content(
            title=request.title,
            content_type=request.content_type,
            source_robot=request.source_robot,
            status=request.status,
            project_id=request.project_id,
            content_path=request.content_path,
            content_preview=request.content_preview,
            priority=request.priority,
            tags=request.tags,
            metadata=request.metadata,
            target_url=request.target_url,
        )
        return _record_to_response(record)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/content/{content_id}",
    response_model=ContentResponse,
    summary="Get content record",
    description="Get a single content record by ID",
)
async def get_content(content_id: str):
    """Get a content record by ID."""
    svc = get_status_service()
    try:
        record = svc.get_content(content_id)
        return _record_to_response(record)
    except ContentNotFoundError:
        raise HTTPException(status_code=404, detail=f"Content {content_id} not found")


@router.patch(
    "/content/{content_id}",
    response_model=ContentResponse,
    summary="Update content record",
    description="Update content record fields (use /transition for status changes)",
)
async def update_content(content_id: str, request: UpdateContentRequest):
    """Update a content record's metadata."""
    svc = get_status_service()
    try:
        updates = request.model_dump(exclude_none=True)
        record = svc.update_content(content_id, **updates)
        return _record_to_response(record)
    except ContentNotFoundError:
        raise HTTPException(status_code=404, detail=f"Content {content_id} not found")


# ─── Status Transitions ───────────────────────────────


@router.post(
    "/content/{content_id}/transition",
    response_model=ContentResponse,
    summary="Transition content status",
    description="Change content status with validation and audit trail",
)
async def transition_content(content_id: str, request: TransitionRequest):
    """Transition a content record to a new status."""
    svc = get_status_service()
    try:
        record = svc.transition(
            content_id=content_id,
            to_status=request.to_status,
            changed_by=request.changed_by,
            reason=request.reason,
        )
        return _record_to_response(record)
    except ContentNotFoundError:
        raise HTTPException(status_code=404, detail=f"Content {content_id} not found")
    except InvalidTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/content/{content_id}/history",
    response_model=List[StatusChangeResponse],
    summary="Get content history",
    description="Get the full audit trail of status changes for a content record",
)
async def get_content_history(content_id: str):
    """Get the audit trail for a content record."""
    svc = get_status_service()
    try:
        svc.get_content(content_id)  # Ensure exists
    except ContentNotFoundError:
        raise HTTPException(status_code=404, detail=f"Content {content_id} not found")

    history = svc.get_history(content_id)
    return [
        StatusChangeResponse(
            id=h.id,
            content_id=h.content_id,
            from_status=h.from_status,
            to_status=h.to_status,
            changed_by=h.changed_by,
            reason=h.reason,
            timestamp=h.timestamp,
        )
        for h in history
    ]


# ─── Statistics ────────────────────────────────────────


@router.get(
    "/stats",
    response_model=StatsResponse,
    summary="Get content statistics",
    description="Get content counts grouped by status",
)
async def get_stats(
    project_id: Optional[str] = Query(None, description="Filter by project"),
):
    """Get content statistics."""
    svc = get_status_service()
    return svc.get_stats(project_id=project_id)


# ─── Work Domains ──────────────────────────────────────


@router.get(
    "/domains",
    response_model=List[WorkDomainResponse],
    summary="Get work domains",
    description="Get work domain states, optionally filtered by project",
)
async def get_domains(
    project_id: Optional[str] = Query(None, description="Filter by project"),
):
    """Get work domain records."""
    svc = get_status_service()
    domains = svc.get_domains(project_id=project_id)
    return [
        WorkDomainResponse(
            id=d.id,
            project_id=d.project_id,
            domain=d.domain,
            status=d.status,
            last_run_at=d.last_run_at,
            last_run_status=d.last_run_status,
            items_pending=d.items_pending,
            items_completed=d.items_completed,
            metadata=d.metadata,
            updated_at=d.updated_at,
        )
        for d in domains
    ]


@router.patch(
    "/domains/{project_id}/{domain}",
    response_model=WorkDomainResponse,
    summary="Update work domain",
    description="Create or update a work domain record for a project",
)
async def update_domain(
    project_id: str,
    domain: str,
    request: UpdateDomainRequest,
):
    """Update a work domain record."""
    svc = get_status_service()
    updates = request.model_dump(exclude_none=True)
    record = svc.upsert_domain(project_id=project_id, domain=domain, **updates)
    return WorkDomainResponse(
        id=record.id,
        project_id=record.project_id,
        domain=record.domain,
        status=record.status,
        last_run_at=record.last_run_at,
        last_run_status=record.last_run_status,
        items_pending=record.items_pending,
        items_completed=record.items_completed,
        metadata=record.metadata,
        updated_at=record.updated_at,
    )


# ─── Sync ──────────────────────────────────────────────


@router.post(
    "/sync/push",
    summary="Trigger manual sync push",
    description="Manually push unsynced records to Turso",
)
async def trigger_sync_push():
    """Manually trigger a sync push to Turso."""
    try:
        from status.sync import get_sync_service
        sync_svc = get_sync_service()
        result = await sync_svc.push()
        return result
    except ImportError:
        raise HTTPException(status_code=500, detail="Sync service not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@router.post(
    "/sync/pull",
    summary="Trigger manual sync pull",
    description="Manually pull review actions from Turso",
)
async def trigger_sync_pull():
    """Manually trigger a sync pull from Turso."""
    try:
        from status.sync import get_sync_service
        sync_svc = get_sync_service()
        result = await sync_svc.pull()
        return result
    except ImportError:
        raise HTTPException(status_code=500, detail="Sync service not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


# ─── Migration ─────────────────────────────────────────


@router.post(
    "/migrate/newsletter-history",
    summary="Migrate newsletter localStorage history",
    description="Import newsletter history items as ContentRecord with status PUBLISHED",
)
async def migrate_newsletter_history(items: list):
    """
    Migrate newsletter history from localStorage to ContentRecord.
    Expects a list of items with: subject_line, word_count, created_at, preview_text.
    """
    svc = get_status_service()
    migrated = 0

    for item in items:
        try:
            record = svc.create_content(
                title=item.get("subject_line", "Untitled Newsletter"),
                content_type="newsletter",
                source_robot="newsletter",
                status="todo",
                metadata={
                    "word_count": item.get("word_count", 0),
                    "preview_text": item.get("preview_text", ""),
                    "migrated_from": "localStorage",
                    "original_id": item.get("id"),
                },
                content_preview=item.get("preview_text"),
            )
            # Fast-track through the lifecycle to published
            svc.transition(record.id, "in_progress", "migration")
            svc.transition(record.id, "generated", "migration")
            svc.transition(record.id, "pending_review", "migration")
            svc.transition(record.id, "approved", "migration", reason="Auto-approved: migrated from history")
            svc.transition(record.id, "publishing", "migration")
            svc.transition(record.id, "published", "migration", reason="Migrated from localStorage")
            migrated += 1
        except Exception as e:
            print(f"Failed to migrate item: {e}")

    return {"migrated": migrated, "total": len(items)}
