from api.services.project_asset_storage import build_project_asset_storage_descriptor
from status.schemas import StorageLocator


def test_s3_locator_is_durable_without_exposing_location():
    locator = StorageLocator(
        provider="s3",
        namespace="canonical-private",
        object_key="projects/project-1/original.mp4",
        version="v1",
        checksum_sha256="a" * 64,
    )

    descriptor = build_project_asset_storage_descriptor(
        storage_locator=locator,
        storage_uri=None,
        status="active",
        media_kind="video",
        mime_type="video/mp4",
    )

    assert descriptor["state"] == "durable_s3"
    assert descriptor["provider"] == "s3"
    assert "object_key" not in descriptor
    assert "namespace" not in descriptor
    assert "projects/project-1" not in str(descriptor)
