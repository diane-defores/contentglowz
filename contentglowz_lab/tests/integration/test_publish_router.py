from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from api.dependencies.auth import CurrentUser, require_current_user
from api.routers.publish import router as publish_router


class _FakeAsyncClient:
    def __init__(self, response):
        self._response = response
        self.post_calls = []
        self.get_calls = []
        self.delete_calls = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, *args, **kwargs):
        self.post_calls.append((args, kwargs))
        return self._response

    async def get(self, *args, **kwargs):
        self.get_calls.append((args, kwargs))
        return self._response

    async def delete(self, *args, **kwargs):
        self.delete_calls.append((args, kwargs))
        return self._response


def _build_client(*, authenticated: bool = True) -> TestClient:
    app = FastAPI()
    app.include_router(publish_router)
    if authenticated:
        app.dependency_overrides[require_current_user] = lambda: CurrentUser(
            user_id="user_123",
            email="user@example.com",
            bearer_token="test-token",
        )
    return TestClient(app)


def _owned_record(status="approved", metadata=None):
    return SimpleNamespace(
        id="content_1",
        project_id="project_a",
        status=status,
        metadata=metadata or {},
    )


def _authorized_account():
    return {
        "id": "local_acct_1",
        "userId": "user_123",
        "projectId": "project_a",
        "provider": "zernio",
        "platform": "twitter",
        "providerAccountId": "acct_1",
        "providerProfileId": "prof_1",
        "status": "active",
        "isDefault": True,
    }


def test_publish_accounts_requires_auth():
    client = _build_client(authenticated=False)
    response = client.get("/api/publish/accounts?project_id=project_a")
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"


def test_publish_accounts_are_project_scoped():
    client = _build_client()
    account = _authorized_account() | {
        "displayName": "Diane X",
        "username": "diane",
        "avatar": None,
        "createdAt": datetime.fromtimestamp(1),
        "updatedAt": datetime.fromtimestamp(2),
        "lastSyncedAt": datetime.fromtimestamp(3),
    }
    store = SimpleNamespace(
        list_publish_accounts=AsyncMock(return_value=[account]),
    )

    with (
        patch("api.routers.publish.require_owned_project_id", AsyncMock(return_value="project_a")),
        patch("api.routers.publish.user_data_store", store),
    ):
        response = client.get("/api/publish/accounts?project_id=project_a")

    assert response.status_code == 200
    payload = response.json()
    assert payload["accounts"] == [
        {
            "id": "local_acct_1",
            "projectId": "project_a",
            "provider": "zernio",
            "platform": "twitter",
            "accountId": "acct_1",
            "providerAccountId": "acct_1",
            "username": "diane",
            "display_name": "Diane X",
            "displayName": "Diane X",
            "avatar": None,
            "status": "active",
            "isDefault": True,
            "lastSyncedAt": "1970-01-01T00:00:03",
        }
    ]
    store.list_publish_accounts.assert_awaited_once_with(
        "user_123",
        "project_a",
        provider="zernio",
    )


def test_publish_rejects_forged_account_before_provider_call():
    client = _build_client()
    fake_record = _owned_record()
    fake_service = MagicMock()
    fake_service.get_content.return_value = fake_record

    with (
        patch("api.routers.publish.get_status_service", return_value=fake_service),
        patch("api.routers.publish.require_owned_content_record", AsyncMock(return_value=fake_record)),
        patch(
            "api.routers.publish.require_active_publish_account",
            AsyncMock(side_effect=HTTPException(status_code=403, detail="Forbidden")),
        ),
        patch("api.routers.publish.httpx.AsyncClient") as async_client,
    ):
        response = client.post(
            "/api/publish",
            json={
                "content": "Hello world",
                "platforms": [{"platform": "twitter", "account_id": "forged_acct"}],
                "title": "Test publish",
                "content_record_id": "content_1",
                "publish_now": True,
            },
        )

    assert response.status_code == 403
    async_client.assert_not_called()


def test_publish_requires_content_record_id_before_provider_call():
    client = _build_client()

    with patch("api.routers.publish.httpx.AsyncClient") as async_client:
        response = client.post(
            "/api/publish",
            json={
                "content": "Hello world",
                "platforms": [{"platform": "twitter", "account_id": "acct_1"}],
                "publish_now": True,
            },
        )

    assert response.status_code == 422
    async_client.assert_not_called()


def test_publish_persists_metadata_and_published_transitions():
    client = _build_client()
    fake_record = _owned_record(metadata={"existing": "value"})
    fake_service = MagicMock()
    fake_service.get_content.return_value = fake_record

    http_response = MagicMock()
    http_response.status_code = 200
    http_response.headers = {"content-type": "application/json"}
    http_response.json.return_value = {
        "posts": [
            {
                "_id": "post_123",
                "status": "published",
                "platforms": [
                    {
                        "platform": "twitter",
                        "status": "published",
                        "platformPostUrl": "https://x.example/post_123",
                    }
                ],
            }
        ]
    }

    fake_client = _FakeAsyncClient(http_response)
    with (
        patch("api.routers.publish.get_status_service", return_value=fake_service),
        patch("api.routers.publish.require_owned_content_record", AsyncMock(return_value=fake_record)),
        patch("api.routers.publish.require_active_publish_account", AsyncMock(return_value=_authorized_account())),
        patch("api.routers.publish.httpx.AsyncClient", return_value=fake_client),
    ):
        response = client.post(
            "/api/publish",
            json={
                "content": "Hello world",
                "platforms": [{"platform": "twitter", "account_id": "local_acct_1"}],
                "title": "Test publish",
                "content_record_id": "content_1",
                "publish_now": True,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["post_id"] == "post_123"
    assert payload["platform_urls"] == {"twitter": "https://x.example/post_123"}
    assert fake_client.post_calls[0][1]["json"]["platforms"] == [
        {"platform": "twitter", "accountId": "acct_1"}
    ]

    fake_service.update_content.assert_called_once()
    _, kwargs = fake_service.update_content.call_args
    assert kwargs["target_url"] == "https://x.example/post_123"
    assert kwargs["metadata"]["existing"] == "value"
    publish_meta = kwargs["metadata"]["publish"]
    assert publish_meta["provider"] == "zernio"
    assert publish_meta["providerPostId"] == "post_123"
    assert publish_meta["post_id"] == "post_123"
    assert publish_meta["status"] == "published"
    assert publish_meta["platform_urls"] == {"twitter": "https://x.example/post_123"}
    assert publish_meta["platformResults"][0]["status"] == "published"

    assert fake_service.transition.call_count == 2
    assert fake_service.transition.call_args_list[0].args == (
        "content_1",
        "publishing",
        "user_123",
    )
    assert fake_service.transition.call_args_list[1].args == (
        "content_1",
        "published",
        "user_123",
    )


def test_publish_persists_scheduled_state_without_published_transition():
    client = _build_client()
    fake_record = _owned_record()
    fake_service = MagicMock()
    fake_service.get_content.return_value = fake_record

    http_response = MagicMock()
    http_response.status_code = 200
    http_response.headers = {"content-type": "application/json"}
    http_response.json.return_value = {
        "posts": [
            {
                "_id": "post_sched_1",
                "status": "scheduled",
                "scheduledFor": "2026-03-30T10:00:00Z",
                "platforms": [],
            }
        ]
    }

    with (
        patch("api.routers.publish.get_status_service", return_value=fake_service),
        patch("api.routers.publish.require_owned_content_record", AsyncMock(return_value=fake_record)),
        patch("api.routers.publish.require_active_publish_account", AsyncMock(return_value=_authorized_account())),
        patch("api.routers.publish.httpx.AsyncClient", return_value=_FakeAsyncClient(http_response)),
    ):
        response = client.post(
            "/api/publish",
            json={
                "content": "Scheduled post",
                "platforms": [{"platform": "twitter", "account_id": "local_acct_1"}],
                "content_record_id": "content_1",
                "publish_now": False,
                "scheduled_for": "2026-03-30T10:00:00Z",
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "scheduled"

    fake_service.update_content.assert_called_once()
    _, kwargs = fake_service.update_content.call_args
    assert kwargs["target_url"] is None
    assert kwargs["metadata"]["publish"]["status"] == "scheduled"
    assert kwargs["metadata"]["publish"]["scheduled_for"] == "2026-03-30T10:00:00Z"

    fake_service.transition.assert_called_once_with(
        "content_1",
        "scheduled",
        "user_123",
        reason="Queued in Zernio",
    )


def test_publish_partial_is_not_reported_as_full_success_or_published():
    client = _build_client()
    fake_record = _owned_record()
    fake_service = MagicMock()
    fake_service.get_content.return_value = fake_record

    http_response = MagicMock()
    http_response.status_code = 200
    http_response.headers = {"content-type": "application/json"}
    http_response.json.return_value = {
        "post": {
            "_id": "post_partial_1",
            "status": "partial",
            "platforms": [
                {
                    "platform": "twitter",
                    "status": "published",
                    "platformPostUrl": "https://x.example/post_partial_1",
                },
                {
                    "platform": "linkedin",
                    "status": "failed",
                    "error": {"type": "platform_error", "code": "permissions_missing"},
                },
            ],
        }
    }

    with (
        patch("api.routers.publish.get_status_service", return_value=fake_service),
        patch("api.routers.publish.require_owned_content_record", AsyncMock(return_value=fake_record)),
        patch("api.routers.publish.require_active_publish_account", AsyncMock(return_value=_authorized_account())),
        patch("api.routers.publish.httpx.AsyncClient", return_value=_FakeAsyncClient(http_response)),
    ):
        response = client.post(
            "/api/publish",
            json={
                "content": "Partial post",
                "platforms": [{"platform": "twitter", "account_id": "local_acct_1"}],
                "content_record_id": "content_1",
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is False
    assert payload["status"] == "partial"
    fake_service.transition.assert_called_once_with(
        "content_1",
        "publishing",
        "user_123",
        reason="Publishing via Zernio",
    )
    publish_meta = fake_service.update_content.call_args.kwargs["metadata"]["publish"]
    assert publish_meta["retryAvailable"] is True
    assert publish_meta["errors"][0]["code"] == "permissions_missing"


def test_connect_url_is_project_scoped_and_uses_backend_state():
    client = _build_client()
    http_response = MagicMock()
    http_response.status_code = 200
    http_response.headers = {"content-type": "application/json"}
    http_response.json.return_value = {"authUrl": "https://zernio.example/oauth"}
    store = SimpleNamespace(
        create_publish_connect_session=AsyncMock(
            return_value={
                "state": "opaque_state",
                "expiresAt": datetime.fromtimestamp(900),
            }
        )
    )

    with (
        patch("api.routers.publish.require_owned_project_id", AsyncMock(return_value="project_a")),
        patch("api.routers.publish._ensure_zernio_profile", AsyncMock(return_value={"providerProfileId": "prof_1"})),
        patch("api.routers.publish.user_data_store", store),
        patch("api.routers.publish.httpx.AsyncClient", return_value=_FakeAsyncClient(http_response)) as client_factory,
    ):
        response = client.get("/api/publish/connect/twitter?project_id=project_a")

    assert response.status_code == 200
    payload = response.json()
    assert payload["connect_url"] == "https://zernio.example/oauth"
    fake_client = client_factory.return_value
    params = fake_client.get_calls[0][1]["params"]
    assert params["profileId"] == "prof_1"
    assert "state=opaque_state" in params["redirect_url"]
    store.create_publish_connect_session.assert_awaited_once()


def test_connect_callback_refuses_project_that_no_longer_belongs_to_session_user():
    client = _build_client(authenticated=False)
    store = SimpleNamespace(
        consume_publish_connect_session=AsyncMock(
            return_value={
                "state": "opaque_state",
                "userId": "user_123",
                "projectId": "project_a",
                "provider": "zernio",
                "platform": "twitter",
                "providerProfileId": "prof_1",
            }
        )
    )
    project_store = SimpleNamespace(
        get_by_id=AsyncMock(return_value=SimpleNamespace(id="project_a", user_id="other_user"))
    )

    with (
        patch("api.routers.publish.user_data_store", store),
        patch("api.routers.publish.project_store", project_store),
        patch("api.routers.publish._sync_accounts_for_profile", AsyncMock()) as sync_accounts,
    ):
        response = client.get("/api/publish/connect/callback?state=opaque_state")

    assert response.status_code == 403
    sync_accounts.assert_not_awaited()


def test_disconnect_is_local_and_project_scoped():
    client = _build_client()
    store = SimpleNamespace(unlink_publish_account=AsyncMock(return_value=True))

    with (
        patch("api.routers.publish.require_owned_project_id", AsyncMock(return_value="project_a")),
        patch("api.routers.publish.user_data_store", store),
        patch("api.routers.publish.httpx.AsyncClient") as async_client,
    ):
        response = client.delete("/api/publish/accounts/local_acct_1?project_id=project_a")

    assert response.status_code == 200
    assert response.json()["disconnected"] is True
    async_client.assert_not_called()
    store.unlink_publish_account.assert_awaited_once_with(
        "user_123",
        "project_a",
        "local_acct_1",
        provider="zernio",
    )
