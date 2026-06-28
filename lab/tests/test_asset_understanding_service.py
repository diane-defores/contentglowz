import pytest

from api.services.asset_understanding import (
    AssetMediaEnvelope,
    AssetUnderstandingCredentialResolver,
    AssetUnderstandingError,
    AssetUnderstandingGuardrails,
)


@pytest.mark.asyncio
async def test_credential_resolver_prefers_user_byok(monkeypatch):
    resolver = AssetUnderstandingCredentialResolver(allow_platform_fallback=True)
    monkeypatch.setenv("GEMINI_API_KEY", "platform-key")

    async def _status(_user_id, *, provider):
        assert provider == "gemini"
        return {"configured": True}

    async def _secret(_user_id, *, provider):
        assert provider == "gemini"
        return "user-secret"

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    resolved = await resolver.resolve(user_id="u-1", provider="gemini_compatible")
    assert resolved.source == "user_byok"
    assert resolved.secret == "user-secret"


@pytest.mark.asyncio
async def test_credential_resolver_falls_back_to_platform(monkeypatch):
    resolver = AssetUnderstandingCredentialResolver(allow_platform_fallback=True)
    monkeypatch.setenv("GEMINI_API_KEY", "platform-key")

    async def _status(_user_id, *, provider):
        assert provider == "gemini"
        return None

    async def _secret(_user_id, *, provider):
        assert provider == "gemini"
        return None

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    resolved = await resolver.resolve(user_id="u-1", provider="gemini_compatible")
    assert resolved.source == "platform"
    assert resolved.secret == "platform-key"


@pytest.mark.asyncio
async def test_credential_resolver_returns_provider_not_configured(monkeypatch):
    resolver = AssetUnderstandingCredentialResolver(allow_platform_fallback=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    async def _status(_user_id, *, provider):
        assert provider == "gemini"
        return None

    async def _secret(_user_id, *, provider):
        assert provider == "gemini"
        return None

    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_credential_status", _status)
    monkeypatch.setattr("api.services.asset_understanding.user_key_store.get_secret", _secret)

    with pytest.raises(AssetUnderstandingError) as exc:
        await resolver.resolve(user_id="u-1", provider="gemini_compatible")
    assert exc.value.code == "provider_not_configured"


def test_guardrails_reject_video_longer_than_source_limit():
    guardrails = AssetUnderstandingGuardrails(max_source_video_seconds=30)
    with pytest.raises(AssetUnderstandingError) as exc:
        guardrails.validate_media(AssetMediaEnvelope(media_type="video", duration_seconds=31))
    assert exc.value.code == "needs_trim"


def test_guardrails_reject_provider_frame_overflow():
    guardrails = AssetUnderstandingGuardrails(max_provider_frames=10)
    with pytest.raises(AssetUnderstandingError) as exc:
        guardrails.validate_media(AssetMediaEnvelope(media_type="video", planned_provider_frames=11))
    assert exc.value.code == "skipped_limit_exceeded"


def test_guardrails_reject_daily_quota_exceeded():
    guardrails = AssetUnderstandingGuardrails(daily_platform_images=3)
    with pytest.raises(AssetUnderstandingError) as exc:
        guardrails.validate_quota(media_type="image", credential_source="platform", used_today=3)
    assert exc.value.code == "quota_exceeded"
