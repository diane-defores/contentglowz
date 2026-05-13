import base64
from pathlib import Path

import pytest

from api.services.flux_image_generation import (
    FluxImageGenerationError,
    FluxImageGenerator,
    SUPPORTED_OUTPUT_FORMATS,
    image_type_dimensions,
)


class _Response:
    def __init__(self, status_code=200, payload=None, text=""):
        self.status_code = status_code
        self._payload = payload if payload is not None else {}
        self.text = text
        self.headers = {"Content-Type": "application/json"}

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise AssertionError("raise_for_status should not be used for mocked HTTP errors")


def test_flux_generator_submits_references_and_decodes_base64(monkeypatch):
    calls = {"post": None, "get": None}

    def fake_post(url, headers, json, timeout):
        calls["post"] = {"url": url, "headers": headers, "json": json, "timeout": timeout}
        return _Response(
            payload={
                "id": "task-1",
                "polling_url": "https://api.bfl.ai/v1/get_result?id=task-1",
                "cost": 4.5,
            }
        )

    def fake_get(url, headers, timeout):
        calls["get"] = {"url": url, "headers": headers, "timeout": timeout}
        return _Response(
            payload={
                "status": "Ready",
                "image_base64": base64.b64encode(b"fake-image").decode("ascii"),
            }
        )

    monkeypatch.setattr("api.services.flux_image_generation.requests.post", fake_post)
    monkeypatch.setattr("api.services.flux_image_generation.requests.get", fake_get)

    generator = FluxImageGenerator(
        api_key="test-key",
        poll_interval_seconds=0.001,
        timeout_seconds=1,
    )
    result = generator.generate_to_file(
        prompt="Hero image",
        width=1536,
        height=864,
        output_format="jpeg",
        reference_urls=["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
    )

    assert calls["post"]["url"] == "https://api.bfl.ai/v1/flux-2-pro"
    assert calls["post"]["headers"]["x-key"] == "test-key"
    assert calls["post"]["json"]["input_image"] == "https://cdn.example.com/a.jpg"
    assert calls["post"]["json"]["input_image_2"] == "https://cdn.example.com/b.jpg"
    assert result.provider_request_id == "task-1"
    assert result.provider_cost == 4.5
    assert result.local_path
    Path(result.local_path).unlink(missing_ok=True)


def test_flux_generator_maps_rate_limit(monkeypatch):
    def fake_post(url, headers, json, timeout):
        return _Response(status_code=429, payload={"detail": "too many"})

    monkeypatch.setattr("api.services.flux_image_generation.requests.post", fake_post)
    generator = FluxImageGenerator(api_key="test-key")

    with pytest.raises(FluxImageGenerationError) as exc:
        generator.generate_to_file(prompt="x", width=1280, height=720)

    assert exc.value.code == "provider_rate_limited"


def test_flux_output_contract_matches_bfl_pro_docs():
    assert SUPPORTED_OUTPUT_FORMATS == {"jpeg", "png", "webp"}

    for image_type in ("hero_image", "section_image", "og_card", "thumbnail"):
        width, height = image_type_dimensions(image_type)
        assert width >= 64
        assert height >= 64
        assert width % 16 == 0
        assert height % 16 == 0


def test_flux_generator_rejects_non_aligned_dimensions():
    generator = FluxImageGenerator(api_key="test-key")

    with pytest.raises(FluxImageGenerationError) as exc:
        generator.generate_to_file(prompt="Hero image", width=1440, height=810)

    assert exc.value.code == "invalid_dimensions"
