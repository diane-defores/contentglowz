"""Authenticated CRUD endpoints for project-scoped brand profiles."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.dependencies.auth import CurrentUser, require_current_user
from api.dependencies.ownership import require_owned_project_id
from api.models.brand_profile import (
    BrandProfileCreateRequest,
    BrandProfileResponse,
    BrandProfileUpdateRequest,
)
from api.services.brand_profile_store import brand_profile_store

router = APIRouter(prefix="/api/brand-profiles", tags=["Brand Profiles"])


@router.get("", response_model=list[BrandProfileResponse], summary="List brand profiles")
async def list_brand_profiles(
    projectId: str = Query(...),
    current_user: CurrentUser = Depends(require_current_user),
) -> list[BrandProfileResponse]:
    await require_owned_project_id(projectId, current_user)
    profiles = await brand_profile_store.list_brand_profiles(
        user_id=current_user.user_id,
        project_id=projectId,
    )
    return [BrandProfileResponse(**profile) for profile in profiles]


@router.post("", response_model=BrandProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_brand_profile(
    request: BrandProfileCreateRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> BrandProfileResponse:
    await require_owned_project_id(request.project_id, current_user)
    created = await brand_profile_store.create_brand_profile(
        user_id=current_user.user_id,
        payload=request.to_canonical_dict(),
    )
    return BrandProfileResponse(**created)


@router.get("/{brand_profile_id}", response_model=BrandProfileResponse)
async def get_brand_profile(
    brand_profile_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> BrandProfileResponse:
    profile = await brand_profile_store.get_brand_profile(
        brand_profile_id=brand_profile_id,
        user_id=current_user.user_id,
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    return BrandProfileResponse(**profile)


@router.patch("/{brand_profile_id}", response_model=BrandProfileResponse)
async def update_brand_profile(
    brand_profile_id: str,
    request: BrandProfileUpdateRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> BrandProfileResponse:
    updated = await brand_profile_store.update_brand_profile(
        brand_profile_id=brand_profile_id,
        user_id=current_user.user_id,
        payload=request.to_canonical_dict(),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    return BrandProfileResponse(**updated)


@router.delete("/{brand_profile_id}", status_code=status.HTTP_200_OK)
async def delete_brand_profile(
    brand_profile_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> dict[str, object]:
    deleted = await brand_profile_store.delete_brand_profile(
        brand_profile_id=brand_profile_id,
        user_id=current_user.user_id,
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    return {"success": True, "id": brand_profile_id}
