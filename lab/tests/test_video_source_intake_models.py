import pytest
from pydantic import ValidationError

from api.models.video_source_intake import (
    AddLinkRequest,
    AddTextRequest,
    GenerateVideoRequest,
    OpenVideoSourceFolderRequest,
)


def test_intake_requests_forbid_identity_and_storage_provider_fields():
    with pytest.raises(ValidationError):
        OpenVideoSourceFolderRequest(
            project_id="project-1",
            content_id="content-1",
            user_id="forged-user",
        )
    with pytest.raises(ValidationError):
        AddTextRequest(text="Useful source", bucket="private-bucket")
    with pytest.raises(ValidationError):
        AddLinkRequest(url="https://example.com", bunny_storage_key="secret")


def test_generation_request_requires_revision_and_idempotency_key():
    request = GenerateVideoRequest(revision=3, idempotency_key="generate-3")

    assert request.revision == 3
    assert request.idempotency_key == "generate-3"
