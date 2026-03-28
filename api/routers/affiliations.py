"""Authenticated affiliate link endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query

from api.dependencies.auth import CurrentUser, require_current_user
from api.models.affiliations import (
    AffiliateLinkCreateRequest,
    AffiliateLinkResponse,
    AffiliateLinkUpdateRequest,
)
from api.services.user_data_store import user_data_store

router = APIRouter(prefix="/api/affiliations", tags=["Affiliations"])


@router.get("", response_model=list[AffiliateLinkResponse], summary="List affiliate links")
async def list_affiliations(
    projectId: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_current_user),
) -> list[AffiliateLinkResponse]:
    affiliations = await user_data_store.list_affiliations(current_user.user_id, projectId)
    return [AffiliateLinkResponse(**a) for a in affiliations]


@router.post("", response_model=AffiliateLinkResponse, status_code=201, summary="Create affiliate link")
async def create_affiliation(
    request: AffiliateLinkCreateRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> AffiliateLinkResponse:
    affiliation = await user_data_store.create_affiliation(
        current_user.user_id,
        request.model_dump(exclude_unset=True),
    )
    return AffiliateLinkResponse(**affiliation)


@router.get("/{affiliation_id}", response_model=AffiliateLinkResponse, summary="Get affiliate link")
async def get_affiliation(
    affiliation_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> AffiliateLinkResponse:
    affiliation = await user_data_store.get_affiliation(current_user.user_id, affiliation_id)
    if not affiliation:
        raise HTTPException(status_code=404, detail="Affiliate link not found")
    return AffiliateLinkResponse(**affiliation)


@router.put("/{affiliation_id}", response_model=AffiliateLinkResponse, summary="Update affiliate link")
async def update_affiliation(
    affiliation_id: str,
    request: AffiliateLinkUpdateRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> AffiliateLinkResponse:
    affiliation = await user_data_store.update_affiliation(
        current_user.user_id,
        affiliation_id,
        request.model_dump(exclude_unset=True),
    )
    if not affiliation:
        raise HTTPException(status_code=404, detail="Affiliate link not found")
    return AffiliateLinkResponse(**affiliation)


@router.delete("/{affiliation_id}", summary="Delete affiliate link")
async def delete_affiliation(
    affiliation_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> dict:
    deleted = await user_data_store.delete_affiliation(current_user.user_id, affiliation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Affiliate link not found")
    return {"success": True, "id": affiliation_id}
