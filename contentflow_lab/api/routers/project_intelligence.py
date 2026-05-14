from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from api.dependencies.auth import CurrentUser, require_current_user
from api.models.project_intelligence import (
    ProjectIntelligenceAddToIdeaPoolResponse,
    ProjectIntelligenceDocument,
    ProjectIntelligenceDocumentListResponse,
    ProjectIntelligenceFact,
    ProjectIntelligenceFactListResponse,
    ProjectIntelligenceJob,
    ProjectIntelligenceJobListResponse,
    ProjectIntelligenceProviderReadiness,
    ProjectIntelligenceRecommendation,
    ProjectIntelligenceRecommendationListResponse,
    ProjectIntelligenceSource,
    ProjectIntelligenceSourceListResponse,
    ProjectIntelligenceStatusResponse,
    ProjectIntelligenceSyncRequest,
    ProjectIntelligenceUploadResult,
)
from api.routers.projects import require_owned_project
from api.services.project_intelligence_processor import MAX_FILES_PER_JOB, validate_upload
from api.services.project_intelligence_service import UploadPayload, project_intelligence_service


router = APIRouter(
    prefix="/api/projects/{project_id}/intelligence",
    tags=["Project Intelligence"],
)


def _job_model(payload: dict[str, Any]) -> ProjectIntelligenceJob:
    return ProjectIntelligenceJob(**payload)


def _source_model(payload: dict[str, Any]) -> ProjectIntelligenceSource:
    return ProjectIntelligenceSource(**payload)


def _document_model(payload: dict[str, Any]) -> ProjectIntelligenceDocument:
    return ProjectIntelligenceDocument(**payload)


def _fact_model(payload: dict[str, Any]) -> ProjectIntelligenceFact:
    return ProjectIntelligenceFact(**payload)


def _recommendation_model(payload: dict[str, Any]) -> ProjectIntelligenceRecommendation:
    return ProjectIntelligenceRecommendation(**payload)


@router.get("/status", response_model=ProjectIntelligenceStatusResponse)
async def get_status(
    project_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceStatusResponse:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    payload = await project_intelligence_service.get_status(
        user_id=current_user.user_id,
        project_id=project_id,
    )
    if payload.get("activeJob"):
        payload["activeJob"] = _job_model(payload["activeJob"])
    if payload.get("lastJob"):
        payload["lastJob"] = _job_model(payload["lastJob"])
    return ProjectIntelligenceStatusResponse(**payload)


@router.post("/upload", response_model=ProjectIntelligenceUploadResult)
async def upload_sources(
    project_id: str,
    files: list[UploadFile] = File(...),
    include_ai_synthesis: bool = Query(False, alias="includeAiSynthesis"),
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceUploadResult:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    if len(files) > MAX_FILES_PER_JOB:
        raise HTTPException(
            status_code=400,
            detail=f"At most {MAX_FILES_PER_JOB} files are allowed per ingestion job.",
        )

    valid_uploads: list[UploadPayload] = []
    pre_errors: list[dict[str, Any]] = []
    for file in files:
        body = await file.read()
        error_code = validate_upload(file.filename, file.content_type, len(body))
        if error_code:
            pre_errors.append(
                {
                    "fileName": file.filename or "unnamed",
                    "code": error_code,
                    "message": "Upload rejected by validation rules.",
                }
            )
            continue
        valid_uploads.append(
            UploadPayload(
                file_name=file.filename or "upload.txt",
                content_type=(file.content_type or "text/plain"),
                body=body,
            )
        )

    result = await project_intelligence_service.ingest_uploads(
        user_id=current_user.user_id,
        project_id=project_id,
        uploads=valid_uploads,
        include_ai_synthesis=include_ai_synthesis,
    )
    result["failed"] = int(result.get("failed", 0)) + len(pre_errors)
    result_errors = list(result.get("errors", []))
    result_errors.extend(pre_errors)
    result["errors"] = result_errors
    result["job"] = _job_model(result["job"])
    return ProjectIntelligenceUploadResult(**result)


@router.post("/sync", response_model=ProjectIntelligenceUploadResult)
async def sync_connectors(
    project_id: str,
    request: ProjectIntelligenceSyncRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceUploadResult:
    project = await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    payload = await project_intelligence_service.sync_connectors(
        user_id=current_user.user_id,
        project_id=project_id,
        project_payload=project.model_dump(mode="json", by_alias=True),
        connectors=request.connectors,
        include_ai_synthesis=request.include_ai_synthesis,
    )
    payload["job"] = _job_model(payload["job"])
    return ProjectIntelligenceUploadResult(**payload)


@router.get("/jobs", response_model=ProjectIntelligenceJobListResponse)
async def list_jobs(
    project_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceJobListResponse:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    items = await project_intelligence_service.list_jobs(
        user_id=current_user.user_id,
        project_id=project_id,
    )
    return ProjectIntelligenceJobListResponse(
        items=[_job_model(item) for item in items],
        total=len(items),
    )


@router.get("/jobs/{job_id}", response_model=ProjectIntelligenceJob)
async def get_job(
    project_id: str,
    job_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceJob:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    payload = await project_intelligence_service.get_job(
        user_id=current_user.user_id,
        project_id=project_id,
        job_id=job_id,
    )
    if not payload:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_model(payload)


@router.get("/sources", response_model=ProjectIntelligenceSourceListResponse)
async def list_sources(
    project_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceSourceListResponse:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    items = await project_intelligence_service.list_sources(
        user_id=current_user.user_id,
        project_id=project_id,
    )
    return ProjectIntelligenceSourceListResponse(
        items=[_source_model(item) for item in items],
        total=len(items),
    )


@router.delete("/sources/{source_id}", response_model=dict)
async def remove_source(
    project_id: str,
    source_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> dict[str, Any]:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    removed = await project_intelligence_service.remove_source(
        user_id=current_user.user_id,
        project_id=project_id,
        source_id=source_id,
    )
    if not removed:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"removed": True, "sourceId": source_id, "projectId": project_id}


@router.get("/documents", response_model=ProjectIntelligenceDocumentListResponse)
async def list_documents(
    project_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceDocumentListResponse:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    items = await project_intelligence_service.list_documents(
        user_id=current_user.user_id,
        project_id=project_id,
    )
    return ProjectIntelligenceDocumentListResponse(
        items=[_document_model(item) for item in items],
        total=len(items),
    )


@router.get("/facts", response_model=ProjectIntelligenceFactListResponse)
async def list_facts(
    project_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceFactListResponse:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    items = await project_intelligence_service.list_facts(
        user_id=current_user.user_id,
        project_id=project_id,
    )
    return ProjectIntelligenceFactListResponse(
        items=[_fact_model(item) for item in items],
        total=len(items),
    )


@router.get("/recommendations", response_model=ProjectIntelligenceRecommendationListResponse)
async def list_recommendations(
    project_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceRecommendationListResponse:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    items = await project_intelligence_service.list_recommendations(
        user_id=current_user.user_id,
        project_id=project_id,
    )
    return ProjectIntelligenceRecommendationListResponse(
        items=[_recommendation_model(item) for item in items],
        total=len(items),
    )


@router.get("/provider-readiness", response_model=ProjectIntelligenceProviderReadiness)
async def provider_readiness(
    project_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceProviderReadiness:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    payload = await project_intelligence_service.provider_readiness(
        user_id=current_user.user_id,
        project_id=project_id,
    )
    return ProjectIntelligenceProviderReadiness(**payload)


@router.post(
    "/recommendations/{recommendation_id}/idea-pool",
    response_model=ProjectIntelligenceAddToIdeaPoolResponse,
)
async def add_recommendation_to_idea_pool(
    project_id: str,
    recommendation_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> ProjectIntelligenceAddToIdeaPoolResponse:
    await require_owned_project(project_id, current_user, allow_archived=False, allow_deleted=False)
    try:
        payload = await project_intelligence_service.add_recommendation_to_idea_pool(
            user_id=current_user.user_id,
            project_id=project_id,
            recommendation_id=recommendation_id,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ProjectIntelligenceAddToIdeaPoolResponse(**payload)
