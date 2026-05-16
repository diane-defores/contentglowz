"""Authenticated work domain endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query

from api.dependencies.auth import CurrentUser, require_current_user
from api.models.work_domains import (
    WorkDomainCreateRequest,
    WorkDomainResponse,
    WorkDomainUpdateRequest,
)
from api.services.user_data_store import user_data_store

router = APIRouter(prefix="/api/work-domains", tags=["Work Domains"])


@router.get("", response_model=list[WorkDomainResponse], summary="List work domains")
async def list_work_domains(
    projectId: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_current_user),
) -> list[WorkDomainResponse]:
    domains = await user_data_store.list_work_domains(current_user.user_id, projectId)
    return [WorkDomainResponse(**d) for d in domains]


@router.post("", response_model=WorkDomainResponse, status_code=201, summary="Create work domain")
async def create_work_domain(
    request: WorkDomainCreateRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> WorkDomainResponse:
    domain = await user_data_store.create_work_domain(
        current_user.user_id,
        request.model_dump(exclude_unset=True),
    )
    return WorkDomainResponse(**domain)


@router.put("/{domain_id}", response_model=WorkDomainResponse, summary="Update work domain")
async def update_work_domain(
    domain_id: str,
    request: WorkDomainUpdateRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> WorkDomainResponse:
    domain = await user_data_store.update_work_domain(
        current_user.user_id,
        domain_id,
        request.model_dump(exclude_unset=True),
    )
    if not domain:
        raise HTTPException(status_code=404, detail="Work domain not found")
    return WorkDomainResponse(**domain)
