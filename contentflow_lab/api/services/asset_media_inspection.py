"""Deterministic media inspection for asset understanding jobs."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Literal

from api.services.asset_understanding import (
    AssetMediaEnvelope,
    AssetUnderstandingError,
    AssetUnderstandingGuardrails,
)

InspectionMediaType = Literal["image", "video"]
SubprocessRunner = Callable[..., subprocess.CompletedProcess[str]]


class AssetMediaInspectionError(AssetUnderstandingError):
    """Typed media inspection error for predictable route/service handling."""


@dataclass(frozen=True)
class MediaInspectionRequest:
    media_path: str
    media_type: InspectionMediaType
    mime_type: str | None = None


@dataclass(frozen=True)
class VideoSamplingPlan:
    provider_seconds: int
    provider_frames: int
    audio_seconds: int
    fps: float


@dataclass(frozen=True)
class MediaInspectionResult:
    media_type: InspectionMediaType
    media_path: str
    size_bytes: int | None = None
    duration_seconds: int | None = None
    width: int | None = None
    height: int | None = None
    has_audio: bool | None = None
    sampling_plan: VideoSamplingPlan | None = None
    warnings: tuple[str, ...] = field(default_factory=tuple)

    def to_media_envelope(self) -> AssetMediaEnvelope:
        return AssetMediaEnvelope(
            media_type=self.media_type,
            size_bytes=self.size_bytes,
            duration_seconds=self.duration_seconds,
            planned_provider_seconds=self.sampling_plan.provider_seconds
            if self.sampling_plan
            else None,
            planned_provider_frames=self.sampling_plan.provider_frames
            if self.sampling_plan
            else None,
            planned_audio_seconds=self.sampling_plan.audio_seconds
            if self.sampling_plan
            else None,
        )


class AssetMediaInspector:
    """Inspect image/video media locally without provider calls."""

    def __init__(
        self,
        *,
        guardrails: AssetUnderstandingGuardrails | None = None,
        runner: SubprocessRunner = subprocess.run,
        ffprobe_bin: str = "ffprobe",
        ffmpeg_bin: str = "ffmpeg",
    ) -> None:
        self.guardrails = guardrails or AssetUnderstandingGuardrails.from_env()
        self.runner = runner
        self.ffprobe_bin = ffprobe_bin
        self.ffmpeg_bin = ffmpeg_bin

    def inspect(self, request: MediaInspectionRequest) -> MediaInspectionResult:
        path = Path(request.media_path)
        if not path.exists() or not path.is_file():
            raise AssetMediaInspectionError(
                code="media_missing",
                message="Media file not found for inspection.",
                retryable=False,
                details={"media_path": request.media_path},
            )

        size_bytes = path.stat().st_size
        warnings: list[str] = []
        probe_data: dict[str, Any] | None = None
        if self._tool_available(self.ffprobe_bin):
            probe_data = self._run_ffprobe(path)
        else:
            warnings.append("ffprobe_unavailable")

        if request.media_type == "image":
            width, height = self._extract_dimensions(probe_data)
            result = MediaInspectionResult(
                media_type="image",
                media_path=str(path),
                size_bytes=size_bytes,
                width=width,
                height=height,
                warnings=tuple(warnings),
            )
            self.guardrails.validate_media(result.to_media_envelope())
            return result

        duration_seconds = self._extract_duration_seconds(probe_data)
        width, height = self._extract_dimensions(probe_data)
        has_audio = self._extract_has_audio(probe_data)
        sampling_plan = self._build_video_sampling_plan(duration_seconds)
        result = MediaInspectionResult(
            media_type="video",
            media_path=str(path),
            size_bytes=size_bytes,
            duration_seconds=duration_seconds,
            width=width,
            height=height,
            has_audio=has_audio,
            sampling_plan=sampling_plan,
            warnings=tuple(warnings),
        )
        self.guardrails.validate_media(result.to_media_envelope())
        return result

    def build_thumbnail_bytes(self, request: MediaInspectionRequest) -> bytes | None:
        """Best-effort thumbnail extraction with temp cleanup and no persistence."""
        if request.media_type != "video":
            return None
        if not self._tool_available(self.ffmpeg_bin):
            return None
        path = Path(request.media_path)
        if not path.exists() or not path.is_file():
            raise AssetMediaInspectionError(
                code="media_missing",
                message="Media file not found for thumbnail extraction.",
                retryable=False,
                details={"media_path": request.media_path},
            )

        with tempfile.TemporaryDirectory(prefix="asset-inspection-") as temp_dir:
            output_path = Path(temp_dir) / "thumb.jpg"
            command = [
                self.ffmpeg_bin,
                "-y",
                "-ss",
                "0.5",
                "-i",
                str(path),
                "-frames:v",
                "1",
                "-q:v",
                "2",
                str(output_path),
            ]
            completed = self.runner(command, capture_output=True, text=True, timeout=45)
            if completed.returncode != 0:
                raise AssetMediaInspectionError(
                    code="media_inspection_failed",
                    message="ffmpeg thumbnail extraction failed.",
                    retryable=False,
                    details={"stderr": (completed.stderr or "").strip()},
                )
            if not output_path.exists():
                return None
            return output_path.read_bytes()

    def _tool_available(self, binary_name: str) -> bool:
        return shutil.which(binary_name) is not None

    def _run_ffprobe(self, media_path: Path) -> dict[str, Any]:
        command = [
            self.ffprobe_bin,
            "-v",
            "error",
            "-show_format",
            "-show_streams",
            "-of",
            "json",
            str(media_path),
        ]
        try:
            completed = self.runner(command, capture_output=True, text=True, timeout=30)
        except subprocess.TimeoutExpired as exc:
            raise AssetMediaInspectionError(
                code="media_inspection_timeout",
                message="ffprobe timed out while inspecting media.",
                retryable=True,
                details={"media_path": str(media_path)},
            ) from exc
        if completed.returncode != 0:
            raise AssetMediaInspectionError(
                code="media_inspection_failed",
                message="ffprobe failed while inspecting media.",
                retryable=False,
                details={"stderr": (completed.stderr or "").strip()},
            )
        try:
            return json.loads(completed.stdout or "{}")
        except json.JSONDecodeError as exc:
            raise AssetMediaInspectionError(
                code="media_inspection_malformed",
                message="ffprobe returned malformed JSON payload.",
                retryable=False,
            ) from exc

    def _extract_duration_seconds(self, probe_data: dict[str, Any] | None) -> int | None:
        if not probe_data:
            return None
        raw = (probe_data.get("format") or {}).get("duration")
        if raw in (None, ""):
            return None
        try:
            return max(int(float(raw)), 0)
        except (TypeError, ValueError):
            return None

    def _extract_dimensions(
        self, probe_data: dict[str, Any] | None
    ) -> tuple[int | None, int | None]:
        streams = (probe_data or {}).get("streams") or []
        for stream in streams:
            if stream.get("codec_type") != "video":
                continue
            width = self._as_int(stream.get("width"))
            height = self._as_int(stream.get("height"))
            return width, height
        return None, None

    def _extract_has_audio(self, probe_data: dict[str, Any] | None) -> bool | None:
        streams = (probe_data or {}).get("streams") or []
        if not streams:
            return None
        return any(stream.get("codec_type") == "audio" for stream in streams)

    def _build_video_sampling_plan(self, duration_seconds: int | None) -> VideoSamplingPlan:
        sampled_seconds = self.guardrails.max_provider_video_seconds
        if duration_seconds is not None:
            sampled_seconds = min(max(duration_seconds, 0), sampled_seconds)
        sampled_seconds = max(sampled_seconds, 1)
        raw_fps = self.guardrails.max_provider_frames / sampled_seconds
        fps = min(1.0, raw_fps)
        if fps <= 0:
            fps = 1.0
        sampled_frames = min(int(sampled_seconds * fps), self.guardrails.max_provider_frames)
        if sampled_frames <= 0:
            sampled_frames = 1
        audio_seconds = min(sampled_seconds, self.guardrails.max_audio_seconds)
        return VideoSamplingPlan(
            provider_seconds=sampled_seconds,
            provider_frames=sampled_frames,
            audio_seconds=audio_seconds,
            fps=fps,
        )

    @staticmethod
    def _as_int(value: Any) -> int | None:
        if value in (None, ""):
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

