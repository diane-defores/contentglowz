"""Asset understanding provider contract, credential resolution, and guardrails."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Literal, Protocol

from api.services.user_key_store import user_key_store

AssetMediaType = Literal["image", "video"]
AssetUnderstandingProviderName = Literal["gemini_compatible", "openai_vision_speech"]
AssetCredentialSource = Literal["user_byok", "platform"]


class AssetUnderstandingError(RuntimeError):
    """Structured error used by understanding jobs and routes."""

    def __init__(
        self,
        *,
        code: str,
        message: str,
        retryable: bool = False,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable
        self.details = details or {}


@dataclass(frozen=True)
class ResolvedAssetCredential:
    provider: AssetUnderstandingProviderName
    source: AssetCredentialSource
    secret: str


@dataclass(frozen=True)
class AssetMediaEnvelope:
    media_type: AssetMediaType
    size_bytes: int | None = None
    duration_seconds: int | None = None
    planned_provider_seconds: int | None = None
    planned_provider_frames: int | None = None
    planned_audio_seconds: int | None = None


@dataclass(frozen=True)
class AssetUnderstandingGuardrails:
    max_image_bytes: int = 25 * 1024 * 1024
    max_source_video_bytes: int = 500 * 1024 * 1024
    max_source_video_seconds: int = 1800
    max_provider_video_seconds: int = 90
    max_provider_frames: int = 180
    max_audio_seconds: int = 120
    concurrency_per_project: int = 2
    concurrency_per_user: int = 4
    daily_platform_images: int = 100
    daily_platform_videos: int = 25
    daily_byok_images: int = 250
    daily_byok_videos: int = 50

    @classmethod
    def from_env(cls) -> "AssetUnderstandingGuardrails":
        return cls(
            max_image_bytes=int(os.getenv("ASSET_UNDERSTANDING_MAX_IMAGE_BYTES", str(25 * 1024 * 1024))),
            max_source_video_bytes=int(
                os.getenv("ASSET_UNDERSTANDING_MAX_SOURCE_VIDEO_BYTES", str(500 * 1024 * 1024))
            ),
            max_source_video_seconds=int(os.getenv("ASSET_UNDERSTANDING_MAX_SOURCE_VIDEO_SECONDS", "1800")),
            max_provider_video_seconds=int(os.getenv("ASSET_UNDERSTANDING_MAX_PROVIDER_VIDEO_SECONDS", "90")),
            max_provider_frames=int(os.getenv("ASSET_UNDERSTANDING_MAX_PROVIDER_FRAMES", "180")),
            max_audio_seconds=int(os.getenv("ASSET_UNDERSTANDING_MAX_AUDIO_SECONDS", "120")),
            concurrency_per_project=int(os.getenv("ASSET_UNDERSTANDING_CONCURRENCY_PER_PROJECT", "2")),
            concurrency_per_user=int(os.getenv("ASSET_UNDERSTANDING_CONCURRENCY_PER_USER", "4")),
            daily_platform_images=int(os.getenv("ASSET_UNDERSTANDING_DAILY_PLATFORM_QUOTA_IMAGES", "100")),
            daily_platform_videos=int(os.getenv("ASSET_UNDERSTANDING_DAILY_PLATFORM_QUOTA_VIDEOS", "25")),
            daily_byok_images=int(os.getenv("ASSET_UNDERSTANDING_DAILY_BYOK_QUOTA_IMAGES", "250")),
            daily_byok_videos=int(os.getenv("ASSET_UNDERSTANDING_DAILY_BYOK_QUOTA_VIDEOS", "50")),
        )

    def validate_media(self, media: AssetMediaEnvelope) -> None:
        if media.media_type == "image":
            if media.size_bytes is not None and media.size_bytes > self.max_image_bytes:
                raise AssetUnderstandingError(
                    code="skipped_limit_exceeded",
                    message="Image exceeds configured size limit.",
                )
            return

        if media.size_bytes is not None and media.size_bytes > self.max_source_video_bytes:
            raise AssetUnderstandingError(code="needs_trim", message="Video file is too large for analysis.")
        if media.duration_seconds is not None and media.duration_seconds > self.max_source_video_seconds:
            raise AssetUnderstandingError(code="needs_trim", message="Video duration exceeds source limit.")
        if (
            media.planned_provider_seconds is not None
            and media.planned_provider_seconds > self.max_provider_video_seconds
        ):
            raise AssetUnderstandingError(
                code="skipped_limit_exceeded",
                message="Planned provider video sample exceeds configured limit.",
            )
        if media.planned_provider_frames is not None and media.planned_provider_frames > self.max_provider_frames:
            raise AssetUnderstandingError(
                code="skipped_limit_exceeded",
                message="Planned provider frame count exceeds configured limit.",
            )
        if media.planned_audio_seconds is not None and media.planned_audio_seconds > self.max_audio_seconds:
            raise AssetUnderstandingError(
                code="skipped_limit_exceeded",
                message="Planned provider audio sample exceeds configured limit.",
            )

    def validate_quota(
        self,
        *,
        media_type: AssetMediaType,
        credential_source: AssetCredentialSource,
        used_today: int,
    ) -> None:
        if credential_source == "platform":
            cap = self.daily_platform_images if media_type == "image" else self.daily_platform_videos
        else:
            cap = self.daily_byok_images if media_type == "image" else self.daily_byok_videos
        if used_today >= cap:
            raise AssetUnderstandingError(
                code="quota_exceeded",
                message="Daily analysis quota exceeded.",
                retryable=False,
                details={"cap": cap, "used_today": used_today},
            )


class AssetUnderstandingProviderAdapter(Protocol):
    provider_name: AssetUnderstandingProviderName

    async def analyze_image(self, *, media: AssetMediaEnvelope, prompt_context: dict[str, Any]) -> dict[str, Any]:
        ...

    async def analyze_video(self, *, media: AssetMediaEnvelope, prompt_context: dict[str, Any]) -> dict[str, Any]:
        ...


class NoopGeminiCompatibleAdapter:
    """Mockable placeholder adapter until provider wiring is implemented."""

    provider_name: AssetUnderstandingProviderName = "gemini_compatible"

    async def analyze_image(self, *, media: AssetMediaEnvelope, prompt_context: dict[str, Any]) -> dict[str, Any]:
        raise AssetUnderstandingError(
            code="provider_not_implemented",
            message="Gemini-compatible adapter is not wired yet.",
        )

    async def analyze_video(self, *, media: AssetMediaEnvelope, prompt_context: dict[str, Any]) -> dict[str, Any]:
        raise AssetUnderstandingError(
            code="provider_not_implemented",
            message="Gemini-compatible adapter is not wired yet.",
        )


class AssetUnderstandingCredentialResolver:
    """Resolve BYOK first, then optional platform credential fallback."""

    ENV_BY_PROVIDER: dict[AssetUnderstandingProviderName, str] = {
        "gemini_compatible": "GEMINI_API_KEY",
        "openai_vision_speech": "OPENAI_API_KEY",
    }

    STORE_PROVIDER_BY_ADAPTER: dict[AssetUnderstandingProviderName, str] = {
        "gemini_compatible": "gemini",
        "openai_vision_speech": "openai",
    }

    def __init__(self, *, allow_platform_fallback: bool = True) -> None:
        self.allow_platform_fallback = allow_platform_fallback

    async def resolve(
        self,
        *,
        user_id: str,
        provider: AssetUnderstandingProviderName,
    ) -> ResolvedAssetCredential:
        store_provider = self.STORE_PROVIDER_BY_ADAPTER[provider]
        try:
            byok_status = await user_key_store.get_credential_status(user_id, provider=store_provider)
        except RuntimeError:
            byok_status = None
        if byok_status:
            secret = await user_key_store.get_secret(user_id, provider=store_provider)
            if secret:
                return ResolvedAssetCredential(provider=provider, source="user_byok", secret=secret)

        if self.allow_platform_fallback:
            env_name = self.ENV_BY_PROVIDER[provider]
            secret = (os.getenv(env_name, "") or "").strip()
            if secret:
                return ResolvedAssetCredential(provider=provider, source="platform", secret=secret)

        raise AssetUnderstandingError(
            code="provider_not_configured",
            message="No compatible user or platform credential configured for asset understanding.",
            retryable=False,
        )
