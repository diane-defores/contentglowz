"""Tests for OG Preview service."""
import sys
import pytest
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from api.services.og_preview import fetch_og_preview, OGPreview


# ── Fixtures: fake HTML pages ──

HTML_FULL_OG = """
<html><head>
<meta property="og:title" content="Test Article">
<meta property="og:description" content="A test description">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:site_name" content="TestSite">
<meta property="og:type" content="article">
<link rel="icon" href="/favicon.ico">
<title>Fallback Title</title>
</head><body></body></html>
"""

HTML_NO_OG = """
<html><head>
<title>Plain Page Title</title>
<meta name="description" content="Plain meta description">
</head><body></body></html>
"""

HTML_RELATIVE_IMAGE = """
<html><head>
<meta property="og:title" content="Relative">
<meta property="og:image" content="/images/hero.png">
</head><body></body></html>
"""

HTML_EMPTY = "<html><head></head><body></body></html>"


@pytest.mark.unit
@pytest.mark.tools
class TestOGPreview:

    @pytest.mark.asyncio
    async def test_full_og_tags(self, httpx_mock):
        httpx_mock.add_response(url="https://example.com/article", text=HTML_FULL_OG)
        result = await fetch_og_preview("https://example.com/article")

        assert result.title == "Test Article"
        assert result.description == "A test description"
        assert result.image == "https://example.com/image.jpg"
        assert result.site_name == "TestSite"
        assert result.og_type == "article"
        assert result.favicon == "https://example.com/favicon.ico"

    @pytest.mark.asyncio
    async def test_fallback_to_title_and_meta(self, httpx_mock):
        httpx_mock.add_response(url="https://example.com/plain", text=HTML_NO_OG)
        result = await fetch_og_preview("https://example.com/plain")

        assert result.title == "Plain Page Title"
        assert result.description == "Plain meta description"
        assert result.image is None

    @pytest.mark.asyncio
    async def test_relative_image_resolved(self, httpx_mock):
        httpx_mock.add_response(url="https://example.com/page", text=HTML_RELATIVE_IMAGE)
        result = await fetch_og_preview("https://example.com/page")

        assert result.image == "https://example.com/images/hero.png"

    @pytest.mark.asyncio
    async def test_empty_html(self, httpx_mock):
        httpx_mock.add_response(url="https://example.com/empty", text=HTML_EMPTY)
        result = await fetch_og_preview("https://example.com/empty")

        assert result.title is None
        assert result.description is None

    def test_og_preview_model(self):
        preview = OGPreview(url="https://example.com", title="T", description="D")
        assert preview.url == "https://example.com"
        assert preview.image is None
