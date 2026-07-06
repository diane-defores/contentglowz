"""Canonical project-scoped brand profile API models."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


MotionIntensity = Literal["low", "medium", "high"]


class BrandProfileResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    user_id: str = Field(
        validation_alias=AliasChoices("userId", "user_id"),
        serialization_alias="userId",
    )
    project_id: str = Field(
        validation_alias=AliasChoices("projectId", "project_id"),
        serialization_alias="projectId",
    )
    name: str
    logo_asset_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("logoAssetId", "logo_asset_id"),
        serialization_alias="logoAssetId",
    )
    primary_colors: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("primaryColors", "primary_colors"),
        serialization_alias="primaryColors",
    )
    secondary_colors: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("secondaryColors", "secondary_colors"),
        serialization_alias="secondaryColors",
    )
    font_heading: str | None = Field(
        default=None,
        validation_alias=AliasChoices("fontHeading", "font_heading"),
        serialization_alias="fontHeading",
    )
    font_body: str | None = Field(
        default=None,
        validation_alias=AliasChoices("fontBody", "font_body"),
        serialization_alias="fontBody",
    )
    tone_keywords: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("toneKeywords", "tone_keywords"),
        serialization_alias="toneKeywords",
    )
    cta_defaults: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("ctaDefaults", "cta_defaults"),
        serialization_alias="ctaDefaults",
    )
    caption_style_defaults: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("captionStyleDefaults", "caption_style_defaults"),
        serialization_alias="captionStyleDefaults",
    )
    motion_intensity: MotionIntensity = Field(
        default="medium",
        validation_alias=AliasChoices("motionIntensity", "motion_intensity"),
        serialization_alias="motionIntensity",
    )
    transition_family: str | None = Field(
        default=None,
        validation_alias=AliasChoices("transitionFamily", "transition_family"),
        serialization_alias="transitionFamily",
    )
    intro_module_enabled: bool = Field(
        default=True,
        validation_alias=AliasChoices("introModuleEnabled", "intro_module_enabled"),
        serialization_alias="introModuleEnabled",
    )
    outro_module_enabled: bool = Field(
        default=True,
        validation_alias=AliasChoices("outroModuleEnabled", "outro_module_enabled"),
        serialization_alias="outroModuleEnabled",
    )
    is_default: bool = Field(
        default=False,
        validation_alias=AliasChoices("isDefault", "is_default"),
        serialization_alias="isDefault",
    )
    revision: int = Field(ge=1)
    created_at: datetime = Field(
        validation_alias=AliasChoices("createdAt", "created_at"),
        serialization_alias="createdAt",
    )
    updated_at: datetime = Field(
        validation_alias=AliasChoices("updatedAt", "updated_at"),
        serialization_alias="updatedAt",
    )


class BrandProfileCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_id: str = Field(
        validation_alias=AliasChoices("projectId", "project_id"),
        serialization_alias="projectId",
        min_length=1,
    )
    name: str = Field(min_length=1, max_length=120)
    logo_asset_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("logoAssetId", "logo_asset_id"),
        serialization_alias="logoAssetId",
        max_length=256,
    )
    primary_colors: list[str] | None = Field(
        default=None,
        validation_alias=AliasChoices("primaryColors", "primary_colors"),
        serialization_alias="primaryColors",
    )
    secondary_colors: list[str] | None = Field(
        default=None,
        validation_alias=AliasChoices("secondaryColors", "secondary_colors"),
        serialization_alias="secondaryColors",
    )
    font_heading: str | None = Field(
        default=None,
        validation_alias=AliasChoices("fontHeading", "font_heading"),
        serialization_alias="fontHeading",
        max_length=120,
    )
    font_body: str | None = Field(
        default=None,
        validation_alias=AliasChoices("fontBody", "font_body"),
        serialization_alias="fontBody",
        max_length=120,
    )
    tone_keywords: list[str] | None = Field(
        default=None,
        validation_alias=AliasChoices("toneKeywords", "tone_keywords"),
        serialization_alias="toneKeywords",
    )
    cta_defaults: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("ctaDefaults", "cta_defaults"),
        serialization_alias="ctaDefaults",
    )
    caption_style_defaults: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("captionStyleDefaults", "caption_style_defaults"),
        serialization_alias="captionStyleDefaults",
    )
    motion_intensity: MotionIntensity = Field(
        default="medium",
        validation_alias=AliasChoices("motionIntensity", "motion_intensity"),
        serialization_alias="motionIntensity",
    )
    transition_family: str | None = Field(
        default=None,
        validation_alias=AliasChoices("transitionFamily", "transition_family"),
        serialization_alias="transitionFamily",
        max_length=120,
    )
    intro_module_enabled: bool = Field(
        default=True,
        validation_alias=AliasChoices("introModuleEnabled", "intro_module_enabled"),
        serialization_alias="introModuleEnabled",
    )
    outro_module_enabled: bool = Field(
        default=True,
        validation_alias=AliasChoices("outroModuleEnabled", "outro_module_enabled"),
        serialization_alias="outroModuleEnabled",
    )
    is_default: bool = Field(
        default=False,
        validation_alias=AliasChoices("isDefault", "is_default"),
        serialization_alias="isDefault",
    )

    def to_canonical_dict(self) -> dict[str, Any]:
        return self.model_dump(by_alias=False, exclude_unset=True)


class BrandProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = Field(default=None, min_length=1, max_length=120)
    logo_asset_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("logoAssetId", "logo_asset_id"),
        serialization_alias="logoAssetId",
        max_length=256,
    )
    primary_colors: list[str] | None = Field(
        default=None,
        validation_alias=AliasChoices("primaryColors", "primary_colors"),
        serialization_alias="primaryColors",
    )
    secondary_colors: list[str] | None = Field(
        default=None,
        validation_alias=AliasChoices("secondaryColors", "secondary_colors"),
        serialization_alias="secondaryColors",
    )
    font_heading: str | None = Field(
        default=None,
        validation_alias=AliasChoices("fontHeading", "font_heading"),
        serialization_alias="fontHeading",
        max_length=120,
    )
    font_body: str | None = Field(
        default=None,
        validation_alias=AliasChoices("fontBody", "font_body"),
        serialization_alias="fontBody",
        max_length=120,
    )
    tone_keywords: list[str] | None = Field(
        default=None,
        validation_alias=AliasChoices("toneKeywords", "tone_keywords"),
        serialization_alias="toneKeywords",
    )
    cta_defaults: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("ctaDefaults", "cta_defaults"),
        serialization_alias="ctaDefaults",
    )
    caption_style_defaults: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("captionStyleDefaults", "caption_style_defaults"),
        serialization_alias="captionStyleDefaults",
    )
    motion_intensity: MotionIntensity | None = Field(
        default=None,
        validation_alias=AliasChoices("motionIntensity", "motion_intensity"),
        serialization_alias="motionIntensity",
    )
    transition_family: str | None = Field(
        default=None,
        validation_alias=AliasChoices("transitionFamily", "transition_family"),
        serialization_alias="transitionFamily",
        max_length=120,
    )
    intro_module_enabled: bool | None = Field(
        default=None,
        validation_alias=AliasChoices("introModuleEnabled", "intro_module_enabled"),
        serialization_alias="introModuleEnabled",
    )
    outro_module_enabled: bool | None = Field(
        default=None,
        validation_alias=AliasChoices("outroModuleEnabled", "outro_module_enabled"),
        serialization_alias="outroModuleEnabled",
    )
    is_default: bool | None = Field(
        default=None,
        validation_alias=AliasChoices("isDefault", "is_default"),
        serialization_alias="isDefault",
    )

    def to_canonical_dict(self) -> dict[str, Any]:
        return self.model_dump(by_alias=False, exclude_unset=True)
