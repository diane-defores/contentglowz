"""Projects API endpoints

Handles project onboarding workflow and CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Any

from api.models.project import (
    OnboardProjectRequest,
    OnboardProjectResponse,
    AnalyzeProjectRequest,
    ProjectDetectionResult,
    ConfirmProjectRequest,
    UpdateProjectRequest,
    ProjectResponse,
    ProjectListResponse,
    Project,
    OnboardingStatus,
)
from agents.seo.services.project_onboarding import project_onboarding_service
from agents.seo.config.project_store import project_store


router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"],
    responses={404: {"description": "Project not found"}},
)


# ─────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────

def get_current_user_id() -> str:
    """
    Get current user ID from auth.

    TODO: Implement actual auth when ready.
    For now, returns a default user ID for development.
    """
    return "default-user"


def project_to_response(project: Project) -> ProjectResponse:
    """Convert Project model to response format."""
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        name=project.name,
        url=project.url,
        type=project.type,
        description=project.description,
        is_default=project.is_default,
        settings=project.settings,
        last_analyzed_at=project.last_analyzed_at,
        created_at=project.created_at
    )


# ─────────────────────────────────────────────────
# Onboarding Endpoints
# ─────────────────────────────────────────────────

@router.post(
    "/onboard",
    response_model=OnboardProjectResponse,
    summary="Start project onboarding",
    description="""
    Start the onboarding process for a new project.

    **What it does:**
    - Creates a new project record
    - Prepares for repository analysis
    - Returns project_id for subsequent steps

    **Next step:** Call `/api/projects/{id}/analyze` to analyze the repository.

    **Example:**
    ```json
    {
      "github_url": "https://github.com/user/my-site"
    }
    ```
    """
)
async def onboard_project(request: OnboardProjectRequest) -> OnboardProjectResponse:
    """Start onboarding a new project."""
    user_id = get_current_user_id()

    return await project_onboarding_service.initiate_onboarding(
        user_id=user_id,
        github_url=str(request.github_url),
        name=request.name,
        description=request.description
    )


@router.post(
    "/{project_id}/analyze",
    response_model=ProjectDetectionResult,
    summary="Analyze project repository",
    description="""
    Clone and analyze the project repository.

    **What it does:**
    - Clones the GitHub repository
    - Detects framework (Astro, Next.js, etc.)
    - Detects package manager (npm, yarn, pnpm)
    - Finds content directories
    - Counts content files

    **Next step:** Call `/api/projects/{id}/confirm` to confirm or override settings.

    **Returns:**
    - Detected tech stack with confidence score
    - List of content directories
    - Suggested primary content directory
    """
)
async def analyze_project(
    project_id: str,
    request: AnalyzeProjectRequest = AnalyzeProjectRequest()
) -> ProjectDetectionResult:
    """Analyze project repository and detect settings."""
    try:
        return await project_onboarding_service.analyze_project(
            project_id=project_id,
            force_reclone=request.force_reclone
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/{project_id}/confirm",
    response_model=ProjectResponse,
    summary="Confirm project settings",
    description="""
    Confirm or override the detected project settings.

    **What it does:**
    - Accepts auto-detected settings OR
    - Applies user overrides for content directory
    - Applies configuration overrides
    - Marks onboarding as complete

    **Example - Accept detected settings:**
    ```json
    {
      "project_id": "uuid-here",
      "confirmed": true
    }
    ```

    **Example - Override content directory:**
    ```json
    {
      "project_id": "uuid-here",
      "confirmed": false,
      "content_directory_override": {
        "path": "blog",
        "auto_detected": false,
        "file_extensions": [".md", ".mdx"]
      }
    }
    ```
    """
)
async def confirm_project(
    project_id: str,
    request: ConfirmProjectRequest
) -> Any:
    """Confirm or override project settings."""
    # Ensure project_id in path matches request
    if request.project_id != project_id:
        request.project_id = project_id

    try:
        project = await project_onboarding_service.confirm_project(request)
        return project_to_response(project)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─────────────────────────────────────────────────
# CRUD Endpoints
# ─────────────────────────────────────────────────

@router.get(
    "",
    response_model=ProjectListResponse,
    summary="List all projects",
    description="Get all projects for the current user."
)
async def list_projects() -> ProjectListResponse:
    """Get all projects for current user."""
    user_id = get_current_user_id()

    projects = await project_store.get_by_user(user_id)
    default_project = await project_store.get_default_project(user_id)

    return ProjectListResponse(
        projects=[project_to_response(p) for p in projects],
        total=len(projects),
        default_project_id=default_project.id if default_project else None
    )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get project details",
    description="Get full details for a specific project."
)
async def get_project(project_id: str) -> Any:
    """Get project by ID."""
    project = await project_store.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project_to_response(project)


@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update project",
    description="Update project details, content directory, or config overrides."
)
async def update_project(
    project_id: str,
    request: UpdateProjectRequest
) -> Any:
    """Update project details."""
    project = await project_store.update(
        project_id=project_id,
        name=request.name,
        description=request.description,
        content_directory=request.content_directory,
        config_overrides=request.config_overrides
    )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project_to_response(project)


@router.delete(
    "/{project_id}",
    summary="Delete project",
    description="Delete a project. This action cannot be undone."
)
async def delete_project(project_id: str) -> dict:
    """Delete a project."""
    project = await project_store.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await project_store.delete(project_id)
    return {"deleted": True, "project_id": project_id}


@router.post(
    "/{project_id}/set-default",
    response_model=ProjectResponse,
    summary="Set default project",
    description="Set this project as the user's default project."
)
async def set_default_project(project_id: str) -> Any:
    """Set project as default."""
    user_id = get_current_user_id()

    project = await project_store.set_default(user_id, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project_to_response(project)


@router.post(
    "/{project_id}/refresh",
    response_model=ProjectDetectionResult,
    summary="Refresh project analysis",
    description="""
    Re-analyze the project repository.

    **What it does:**
    - Pulls latest changes from GitHub
    - Re-detects tech stack
    - Updates content directory detection
    - Preserves user config overrides

    Useful when the repository has changed.
    """
)
async def refresh_project(project_id: str) -> ProjectDetectionResult:
    """Re-analyze project repository."""
    try:
        return await project_onboarding_service.refresh_analysis(project_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
