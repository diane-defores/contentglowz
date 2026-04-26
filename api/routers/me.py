"""Authenticated account bootstrap endpoints."""

from fastapi import APIRouter, Depends

from agents.seo.config.project_store import project_store
from api.dependencies.auth import CurrentUser, require_current_user
from api.models.bootstrap import BootstrapResponse, MeResponse
from api.services.user_data_store import user_data_store

router = APIRouter(prefix="/api", tags=["Auth"])

_PROJECT_SELECTION_AUTO = "auto"
_PROJECT_SELECTION_SELECTED = "selected"
_PROJECT_SELECTION_NONE = "none"


def _normalize_selection_mode(raw_mode: object) -> str:
    mode = str(raw_mode or _PROJECT_SELECTION_AUTO).strip().lower()
    if mode in {
        _PROJECT_SELECTION_AUTO,
        _PROJECT_SELECTION_SELECTED,
        _PROJECT_SELECTION_NONE,
    }:
        return mode
    return _PROJECT_SELECTION_AUTO


def _is_selectable_project(project) -> bool:
    return getattr(project, "archived_at", None) is None and getattr(project, "deleted_at", None) is None


def _resolve_default_project_id(projects, settings: dict) -> str | None:
    mode = _normalize_selection_mode(settings.get("projectSelectionMode"))
    configured_default = settings.get("defaultProjectId")
    configured_default = configured_default if isinstance(configured_default, str) else None

    selectable_projects = [project for project in projects if _is_selectable_project(project)]

    if mode == _PROJECT_SELECTION_NONE:
        return None

    if mode == _PROJECT_SELECTION_SELECTED:
        return configured_default if any(project.id == configured_default for project in selectable_projects) else None

    if configured_default and any(project.id == configured_default for project in selectable_projects):
        return configured_default

    marked_default = next(
        (project.id for project in selectable_projects if getattr(project, "is_default", False)),
        None,
    )
    if marked_default:
        return marked_default
    return selectable_projects[0].id if selectable_projects else None


@router.get("/me", response_model=MeResponse, summary="Get current authenticated user")
async def get_me(
    current_user: CurrentUser = Depends(require_current_user),
) -> MeResponse:
    """Return the current authenticated user and basic workspace presence."""
    try:
        projects = await project_store.get_by_user(
            current_user.user_id,
            include_archived=True,
            include_deleted=False,
        )
    except Exception:
        projects = []

    try:
        settings = await user_data_store.get_user_settings(current_user.user_id)
    except Exception:
        settings = {}
    default_project_id = _resolve_default_project_id(projects, settings)

    return MeResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        workspace_exists=bool(projects),
        default_project_id=default_project_id,
    )


@router.get(
    "/bootstrap",
    response_model=BootstrapResponse,
    summary="Get bootstrap state for app routing",
)
async def get_bootstrap(
    current_user: CurrentUser = Depends(require_current_user),
) -> BootstrapResponse:
    """Return the minimum authenticated bootstrap state needed by Flutter."""
    try:
        projects = await project_store.get_by_user(
            current_user.user_id,
            include_archived=True,
            include_deleted=False,
        )
    except Exception:
        projects = []

    try:
        settings = await user_data_store.get_user_settings(current_user.user_id)
    except Exception:
        settings = {}
    default_project_id = _resolve_default_project_id(projects, settings)

    user = MeResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        workspace_exists=bool(projects),
        default_project_id=default_project_id,
    )

    return BootstrapResponse(
        user=user,
        projects_count=len(projects),
        default_project_id=default_project_id,
        workspace_status="ready" if projects else "empty",
    )
