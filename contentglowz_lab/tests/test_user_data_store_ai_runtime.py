from unittest.mock import AsyncMock
from types import SimpleNamespace

import pytest

from api.services import crypto as crypto_module
from api.services.user_data_store import UserDataStore


@pytest.mark.asyncio
async def test_get_effective_ai_runtime_mode_defaults_to_byok_when_missing(monkeypatch):
    store = UserDataStore()
    monkeypatch.setattr(
        store,
        "get_user_settings",
        AsyncMock(return_value={"robotSettings": {}}),
    )

    mode = await store.get_effective_ai_runtime_mode("user-1")
    assert mode == "byok"


@pytest.mark.asyncio
async def test_get_effective_ai_runtime_mode_reads_persisted_value(monkeypatch):
    store = UserDataStore()
    monkeypatch.setattr(
        store,
        "get_user_settings",
        AsyncMock(return_value={"robotSettings": {"aiRuntime": {"mode": "platform"}}}),
    )

    mode = await store.get_effective_ai_runtime_mode("user-1")
    assert mode == "platform"


@pytest.mark.asyncio
async def test_set_ai_runtime_mode_persists_nested_robot_settings(monkeypatch):
    store = UserDataStore()
    update = AsyncMock(return_value={"ok": True})
    monkeypatch.setattr(store, "update_user_settings", update)

    await store.set_ai_runtime_mode("user-1", "platform")

    update.assert_awaited_once_with(
        "user-1",
        {"robotSettings": {"aiRuntime": {"mode": "platform"}}},
    )


@pytest.mark.asyncio
async def test_set_ai_runtime_mode_rejects_unknown_value():
    store = UserDataStore()
    with pytest.raises(ValueError):
        await store.set_ai_runtime_mode("user-1", "enterprise")


@pytest.mark.asyncio
async def test_consume_github_oauth_state_uses_atomic_returning_update(monkeypatch):
    monkeypatch.setenv("USER_SECRETS_MASTER_KEY", "unit-test-master-key")
    store = UserDataStore()
    store.db_client = AsyncMock()
    store.db_client.execute = AsyncMock(
        return_value=SimpleNamespace(rows=[("user-1",)])
    )

    user_id = await store.consume_github_oauth_state("state-123")

    assert user_id == "user-1"
    sql = store.db_client.execute.await_args_list[0].args[0]
    assert "RETURNING userId" in sql


@pytest.mark.asyncio
async def test_consume_github_oauth_state_falls_back_when_returning_unsupported(monkeypatch):
    monkeypatch.setenv("USER_SECRETS_MASTER_KEY", "unit-test-master-key")
    store = UserDataStore()
    store.db_client = AsyncMock()
    store.db_client.execute = AsyncMock(
        side_effect=[
            RuntimeError("SQL_PARSE_ERROR near RETURNING"),
            SimpleNamespace(rows=[("user-1", 0)]),
            SimpleNamespace(rows=[]),
        ]
    )

    user_id = await store.consume_github_oauth_state("state-123")

    assert user_id == "user-1"
    assert store.db_client.execute.await_count == 3


@pytest.mark.asyncio
async def test_github_store_operations_require_master_key(monkeypatch):
    store = UserDataStore()
    store.db_client = AsyncMock()
    monkeypatch.delenv("USER_SECRETS_MASTER_KEY", raising=False)

    with pytest.raises(
        RuntimeError,
        match="USER_SECRETS_MASTER_KEY is required for GitHub integration operations.",
    ):
        await store.get_github_integration("user-1")

    with pytest.raises(
        RuntimeError,
        match="USER_SECRETS_MASTER_KEY is required for GitHub integration operations.",
    ):
        await store.create_github_oauth_state("user-1")

    with pytest.raises(
        RuntimeError,
        match="USER_SECRETS_MASTER_KEY is required for GitHub integration operations.",
    ):
        await store.consume_github_oauth_state("state-123")


@pytest.mark.asyncio
async def test_creator_profile_sql_quotes_values_identifier(monkeypatch):
    store = UserDataStore()
    store.db_client = AsyncMock()
    store.db_client.execute = AsyncMock(
        side_effect=[
            SimpleNamespace(rows=[]),
            SimpleNamespace(rows=[]),
            SimpleNamespace(
                rows=[
                    (
                        "profile-1",
                        "user-1",
                        "project-1",
                        "Creator",
                        None,
                        None,
                        '["pragmatic"]',
                        None,
                        1,
                        1,
                    )
                ]
            ),
            SimpleNamespace(
                rows=[
                    (
                        "profile-1",
                        "user-1",
                        "project-1",
                        "Creator",
                        None,
                        None,
                        '["pragmatic"]',
                        None,
                        1,
                        1,
                    )
                ]
            ),
        ]
    )

    await store.ensure_creator_profile_table()
    await store.upsert_creator_profile(
        "user-1",
        {
            "projectId": "project-1",
            "displayName": "Creator",
            "values": ["pragmatic"],
        },
    )

    sql_statements = [call.args[0] for call in store.db_client.execute.await_args_list]
    assert '"values" TEXT' in sql_statements[0]
    assert 'SELECT id, userId, projectId, displayName, voice, positioning,\n                   "values"' in sql_statements[1]
    assert '"values", currentChapterId' in sql_statements[2]


@pytest.mark.asyncio
async def test_creator_profile_update_quotes_values_identifier():
    store = UserDataStore()
    store.db_client = AsyncMock()
    store.db_client.execute = AsyncMock(
        side_effect=[
            SimpleNamespace(
                rows=[
                    (
                        "profile-1",
                        "user-1",
                        "project-1",
                        "Creator",
                        None,
                        None,
                        "[]",
                        None,
                        1,
                        1,
                    )
                ]
            ),
            SimpleNamespace(rows=[]),
            SimpleNamespace(
                rows=[
                    (
                        "profile-1",
                        "user-1",
                        "project-1",
                        "Creator",
                        None,
                        None,
                        '["clear"]',
                        None,
                        1,
                        1,
                    )
                ]
            ),
        ]
    )

    await store.upsert_creator_profile(
        "user-1",
        {
            "projectId": "project-1",
            "values": ["clear"],
        },
    )

    update_sql = store.db_client.execute.await_args_list[1].args[0]
    assert 'SET updatedAt = ?, "values" = ? WHERE id = ?' in update_sql


@pytest.mark.asyncio
async def test_rotate_legacy_github_tokens_encrypts_plaintext_rows(monkeypatch):
    monkeypatch.setenv("USER_SECRETS_MASTER_KEY", "unit-test-master-key")
    monkeypatch.setattr(crypto_module, "_crypto", None)

    store = UserDataStore()
    encrypted_existing = crypto_module.get_crypto().encrypt("ghp_already_encrypted")

    store.db_client = AsyncMock()
    store.db_client.execute = AsyncMock(
        side_effect=[
            SimpleNamespace(
                rows=[
                    ("user-legacy", "ghp_plaintext_token_1234567890"),
                    ("user-encrypted", encrypted_existing),
                    ("user-unknown", "legacy_token_without_known_prefix"),
                ]
            ),
            SimpleNamespace(rows=[]),
        ]
    )

    result = await store.rotate_legacy_github_tokens()

    assert result == {
        "key_configured": True,
        "scanned": 3,
        "rotated": 1,
        "skipped": 1,
    }
    assert store.db_client.execute.await_count == 2

    update_sql = store.db_client.execute.await_args_list[1].args[0]
    update_params = store.db_client.execute.await_args_list[1].args[1]
    assert "UPDATE UserGithubIntegration" in update_sql
    assert update_params[2] == "user-legacy"
    assert update_params[3] == "ghp_plaintext_token_1234567890"
    assert crypto_module.get_crypto().decrypt(update_params[0]) == update_params[3]
