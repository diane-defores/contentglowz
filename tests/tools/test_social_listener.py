"""Tests for Social Listener — multi-platform social listening for the Idea Pool."""
import sys
import importlib
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock
from pathlib import Path

import pytest

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Direct import to avoid crewai chain
spec = importlib.util.spec_from_file_location(
    "social_listener",
    project_root / "agents" / "sources" / "social_listener.py",
)
sl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sl)


# ── Fixtures ──

NOW = datetime.now(timezone.utc)


def _make_item(title, platform="reddit", engagement=100, days_ago=3, is_question=False):
    pub = (NOW - timedelta(days=days_ago)).isoformat()
    return {
        "title": title,
        "url": f"https://{platform}.com/test",
        "platform": platform,
        "engagement": engagement,
        "comment_count": 10,
        "author": "testuser",
        "published_at": pub,
        "snippet": f"Snippet for {title}",
        "is_question": is_question,
        "_topic": "test",
        "_exa_score": 0.8,
    }


# ── Question detection ──

@pytest.mark.unit
@pytest.mark.tools
class TestQuestionDetection:

    def test_question_mark(self):
        assert sl._is_question("Is this a good tool?") is True

    def test_how_prefix(self):
        assert sl._is_question("How to build an AI agent") is True

    def test_why_prefix(self):
        assert sl._is_question("Why SEO still matters in 2026") is True

    def test_what_prefix(self):
        assert sl._is_question("What are the best content tools") is True

    def test_not_a_question(self):
        assert sl._is_question("The ultimate guide to SEO") is False

    def test_is_there_prefix(self):
        assert sl._is_question("Is there a free alternative to Ahrefs") is True


# ── Deduplication ──

@pytest.mark.unit
@pytest.mark.tools
class TestDeduplication:

    def test_exact_duplicates_removed(self):
        items = [
            _make_item("AI content marketing guide", engagement=200),
            _make_item("AI content marketing guide", engagement=50),
        ]
        result = sl.deduplicate(items)
        assert len(result) == 1
        assert result[0]["engagement"] == 200  # keeps higher engagement

    def test_near_duplicates_removed(self):
        items = [
            _make_item("How to use AI for content marketing", engagement=300),
            _make_item("How to use AI for content marketing strategy", engagement=100),
        ]
        result = sl.deduplicate(items, threshold=0.5)
        assert len(result) == 1

    def test_different_items_kept(self):
        items = [
            _make_item("AI content marketing guide"),
            _make_item("Python web scraping tutorial"),
        ]
        result = sl.deduplicate(items)
        assert len(result) == 2

    def test_empty_list(self):
        assert sl.deduplicate([]) == []


# ── Convergence detection ──

@pytest.mark.unit
@pytest.mark.tools
class TestConvergence:

    def test_cross_platform_convergence(self):
        items = [
            _make_item("AI content marketing trends 2026", platform="reddit", engagement=200),
            _make_item("AI content marketing trends 2026", platform="hn", engagement=150),
        ]
        result = sl.detect_convergence(items)
        # One item should absorb the other
        converging = [it for it in result if it.get("_convergence_score", 1.0) > 1.0]
        assert len(converging) == 1
        assert converging[0]["_convergence_score"] >= 1.5
        assert len(converging[0]["_convergence_platforms"]) >= 2

    def test_same_platform_no_convergence(self):
        items = [
            _make_item("AI content marketing", platform="reddit", engagement=200),
            _make_item("AI content marketing", platform="reddit", engagement=100),
        ]
        result = sl.detect_convergence(items)
        # Same platform = no convergence bonus
        for it in result:
            assert it.get("_convergence_score", 1.0) == 1.0

    def test_different_topics_no_convergence(self):
        items = [
            _make_item("AI content marketing", platform="reddit"),
            _make_item("Python web scraping", platform="hn"),
        ]
        result = sl.detect_convergence(items)
        for it in result:
            assert it.get("_convergence_score", 1.0) == 1.0


# ── Ranking ──

@pytest.mark.unit
@pytest.mark.tools
class TestRanking:

    def test_higher_engagement_ranks_higher(self):
        items = [
            _make_item("Low engagement post", engagement=10, days_ago=5),
            _make_item("High engagement post", engagement=1000, days_ago=5),
        ]
        ranked = sl.rank_results(items)
        assert ranked[0]["title"] == "High engagement post"

    def test_recent_ranks_higher(self):
        items = [
            _make_item("Old post", engagement=100, days_ago=28),
            _make_item("Fresh post", engagement=100, days_ago=1),
        ]
        ranked = sl.rank_results(items)
        assert ranked[0]["title"] == "Fresh post"

    def test_score_between_0_and_100(self):
        items = [_make_item("Test post", engagement=50, days_ago=10)]
        ranked = sl.rank_results(items)
        assert 0 <= ranked[0]["_score"] <= 100

    def test_empty_list(self):
        assert sl.rank_results([]) == []


# ── HN API parsing ──

@pytest.mark.unit
@pytest.mark.tools
class TestHNParsing:

    @patch("agents.sources.social_listener.httpx.get")
    def test_hn_api_parsing(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "hits": [
                {
                    "title": "Show HN: AI-powered content calendar",
                    "url": "https://example.com/ai-calendar",
                    "objectID": "12345",
                    "points": 250,
                    "num_comments": 89,
                    "author": "hackernewsuser",
                    "created_at": NOW.isoformat(),
                    "story_text": "",
                },
                {
                    "title": "",  # empty title — should be skipped
                    "url": "",
                    "objectID": "99999",
                    "points": 10,
                    "num_comments": 1,
                    "author": "bot",
                    "created_at": NOW.isoformat(),
                },
            ]
        }
        mock_get.return_value = mock_resp

        items = sl._collect_hn(["ai content"], days_back=30)

        assert len(items) == 1
        assert items[0]["title"] == "Show HN: AI-powered content calendar"
        assert items[0]["platform"] == "hn"
        assert items[0]["engagement"] == 250
        assert items[0]["comment_count"] == 89
        assert items[0]["author"] == "hackernewsuser"

    @patch("agents.sources.social_listener.httpx.get")
    def test_hn_api_failure_graceful(self, mock_get):
        mock_get.side_effect = Exception("Network error")
        items = sl._collect_hn(["test"], days_back=30)
        assert items == []


# ── Full flow (mocked) ──

@pytest.mark.unit
@pytest.mark.tools
class TestIngestSocialListeningMocked:

    @patch("agents.sources.social_listener.httpx.get")
    @patch("agents.sources.social_listener._get_exa")
    def test_full_flow(self, mock_get_exa, mock_httpx_get):
        # Mock Exa
        mock_exa = MagicMock()
        mock_result = MagicMock()
        mock_result.title = "Reddit: Best AI writing tools in 2026"
        mock_result.url = "https://reddit.com/r/writing/best-ai-tools"
        mock_result.text = "I've been testing various AI writing tools..."
        mock_result.published_date = (NOW - timedelta(days=5)).isoformat()
        mock_result.score = 0.9

        mock_response = MagicMock()
        mock_response.results = [mock_result]
        mock_exa.search_and_contents.return_value = mock_response
        mock_get_exa.return_value = mock_exa

        # Mock HN
        mock_hn_resp = MagicMock()
        mock_hn_resp.raise_for_status = MagicMock()
        mock_hn_resp.json.return_value = {
            "hits": [
                {
                    "title": "Best AI writing tools in 2026",
                    "url": "https://example.com/ai-tools",
                    "objectID": "111",
                    "points": 180,
                    "num_comments": 45,
                    "author": "hnuser",
                    "created_at": (NOW - timedelta(days=3)).isoformat(),
                    "story_text": "",
                },
            ]
        }
        mock_httpx_get.return_value = mock_hn_resp

        # Mock status service — patch the lazy import inside the function
        mock_svc = MagicMock()
        mock_svc.bulk_create_ideas.return_value = 2

        mock_status_module = MagicMock()
        mock_status_module.get_status_service.return_value = mock_svc

        with patch.dict("sys.modules", {"status": mock_status_module}):
            result = sl.ingest_social_listening(
                topics=["ai writing tools"],
                days_back=30,
                max_ideas=50,
            )

        assert result["count"] == 2
        assert "sources" in result

        # Verify bulk_create_ideas was called
        mock_svc.bulk_create_ideas.assert_called_once()
        call_kwargs = mock_svc.bulk_create_ideas.call_args
        assert call_kwargs.kwargs["source"] == "social_listening"

        items = call_kwargs.kwargs["items"]
        assert len(items) > 0

        # Verify item structure
        item = items[0]
        assert "title" in item
        assert "trending_signals" in item
        assert item["trending_signals"]["source"] == "social_listening"
        assert "social_listening" in item["tags"]

    @patch("agents.sources.social_listener.httpx.get")
    @patch("agents.sources.social_listener._get_exa")
    def test_exa_unavailable_continues_with_hn(self, mock_get_exa, mock_httpx_get):
        """If Exa is not configured, should still collect from HN."""
        mock_get_exa.side_effect = ValueError("EXA_API_KEY not configured")

        mock_hn_resp = MagicMock()
        mock_hn_resp.raise_for_status = MagicMock()
        mock_hn_resp.json.return_value = {
            "hits": [
                {
                    "title": "HN only result",
                    "url": "https://example.com",
                    "objectID": "222",
                    "points": 50,
                    "num_comments": 10,
                    "author": "hn",
                    "created_at": NOW.isoformat(),
                    "story_text": "",
                },
            ]
        }
        mock_httpx_get.return_value = mock_hn_resp

        mock_svc = MagicMock()
        mock_svc.bulk_create_ideas.return_value = 1

        with patch.dict("sys.modules", {"status": MagicMock(get_status_service=lambda: mock_svc)}):
            result = sl.ingest_social_listening(
                topics=["test topic"],
                days_back=30,
            )

        assert result["count"] == 1
        assert result["sources"]["hn"] >= 1
