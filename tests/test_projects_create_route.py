import importlib.util
import sys
import types
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from api.models.project import OnboardProjectRequest, OnboardingStatus, Project, ProjectSettings


_PROJECTS_ROUTER_PATH = Path(__file__).resolve().parent.parent / "api" / "routers" / "projects.py"


def _load_projects_router_module(*, project_store_stub: object, user_data_store_stub: object):
    sys.modules.setdefault("agents.scheduler.tools.content_scanner", types.SimpleNamespace(get_content_scanner=lambda: None))
    sys.modules.setdefault("agents.scheduler.tools.cluster_scheduler", types.SimpleNamespace(get_cluster_scheduler=lambda: None))
    sys.modules.setdefault(
        "agents.seo.services.project_onboarding",
        types.SimpleNamespace(project_onboarding_service=None),
    )
    sys.modules.setdefault(
        "agents.seo.config.project_store",
        types.SimpleNamespace(project_store=project_store_stub),
    )
    sys.modules.setdefault(
        "api.services.user_data_store",
        types.SimpleNamespace(user_data_store=user_data_store_stub),
    )
    sys.modules.setdefault(
        "api.dependencies.auth",
        types.SimpleNamespace(CurrentUser=object, require_current_user=lambda: None),
    )

    spec = importlib.util.spec_from_file_location("contentflow_lab_projects_router", _PROJECTS_ROUTER_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.asyncio
async def test_create_project_marks_onboarding_complete_and_sets_default(monkeypatch):
    project = Project(
        id="project-1",
        user_id="user-1",
        name="Project 1",
        url="https://github.com/acme/project-1",
        settings=ProjectSettings(onboarding_status=OnboardingStatus.PENDING),
        created_at=datetime.now(),
    )
    completed_project = project.model_copy(
        update={
            "settings": project.settings.model_copy(update={"onboarding_status": OnboardingStatus.COMPLETED}),
        },
    )

    project_store_stub = SimpleNamespace(
        create=AsyncMock(return_value=project),
        update_onboarding_status=AsyncMock(return_value=completed_project),
        get_by_id=AsyncMock(return_value=completed_project),
    )
    user_data_store_stub = SimpleNamespace(
        get_user_settings=AsyncMock(return_value={}),
        update_user_settings=AsyncMock(),
    )

    router = _load_projects_router_module(
        project_store_stub=project_store_stub,
        user_data_store_stub=user_data_store_stub,
    )

    user = SimpleNamespace(user_id="user-1", email="user@example.com")
    request = OnboardProjectRequest(github_url="https://github.com/acme/project-1")

    response = await router.create_project(request=request, current_user=user)

    assert response.id == "project-1"
    assert response.settings is not None
    assert response.settings.onboarding_status == OnboardingStatus.COMPLETED
    assert response.is_default is True
    user_data_store_stub.update_user_settings.assert_awaited_once_with(
        "user-1",
        {"defaultProjectId": "project-1"},
    )
