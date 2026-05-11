from api.services.project_asset_storage import build_project_asset_storage_descriptor


def test_storage_descriptor_redacts_bunny_uri():
    descriptor = build_project_asset_storage_descriptor(
        storage_uri="bunny://zone/private/path.png",
        status="active",
        media_kind="image",
        mime_type="image/png",
    )

    assert descriptor["state"] == "durable_bunny"
    assert descriptor["redacted_uri"] == "bunny://<redacted>"
    assert descriptor["render_safe"] is True


def test_storage_descriptor_strips_signed_query_tokens():
    descriptor = build_project_asset_storage_descriptor(
        storage_uri="https://assets.b-cdn.net/path/audio.mp3?token=secret",
        status="active",
        media_kind="audio",
        mime_type="audio/mpeg",
    )

    assert descriptor["state"] == "durable_bunny_http"
    assert descriptor["redacted_uri"] == "https://assets.b-cdn.net/path/audio.mp3"
    assert descriptor["refresh_required"] is True


def test_storage_descriptor_blocks_provider_temporary_urls_for_render():
    descriptor = build_project_asset_storage_descriptor(
        storage_uri="https://provider.example/tmp/image.png?sig=secret",
        status="active",
        media_kind="image",
        mime_type="image/png",
    )

    assert descriptor["state"] == "provider_temporary"
    assert descriptor["render_safe"] is False
    assert "secret" not in descriptor["redacted_uri"]
