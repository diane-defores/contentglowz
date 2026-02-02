"""Pydantic models for API request/response validation"""

from .mesh import (
    AnalyzeRequest,
    AnalyzeResponse,
    BuildMeshRequest,
    BuildMeshResponse,
    ImproveMeshRequest,
    ImproveMeshResponse,
    CompareRequest,
    CompareResponse,
)
from .research import (
    CompetitorAnalysisRequest,
    CompetitorAnalysisResponse,
)
from .project import (
    Framework,
    PackageManager,
    OnboardingStatus,
    TechStackDetection,
    ContentDirectoryConfig,
    ProjectConfigOverrides,
    ProjectSettings,
    Project,
    OnboardProjectRequest,
    OnboardProjectResponse,
    AnalyzeProjectRequest,
    ConfirmProjectRequest,
    UpdateProjectRequest,
    ProjectDetectionResult,
    ProjectResponse,
    ProjectListResponse,
)

__all__ = [
    # Mesh models
    "AnalyzeRequest",
    "AnalyzeResponse",
    "BuildMeshRequest",
    "BuildMeshResponse",
    "ImproveMeshRequest",
    "ImproveMeshResponse",
    "CompareRequest",
    "CompareResponse",
    # Research models
    "CompetitorAnalysisRequest",
    "CompetitorAnalysisResponse",
    # Project models
    "Framework",
    "PackageManager",
    "OnboardingStatus",
    "TechStackDetection",
    "ContentDirectoryConfig",
    "ProjectConfigOverrides",
    "ProjectSettings",
    "Project",
    "OnboardProjectRequest",
    "OnboardProjectResponse",
    "AnalyzeProjectRequest",
    "ConfirmProjectRequest",
    "UpdateProjectRequest",
    "ProjectDetectionResult",
    "ProjectResponse",
    "ProjectListResponse",
]
