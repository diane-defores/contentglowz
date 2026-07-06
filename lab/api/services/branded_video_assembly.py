"""AI-first branded timeline draft assembly on top of the canonical timeline model."""

from __future__ import annotations

from typing import Any

from api.services.project_asset_storage import build_project_asset_storage_descriptor

DEFAULT_SCENE_FRAMES = 90
HOOK_FRAMES = 60
OUTRO_FRAMES = 45
MAX_SCENES = 6


def assemble_branded_timeline_draft(
    *,
    content_record: Any,
    brand_profile: dict[str, Any],
    blueprint: dict[str, Any],
    project_assets: list[Any],
    format_preset: str,
) -> dict[str, Any]:
    """Build a deterministic branded timeline draft from owned content and project assets."""

    eligible_assets = _eligible_visual_assets(project_assets)
    visual_assets = eligible_assets[:MAX_SCENES]
    preview_text = _safe_preview_text(getattr(content_record, "content_preview", None))
    title = _safe_title(getattr(content_record, "title", None))

    tracks = [
        {
            "id": "visual-main",
            "type": "visual",
            "order": 0,
            "exclusive": True,
            "muted": False,
            "locked": False,
        },
        {
            "id": "overlay-title",
            "type": "overlay",
            "order": 1,
            "exclusive": False,
            "muted": False,
            "locked": False,
        },
        {
            "id": "overlay-body",
            "type": "overlay",
            "order": 2,
            "exclusive": False,
            "muted": False,
            "locked": False,
        },
    ]
    clips: list[dict[str, Any]] = []

    primary = list(brand_profile.get("primary_colors") or [])
    secondary = list(brand_profile.get("secondary_colors") or [])
    title_color = primary[0] if primary else "#FFFFFF"
    accent_color = secondary[0] if secondary else (primary[1] if len(primary) > 1 else "#111111")
    motion_intensity = str(brand_profile.get("motion_intensity") or "medium")
    transition_family = str(brand_profile.get("transition_family") or "cut")
    caption_defaults = brand_profile.get("caption_style_defaults") or {}

    current_start = 0
    scene_duration = _scene_duration_for_motion(motion_intensity)
    scene_rules = blueprint.get("scene_rules_json") or {}
    cta_rules = blueprint.get("cta_rules_json") or {}

    if visual_assets:
        for index, asset in enumerate(visual_assets):
            duration = int(scene_rules.get("sceneDurationFrames") or scene_duration)
            if index == 0 and brand_profile.get("intro_module_enabled", True):
                duration = max(duration, HOOK_FRAMES)
            clip_type = "video" if str(getattr(asset, "media_kind", "")) == "video" else "image"
            clips.append(
                {
                    "id": f"visual-{index + 1}",
                    "track_id": "visual-main",
                    "clip_type": clip_type,
                    "start_frame": current_start,
                    "duration_frames": duration,
                    "asset_id": getattr(asset, "id"),
                    "role": "scene",
                    "style": {
                        "transition_family": transition_family,
                        "motion_intensity": motion_intensity,
                    },
                    "metadata": {
                        "brand_profile_id": brand_profile["id"],
                        "blueprint_id": blueprint["id"],
                        "scene_index": index,
                    },
                }
            )
            current_start += duration
    else:
        current_start = max(scene_duration, 120)
        clips.append(
            {
                "id": "visual-fallback",
                "track_id": "overlay-body",
                "clip_type": "background",
                "start_frame": 0,
                "duration_frames": current_start,
                "role": "fallback_background",
                "style": {
                    "color": primary[0] if primary else "#111111",
                    "accent_color": accent_color,
                },
                "metadata": {
                    "brand_profile_id": brand_profile["id"],
                    "blueprint_id": blueprint["id"],
                    "fallback": True,
                },
            }
        )

    clips.append(
        {
            "id": "title-hook",
            "track_id": "overlay-title",
            "clip_type": "text",
            "start_frame": 0,
            "duration_frames": min(current_start, HOOK_FRAMES if current_start > 0 else 90),
            "text": title,
            "role": "hook_title",
            "style": {
                "align": "center",
                "font_family": brand_profile.get("font_heading") or "Instrument Serif",
                "font_size": 76,
                "color": title_color,
                "accent_color": accent_color,
                "motion_intensity": motion_intensity,
            },
            "metadata": {
                "brand_profile_id": brand_profile["id"],
                "blueprint_id": blueprint["id"],
                "default_archetype": blueprint.get("default_archetype"),
            },
        }
    )

    if preview_text:
        body_start = HOOK_FRAMES if current_start > HOOK_FRAMES else 0
        body_duration = max(current_start - body_start, 75)
        clips.append(
            {
                "id": "body-summary",
                "track_id": "overlay-body",
                "clip_type": "text",
                "start_frame": body_start,
                "duration_frames": body_duration,
                "text": preview_text,
                "role": "support_copy",
                "style": {
                    "align": "left",
                    "font_family": brand_profile.get("font_body") or "Manrope",
                    "font_size": 42,
                    "color": caption_defaults.get("textColor", title_color),
                    "background_color": caption_defaults.get("backgroundColor"),
                    "tone_keywords": list(brand_profile.get("tone_keywords") or []),
                },
                "metadata": {
                    "brand_profile_id": brand_profile["id"],
                    "blueprint_id": blueprint["id"],
                },
            }
        )

    cta_text = _cta_text(brand_profile, cta_rules)
    if brand_profile.get("outro_module_enabled", True) and cta_text:
        clips.append(
            {
                "id": "cta-outro",
                "track_id": "overlay-title",
                "clip_type": "text",
                "start_frame": current_start,
                "duration_frames": int(cta_rules.get("durationFrames") or OUTRO_FRAMES),
                "text": cta_text,
                "role": "cta",
                "style": {
                    "align": "center",
                    "font_family": brand_profile.get("font_heading") or brand_profile.get("font_body") or "Manrope",
                    "font_size": 58,
                    "color": accent_color,
                    "uppercase": bool(cta_rules.get("uppercase", True)),
                },
                "metadata": {
                    "brand_profile_id": brand_profile["id"],
                    "blueprint_id": blueprint["id"],
                    "cta_defaults": brand_profile.get("cta_defaults") or {},
                },
            }
        )
        current_start += int(cta_rules.get("durationFrames") or OUTRO_FRAMES)

    final_duration = max(
        max((int(clip["start_frame"]) + int(clip["duration_frames"]) for clip in clips), default=0),
        90,
    )

    return {
        "schema_version": "1.0",
        "format_preset": format_preset,
        "fps": 30,
        "duration_frames": final_duration,
        "tracks": tracks,
        "clips": clips,
    }


def _eligible_visual_assets(project_assets: list[Any]) -> list[Any]:
    eligible: list[Any] = []
    for asset in project_assets:
        media_kind = str(getattr(asset, "media_kind", "") or "")
        if media_kind not in {"image", "video", "thumbnail", "video_cover", "capture"}:
            continue
        descriptor = build_project_asset_storage_descriptor(
            storage_uri=getattr(asset, "storage_uri", None),
            status=str(getattr(asset, "status", "") or ""),
            media_kind=media_kind,
            mime_type=getattr(asset, "mime_type", None),
        )
        if not descriptor["render_safe"]:
            continue
        eligible.append(asset)
    return eligible


def _safe_title(value: Any) -> str:
    title = str(value or "").strip()
    return title[:180] or "Untitled video"


def _safe_preview_text(value: Any) -> str | None:
    text = " ".join(str(value or "").strip().split())
    if not text:
        return None
    return text[:240]


def _scene_duration_for_motion(motion_intensity: str) -> int:
    if motion_intensity == "high":
        return 75
    if motion_intensity == "low":
        return 105
    return DEFAULT_SCENE_FRAMES


def _cta_text(brand_profile: dict[str, Any], cta_rules: dict[str, Any]) -> str | None:
    explicit = cta_rules.get("text")
    if isinstance(explicit, str) and explicit.strip():
        return explicit.strip()[:120]
    defaults = brand_profile.get("cta_defaults") or {}
    primary = defaults.get("primaryText") or defaults.get("text")
    if isinstance(primary, str) and primary.strip():
        return primary.strip()[:120]
    return "Discover more"
