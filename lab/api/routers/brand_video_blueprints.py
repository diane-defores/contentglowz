"""Authenticated CRUD endpoints for project-scoped brand video blueprints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from api.dependencies.auth import CurrentUser, require_current_user
from api.dependencies.ownership import require_owned_project_id
from api.models.brand_video_blueprint import (
    BrandVideoBlueprintCreateRequest,
    BrandVideoBlueprintResponse,
    BrandVideoBlueprintUpdateRequest,
)
from api.services.brand_profile_store import brand_profile_store
from api.services.brand_video_blueprint_store import brand_video_blueprint_store

router = APIRouter(prefix="/api/brand-video-blueprints", tags=["Brand Video Blueprints"])


async def _require_owned_brand_profile_for_project(
    *,
    current_user: CurrentUser,
    project_id: str,
    brand_profile_id: str,
) -> dict:
    profile = await brand_profile_store.get_brand_profile(
        brand_profile_id=brand_profile_id,
        user_id=current_user.user_id,
    )
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand profile not found")
    if profile["project_id"] != project_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Brand profile does not belong to the requested project",
        )
    return profile


@router.get("", response_model=list[BrandVideoBlueprintResponse], summary="List brand video blueprints")
async def list_brand_video_blueprints(
    projectId: str = Query(..., min_length=1),
    brandProfileId: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_current_user),
) -> list[BrandVideoBlueprintResponse]:
    await require_owned_project_id(projectId, current_user)
    if brandProfileId:
        await _require_owned_brand_profile_for_project(
            current_user=current_user,
            project_id=projectId,
            brand_profile_id=brandProfileId,
        )
    blueprints = await brand_video_blueprint_store.list_brand_video_blueprints(
        user_id=current_user.user_id,
        project_id=projectId,
        brand_profile_id=brandProfileId,
    )
    return [BrandVideoBlueprintResponse(**blueprint) for blueprint in blueprints]


@router.post("", response_model=BrandVideoBlueprintResponse, status_code=status.HTTP_201_CREATED)
async def create_brand_video_blueprint(
    request: BrandVideoBlueprintCreateRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> BrandVideoBlueprintResponse:
    payload = request.to_canonical_dict()
    await require_owned_project_id(payload["project_id"], current_user)
    await _require_owned_brand_profile_for_project(
        current_user=current_user,
        project_id=payload["project_id"],
        brand_profile_id=payload["brand_profile_id"],
    )
    created = await brand_video_blueprint_store.create_brand_video_blueprint(
        user_id=current_user.user_id,
        payload=payload,
    )
    return BrandVideoBlueprintResponse(**created)


@router.get("/{blueprint_id}", response_model=BrandVideoBlueprintResponse)
async def get_brand_video_blueprint(
    blueprint_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> BrandVideoBlueprintResponse:
    blueprint = await brand_video_blueprint_store.get_brand_video_blueprint(
        blueprint_id=blueprint_id,
        user_id=current_user.user_id,
    )
    if blueprint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand video blueprint not found")
    return BrandVideoBlueprintResponse(**blueprint)


@router.patch("/{blueprint_id}", response_model=BrandVideoBlueprintResponse)
async def update_brand_video_blueprint(
    blueprint_id: str,
    request: BrandVideoBlueprintUpdateRequest,
    current_user: CurrentUser = Depends(require_current_user),
) -> BrandVideoBlueprintResponse:
    existing = await brand_video_blueprint_store.get_brand_video_blueprint(
        blueprint_id=blueprint_id,
        user_id=current_user.user_id,
    )
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand video blueprint not found")
    payload = request.to_canonical_dict()
    next_brand_profile_id = payload.get("brand_profile_id", existing["brand_profile_id"])
    await _require_owned_brand_profile_for_project(
        current_user=current_user,
        project_id=existing["project_id"],
        brand_profile_id=next_brand_profile_id,
    )
    updated = await brand_video_blueprint_store.update_brand_video_blueprint(
        blueprint_id=blueprint_id,
        user_id=current_user.user_id,
        payload=payload,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand video blueprint not found")
    return BrandVideoBlueprintResponse(**updated)


@router.delete("/{blueprint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand_video_blueprint(
    blueprint_id: str,
    current_user: CurrentUser = Depends(require_current_user),
) -> Response:
    deleted = await brand_video_blueprint_store.delete_brand_video_blueprint(
        blueprint_id=blueprint_id,
        user_id=current_user.user_id,
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand video blueprint not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
