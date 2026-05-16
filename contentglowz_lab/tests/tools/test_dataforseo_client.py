"""Tests for DataForSEO client standard task support."""
import importlib.util
import sys
import types
from pathlib import Path

import pytest

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

module_path = project_root / "agents" / "seo" / "tools" / "dataforseo_client.py"
sys.modules.setdefault(
    "dotenv",
    types.SimpleNamespace(load_dotenv=lambda *args, **kwargs: None),
)
spec = importlib.util.spec_from_file_location("test_dataforseo_client_module", module_path)
dataforseo_client_module = importlib.util.module_from_spec(spec)
assert spec is not None and spec.loader is not None
spec.loader.exec_module(dataforseo_client_module)

DataForSEOClient = dataforseo_client_module.DataForSEOClient
DataForSEOError = dataforseo_client_module.DataForSEOError


class _FakeResponse:
    def __init__(self, body: dict, status_code: int = 200, text: str = ""):
        self._body = body
        self.status_code = status_code
        self.text = text or str(body)

    def json(self):
        return self._body


@pytest.mark.unit
@pytest.mark.tools
class TestDataForSEOClient:
    def test_serp_google_organic_task_post_returns_task_id(self, monkeypatch):
        def fake_post(url, headers, json, timeout):
            assert url.endswith("/serp/google/organic/task_post")
            assert json[0]["keyword"] == "content marketing"
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "task-123",
                            "status_code": 20100,
                            "status_message": "Task Created.",
                        }
                    ],
                }
            )

        monkeypatch.setattr("requests.post", fake_post)

        client = DataForSEOClient(login="demo", password="demo")
        task_id = client.serp_google_organic_task_post("content marketing")

        assert task_id == "task-123"

    def test_serp_google_organic_task_get_returns_first_result(self, monkeypatch):
        def fake_get(url, headers, params, timeout):
            assert url.endswith("/serp/google/organic/task_get/advanced/task-123")
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "task-123",
                            "status_code": 20000,
                            "status_message": "Ok.",
                            "result": [
                                {
                                    "keyword": "content marketing",
                                    "items": [{"type": "organic", "rank_absolute": 1}],
                                }
                            ],
                        }
                    ],
                }
            )

        monkeypatch.setattr("requests.get", fake_get)

        client = DataForSEOClient(login="demo", password="demo")
        result = client.serp_google_organic_task_get("task-123")

        assert result["keyword"] == "content marketing"
        assert result["items"][0]["rank_absolute"] == 1

    def test_task_post_raises_when_task_id_missing(self, monkeypatch):
        def fake_post(url, headers, json, timeout):
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [{"status_code": 20100, "status_message": "Task Created."}],
                }
            )

        monkeypatch.setattr("requests.post", fake_post)

        client = DataForSEOClient(login="demo", password="demo")

        with pytest.raises(DataForSEOError, match="task id"):
            client.serp_google_organic_task_post("content marketing")

    def test_keyword_overview_standard_polls_until_result(self, monkeypatch):
        get_calls = {"count": 0}

        def fake_post(url, headers, json, timeout):
            assert url.endswith("/dataforseo_labs/google/keyword_overview/task_post")
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "kw-task-1",
                            "status_code": 20100,
                            "status_message": "Task Created.",
                        }
                    ],
                }
            )

        def fake_get(url, headers, params, timeout):
            get_calls["count"] += 1
            assert url.endswith("/dataforseo_labs/google/keyword_overview/task_get/kw-task-1")
            if get_calls["count"] == 1:
                return _FakeResponse(
                    {
                        "status_code": 20000,
                        "status_message": "Ok.",
                        "tasks": [
                            {
                                "id": "kw-task-1",
                                "status_code": 40602,
                                "status_message": "Task In Queue.",
                                "result": None,
                            }
                        ],
                    }
                )
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "kw-task-1",
                            "status_code": 20000,
                            "status_message": "Ok.",
                            "result": [
                                {
                                    "items": [
                                        {
                                            "keyword_data": {
                                                "keyword": "content marketing",
                                                "keyword_info": {"search_volume": 1000},
                                            }
                                        }
                                    ]
                                }
                            ],
                        }
                    ],
                }
            )

        monkeypatch.setattr("requests.post", fake_post)
        monkeypatch.setattr("requests.get", fake_get)
        monkeypatch.setattr("time.sleep", lambda *_args, **_kwargs: None)

        client = DataForSEOClient(login="demo", password="demo")
        result = client.keyword_overview_standard(
            ["content marketing"],
            timeout_seconds=5,
            poll_interval_seconds=0.01,
        )

        assert get_calls["count"] == 2
        assert result[0]["keyword_data"]["keyword"] == "content marketing"

    def test_domain_intersection_standard_returns_items(self, monkeypatch):
        def fake_post(url, headers, json, timeout):
            assert url.endswith("/dataforseo_labs/google/domain_intersection/task_post")
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "domain-task-1",
                            "status_code": 20100,
                            "status_message": "Task Created.",
                        }
                    ],
                }
            )

        def fake_get(url, headers, params, timeout):
            assert url.endswith("/dataforseo_labs/google/domain_intersection/task_get/domain-task-1")
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "domain-task-1",
                            "status_code": 20000,
                            "status_message": "Ok.",
                            "result": [
                                {
                                    "items": [
                                        {
                                            "keyword_data": {
                                                "keyword": "seo audit",
                                                "keyword_info": {"search_volume": 500},
                                            }
                                        }
                                    ]
                                }
                            ],
                        }
                    ],
                }
            )

        monkeypatch.setattr("requests.post", fake_post)
        monkeypatch.setattr("requests.get", fake_get)

        client = DataForSEOClient(login="demo", password="demo")
        result = client.domain_intersection_standard(
            targets={"1": "example.com", "2": "competitor.com"},
            timeout_seconds=5,
            poll_interval_seconds=0.01,
        )

        assert result[0]["keyword_data"]["keyword"] == "seo audit"

    def test_ranked_keywords_standard_returns_items(self, monkeypatch):
        def fake_post(url, headers, json, timeout):
            assert url.endswith("/dataforseo_labs/google/ranked_keywords/task_post")
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "ranked-task-1",
                            "status_code": 20100,
                            "status_message": "Task Created.",
                        }
                    ],
                }
            )

        def fake_get(url, headers, params, timeout):
            assert url.endswith("/dataforseo_labs/google/ranked_keywords/task_get/ranked-task-1")
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "ranked-task-1",
                            "status_code": 20000,
                            "status_message": "Ok.",
                            "result": [
                                {
                                    "items": [
                                        {
                                            "keyword_data": {
                                                "keyword": "content strategy",
                                                "keyword_info": {"search_volume": 700},
                                            }
                                        }
                                    ]
                                }
                            ],
                        }
                    ],
                }
            )

        monkeypatch.setattr("requests.post", fake_post)
        monkeypatch.setattr("requests.get", fake_get)

        client = DataForSEOClient(login="demo", password="demo")
        result = client.ranked_keywords_standard(
            target="competitor.com",
            timeout_seconds=5,
            poll_interval_seconds=0.01,
        )

        assert result[0]["keyword_data"]["keyword"] == "content strategy"

    def test_keyword_ideas_standard_returns_items(self, monkeypatch):
        def fake_post(url, headers, json, timeout):
            assert url.endswith("/dataforseo_labs/google/keyword_ideas/task_post")
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "ideas-task-1",
                            "status_code": 20100,
                            "status_message": "Task Created.",
                        }
                    ],
                }
            )

        def fake_get(url, headers, params, timeout):
            assert url.endswith("/dataforseo_labs/google/keyword_ideas/task_get/ideas-task-1")
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "ideas-task-1",
                            "status_code": 20000,
                            "status_message": "Ok.",
                            "result": [
                                {
                                    "items": [
                                        {
                                            "keyword_data": {
                                                "keyword": "ai writer",
                                                "keyword_info": {"search_volume": 1200},
                                            }
                                        }
                                    ]
                                }
                            ],
                        }
                    ],
                }
            )

        monkeypatch.setattr("requests.post", fake_post)
        monkeypatch.setattr("requests.get", fake_get)

        client = DataForSEOClient(login="demo", password="demo")
        result = client.keyword_ideas_standard(
            keywords=["ai writer"],
            timeout_seconds=5,
            poll_interval_seconds=0.01,
        )

        assert result[0]["keyword_data"]["keyword"] == "ai writer"

    def test_keyword_suggestions_standard_returns_items(self, monkeypatch):
        def fake_post(url, headers, json, timeout):
            assert url.endswith("/dataforseo_labs/google/keyword_suggestions/task_post")
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "suggestions-task-1",
                            "status_code": 20100,
                            "status_message": "Task Created.",
                        }
                    ],
                }
            )

        def fake_get(url, headers, params, timeout):
            assert url.endswith("/dataforseo_labs/google/keyword_suggestions/task_get/suggestions-task-1")
            return _FakeResponse(
                {
                    "status_code": 20000,
                    "status_message": "Ok.",
                    "tasks": [
                        {
                            "id": "suggestions-task-1",
                            "status_code": 20000,
                            "status_message": "Ok.",
                            "result": [
                                {
                                    "items": [
                                        {
                                            "keyword_data": {
                                                "keyword": "content marketing",
                                                "keyword_info": {"search_volume": 900},
                                            }
                                        }
                                    ],
                                }
                            ],
                        }
                    ],
                }
            )

        monkeypatch.setattr("requests.post", fake_post)
        monkeypatch.setattr("requests.get", fake_get)

        client = DataForSEOClient(login="demo", password="demo")
        result = client.keyword_suggestions_standard(
            keyword="content",
            timeout_seconds=5,
            poll_interval_seconds=0.01,
        )

        assert result[0]["keyword_data"]["keyword"] == "content marketing"
