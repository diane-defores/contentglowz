"""Canonical project-scoped brand video blueprint API models."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


BlueprintStatus = Literal["draft", "active", "archived"]
VideoArchetype = Literal[
    "ugc_ad",
    "product_demo",
    "faceless_reel",
    "talking_head_highlight",
    "testimonial_cut",
    "recap",
]


class BrandVideoBlueprintResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    user_id: str = Field(validation_alias=AliasChoices("userId", "user_id"), serialization_alias="userId")
    project_id: str = Field(validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId")
    brand_profile_id: str = Field(
        validation_alias=AliasChoices("brandProfileId", "brand_profile_id"),
        serialization_alias="brandProfileId",
    )
    name: str
    status: BlueprintStatus = "draft"
    default_archetype: VideoArchetype = Field(
        validation_alias=AliasChoices("defaultArchetype", "default_archetype"),
        serialization_alias="defaultArchetype",
    )
    scene_rules_json: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("sceneRulesJson", "scene_rules_json"),
        serialization_alias="sceneRulesJson",
    )
    layout_rules_json: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("layoutRulesJson", "layout_rules_json"),
        serialization_alias="layoutRulesJson",
    )
    motion_rules_json: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("motionRulesJson", "motion_rules_json"),
        serialization_alias="motionRulesJson",
    )
    caption_rules_json: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("captionRulesJson", "caption_rules_json"),
        serialization_alias="captionRulesJson",
    )
    cta_rules_json: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("ctaRulesJson", "cta_rules_json"),
        serialization_alias="ctaRulesJson",
    )
    audio_rules_json: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("audioRulesJson", "audio_rules_json"),
        serialization_alias="audioRulesJson",
    )
    export_rules_json: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("exportRulesJson", "export_rules_json"),
        serialization_alias="exportRulesJson",
    )
    allowed_regeneration_locks_json: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("allowedRegenerationLocksJson", "allowed_regeneration_locks_json"),
        serialization_alias="allowedRegenerationLocksJson",
    )
    revision: int = Field(ge=1)
    created_at: datetime = Field(validation_alias=AliasChoices("createdAt", "created_at"), serialization_alias="createdAt")
    updated_at: datetime = Field(validation_alias=AliasChoices("updatedAt", "updated_at"), serialization_alias="updatedAt")


class BrandVideoBlueprintCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_id: str = Field(validation_alias=AliasChoices("projectId", "project_id"), serialization_alias="projectId", min_length=1)
    brand_profile_id: str = Field(
        validation_alias=AliasChoices("brandProfileId", "brand_profile_id"),
        serialization_alias="brandProfileId",
        min_length=1,
    )
    name: str = Field(min_length=1, max_length=120)
    status: BlueprintStatus = "draft"
    default_archetype: VideoArchetype = Field(
        default="ugc_ad",
        validation_alias=AliasChoices("defaultArchetype", "default_archetype"),
        serialization_alias="defaultArchetype",
    )
    scene_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("sceneRulesJson", "scene_rules_json"), serialization_alias="sceneRulesJson")
    layout_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("layoutRulesJson", "layout_rules_json"), serialization_alias="layoutRulesJson")
    motion_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("motionRulesJson", "motion_rules_json"), serialization_alias="motionRulesJson")
    caption_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("captionRulesJson", "caption_rules_json"), serialization_alias="captionRulesJson")
    cta_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("ctaRulesJson", "cta_rules_json"), serialization_alias="ctaRulesJson")
    audio_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("audioRulesJson", "audio_rules_json"), serialization_alias="audioRulesJson")
    export_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("exportRulesJson", "export_rules_json"), serialization_alias="exportRulesJson")
    allowed_regeneration_locks_json: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("allowedRegenerationLocksJson", "allowed_regeneration_locks_json"),
        serialization_alias="allowedRegenerationLocksJson",
    )

    def to_canonical_dict(self) -> dict[str, Any]:
        return self.model_dump(by_alias=False, exclude_unset=True)


class BrandVideoBlueprintUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    brand_profile_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("brandProfileId", "brand_profile_id"),
        serialization_alias="brandProfileId",
        min_length=1,
    )
    name: str | None = Field(default=None, min_length=1, max_length=120)
    status: BlueprintStatus | None = None
    default_archetype: VideoArchetype | None = Field(
        default=None,
        validation_alias=AliasChoices("defaultArchetype", "default_archetype"),
        serialization_alias="defaultArchetype",
    )
    scene_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("sceneRulesJson", "scene_rules_json"), serialization_alias="sceneRulesJson")
    layout_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("layoutRulesJson", "layout_rules_json"), serialization_alias="layoutRulesJson")
    motion_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("motionRulesJson", "motion_rules_json"), serialization_alias="motionRulesJson")
    caption_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("captionRulesJson", "caption_rules_json"), serialization_alias="captionRulesJson")
    cta_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("ctaRulesJson", "cta_rules_json"), serialization_alias="ctaRulesJson")
    audio_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("audioRulesJson", "audio_rules_json"), serialization_alias="audioRulesJson")
    export_rules_json: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("exportRulesJson", "export_rules_json"), serialization_alias="exportRulesJson")
    allowed_regeneration_locks_json: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("allowedRegenerationLocksJson", "allowed_regeneration_locks_json"),
        serialization_alias="allowedRegenerationLocksJson",
    )

    def to_canonical_dict(self) -> dict[str, Any]:
        return self.model_dump(by_alias=False, exclude_unset=True)
