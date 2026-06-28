import json
import subprocess
from pathlib import Path

import pytest

from api.services.asset_media_inspection import (
    AssetMediaInspectionError,
    AssetMediaInspector,
    MediaInspectionRequest,
)
from api.services.asset_understanding import AssetUnderstandingError, AssetUnderstandingGuardrails


def _ffprobe_payload(*, duration: str = "12.6", width: int = 1280, height: int = 720, has_audio: bool = True) -> str:
    streams = [{"codec_type": "video", "width": width, "height": height}]
    if has_audio:
        streams.append({"codec_type": "audio"})
    return json.dumps({"format": {"duration": duration}, "streams": streams})


def test_inspect_video_builds_sampling_plan_and_validates_guardrails(tmp_path, monkeypatch):
    media = tmp_path / "sample.mp4"
    media.write_bytes(b"abc")
    monkeypatch.setattr("api.services.asset_media_inspection.shutil.which", lambda _: "/usr/bin/tool")

    def _runner(cmd, **_kwargs):
        assert cmd[0] == "ffprobe"
        return subprocess.CompletedProcess(cmd, 0, stdout=_ffprobe_payload(duration="8.0"), stderr="")

    inspector = AssetMediaInspector(
        runner=_runner,
        guardrails=AssetUnderstandingGuardrails(
            max_provider_video_seconds=90,
            max_provider_frames=180,
            max_audio_seconds=120,
        ),
    )
    result = inspector.inspect(MediaInspectionRequest(media_path=str(media), media_type="video"))
    assert result.duration_seconds == 8
    assert result.width == 1280
    assert result.height == 720
    assert result.has_audio is True
    assert result.sampling_plan is not None
    assert result.sampling_plan.provider_seconds == 8
    assert result.sampling_plan.provider_frames == 8


def test_inspect_image_without_ffprobe_returns_warning_and_still_validates(tmp_path, monkeypatch):
    media = tmp_path / "sample.png"
    media.write_bytes(b"x" * 64)
    monkeypatch.setattr("api.services.asset_media_inspection.shutil.which", lambda _: None)
    inspector = AssetMediaInspector(guardrails=AssetUnderstandingGuardrails(max_image_bytes=128))
    result = inspector.inspect(MediaInspectionRequest(media_path=str(media), media_type="image"))
    assert result.size_bytes == 64
    assert "ffprobe_unavailable" in result.warnings


def test_inspect_rejects_missing_media_file(tmp_path):
    inspector = AssetMediaInspector()
    missing = tmp_path / "missing.mp4"
    with pytest.raises(AssetMediaInspectionError) as exc:
        inspector.inspect(MediaInspectionRequest(media_path=str(missing), media_type="video"))
    assert exc.value.code == "media_missing"


def test_inspect_propagates_guardrail_limit_error(tmp_path, monkeypatch):
    media = tmp_path / "too-large.mp4"
    media.write_bytes(b"x" * 10)
    monkeypatch.setattr("api.services.asset_media_inspection.shutil.which", lambda _: "/usr/bin/tool")

    def _runner(cmd, **_kwargs):
        return subprocess.CompletedProcess(cmd, 0, stdout=_ffprobe_payload(duration="30.0"), stderr="")

    inspector = AssetMediaInspector(
        runner=_runner,
        guardrails=AssetUnderstandingGuardrails(max_source_video_seconds=20),
    )
    with pytest.raises(AssetUnderstandingError) as exc:
        inspector.inspect(MediaInspectionRequest(media_path=str(media), media_type="video"))
    assert exc.value.code == "needs_trim"


def test_build_thumbnail_bytes_uses_temp_dir_cleanup(tmp_path, monkeypatch):
    media = tmp_path / "video.mp4"
    media.write_bytes(b"raw")
    monkeypatch.setattr("api.services.asset_media_inspection.shutil.which", lambda _: "/usr/bin/tool")
    created_paths: list[Path] = []

    def _runner(cmd, **_kwargs):
        output = Path(cmd[-1])
        output.write_bytes(b"jpeg-bytes")
        created_paths.append(output)
        return subprocess.CompletedProcess(cmd, 0, stdout="", stderr="")

    inspector = AssetMediaInspector(runner=_runner)
    data = inspector.build_thumbnail_bytes(MediaInspectionRequest(media_path=str(media), media_type="video"))
    assert data == b"jpeg-bytes"
    assert created_paths, "runner should have been invoked"
    assert not created_paths[0].exists(), "temporary thumbnail should be cleaned after extraction"

