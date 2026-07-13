import pytest

from api.services.video_source_link_service import LinkMetadataError, VideoSourceLinkService
from api.services.video_source_text_service import TextSourceError, process_pasted_text


def test_pasted_text_is_normalized_bounded_and_private():
    result = process_pasted_text("  First  line\n\n\nSecond line  ")

    assert result.text == "First line\n\nSecond line"
    assert result.char_count == len(result.text)
    assert len(result.preview) <= 280
    assert result.normalized_hash


def test_pasted_text_rejects_empty_and_oversized_content():
    with pytest.raises(TextSourceError) as empty:
        process_pasted_text("   \n")
    assert empty.value.code == "empty_text"

    with pytest.raises(TextSourceError) as large:
        process_pasted_text("x" * 100_001)
    assert large.value.code == "text_too_large"


@pytest.mark.asyncio
async def test_link_service_blocks_private_target_before_fetch():
    called = False

    async def fetcher(*_args, **_kwargs):
        nonlocal called
        called = True
        return {"status": 200, "headers": {}, "body": b""}

    service = VideoSourceLinkService(
        resolver=lambda _host, _port: ["127.0.0.1"],
        fetcher=fetcher,
    )
    with pytest.raises(LinkMetadataError) as blocked:
        await service.inspect("https://private.example/path")

    assert blocked.value.code == "unsafe_url"
    assert called is False
    assert "private.example" not in str(blocked.value)


@pytest.mark.asyncio
async def test_link_service_collects_only_safe_bounded_metadata():
    async def fetcher(url, **_kwargs):
        return {
            "status": 200,
            "url": url,
            "headers": {"content-type": "text/html"},
            "body": b"<html><head><title>Public page</title></head></html>",
        }

    service = VideoSourceLinkService(
        resolver=lambda _host, _port: ["93.184.216.34"],
        fetcher=fetcher,
    )
    result = await service.inspect("https://Example.com/path#fragment")

    assert result.canonical_url == "https://example.com/path"
    assert result.hostname == "example.com"
    assert result.title == "Public page"
