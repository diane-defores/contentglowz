from api.main import app


def test_intake_openapi_exposes_separate_ready_generate_and_upload_commands():
    paths = app.openapi()["paths"]
    prefix = "/api/projects/{project_id}/contents/{content_id}/video-sources"

    assert f"{prefix}/folder" in paths
    assert f"{prefix}/folder/{{folder_id}}/ready" in paths
    assert f"{prefix}/folder/{{folder_id}}/generate" in paths
    assert f"{prefix}/folder/{{folder_id}}/uploads" in paths
    assert f"{prefix}/folder/{{folder_id}}/uploads/{{session_id}}/parts/{{part_number}}/sign" in paths
    assert f"{prefix}/folder/{{folder_id}}/uploads/{{session_id}}/complete" in paths


def test_intake_request_schemas_have_no_client_storage_or_identity_authority():
    schemas = app.openapi()["components"]["schemas"]
    names = {
        "OpenVideoSourceFolderRequest",
        "CreateUploadSessionRequest",
        "CompleteUploadSessionRequest",
        "SignUploadPartRequest",
        "GenerateVideoRequest",
    }
    forbidden = {
        "userId", "user_id", "provider", "bucket", "objectKey", "object_key",
        "bunnyStorageKey", "bunny_storage_key", "bunnyCdnHostname", "awsAccessKeyId",
    }

    for name in names:
        properties = set(schemas[name].get("properties", {}))
        assert properties.isdisjoint(forbidden), (name, properties & forbidden)
