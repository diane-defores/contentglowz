"""Pydantic models for Project management and onboarding"""

from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Any, Optional, Literal, List
from enum import Enum
from datetime import datetime


# ─────────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────────

class Framework(str, Enum):
    """Detected web framework types"""
    ASTRO = "astro"
    NEXTJS = "nextjs"
    GATSBY = "gatsby"
    NUXT = "nuxt"
    HUGO = "hugo"
    JEKYLL = "jekyll"
    UNKNOWN = "unknown"


class PackageManager(str, Enum):
    """Package manager types"""
    NPM = "npm"
    YARN = "yarn"
    PNPM = "pnpm"
    PIP = "pip"
    UNKNOWN = "unknown"


class OnboardingStatus(str, Enum):
    """Project onboarding workflow status"""
    PENDING = "pending"
    CLONING = "cloning"
    ANALYZING = "analyzing"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    COMPLETED = "completed"
    FAILED = "failed"


# ─────────────────────────────────────────────────
# Detection Models
# ─────────────────────────────────────────────────

class TechStackDetection(BaseModel):
    """Detected technology stack from repository analysis"""
    framework: Framework = Field(
        default=Framework.UNKNOWN,
        description="Detected web framework"
    )
    framework_version: Optional[str] = Field(
        default=None,
        description="Framework version from package.json"
    )
    package_manager: PackageManager = Field(
        default=PackageManager.UNKNOWN,
        description="Detected package manager"
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Detection confidence (0-1)"
    )


class ContentDirectoryConfig(BaseModel):
    """Content directory configuration"""
    path: str = Field(
        ...,
        description="Path to content directory (e.g., 'src/content')"
    )
    auto_detected: bool = Field(
        default=True,
        description="Whether this was auto-detected or user-specified"
    )
    file_extensions: list[str] = Field(
        default=[".md", ".mdx"],
        description="Content file extensions to process"
    )


class ProjectConfigOverrides(BaseModel):
    """SEO and content configuration overrides"""
    seo_config: Optional[dict] = Field(
        default=None,
        description="SEO-specific configuration overrides"
    )
    linking_config: Optional[dict] = Field(
        default=None,
        description="Internal linking configuration overrides"
    )
    content_config: Optional[dict] = Field(
        default=None,
        description="Content processing configuration overrides"
    )


# ─────────────────────────────────────────────────
# Project Models
# ─────────────────────────────────────────────────

class ProjectSettings(BaseModel):
    """Project settings stored in database JSON field"""
    tech_stack: Optional[TechStackDetection] = None
    content_directories: List[ContentDirectoryConfig] = Field(
        default_factory=list,
        description="Content directories configured by the user (ordered by priority)"
    )
    config_overrides: Optional[ProjectConfigOverrides] = None
    onboarding_status: OnboardingStatus = OnboardingStatus.PENDING
    local_repo_path: Optional[str] = Field(
        default=None,
        description="Local path to cloned repository"
    )
    analytics_enabled: bool = Field(
        default=False,
        description="Whether cookie-free analytics tracking is enabled for this project. "
                    "When enabled, a lightweight script (<1KB) is injected into the site layout "
                    "to collect anonymous pageview data (no cookies, no IP storage, EU-hosted)."
    )

    @model_validator(mode='before')
    @classmethod
    def migrate_single_content_directory(cls, data: dict) -> dict:
        """Backward compat: migrate old single content_directory to content_directories list."""
        if isinstance(data, dict) and 'content_directory' in data and 'content_directories' not in data:
            old = data.pop('content_directory')
            if old is not None:
                data['content_directories'] = [old]
        return data


class Project(BaseModel):
    """Complete project model matching database schema"""
    id: str = Field(..., description="Unique project identifier")
    user_id: str = Field(..., description="Owner user ID")
    name: str = Field(..., description="Project display name")
    url: str = Field(default="", description="Canonical source URL (empty for manual projects)")
    type: str = Field(default="manual", description="Source type: github | website | manual")
    description: Optional[str] = Field(default=None, description="Project description")
    is_default: bool = Field(default=False, description="Whether this is the default project")
    settings: Optional[ProjectSettings] = Field(default=None, description="Project settings JSON")
    last_analyzed_at: Optional[datetime] = Field(default=None, description="Last analysis timestamp")
    archived_at: Optional[datetime] = Field(default=None, description="Archive timestamp")
    deleted_at: Optional[datetime] = Field(default=None, description="Soft delete timestamp")
    created_at: datetime = Field(..., description="Creation timestamp")


# ─────────────────────────────────────────────────
# Request Models
# ─────────────────────────────────────────────────

class OnboardProjectRequest(BaseModel):
    """Request to start project onboarding"""
    source_url: Optional[str] = Field(
        default=None,
        description="Optional project source URL (GitHub or generic public HTTP(S) URL)",
        examples=["https://github.com/user/my-site", "https://example.com"]
    )
    github_url: Optional[str] = Field(
        default=None,
        description="Legacy alias for source_url"
    )
    url: Optional[str] = Field(
        default=None,
        description="Legacy alias for source_url"
    )
    name: Optional[str] = Field(
        default=None,
        description="Optional project name"
    )
    description: Optional[str] = Field(
        default=None,
        description="Optional project description"
    )

    @model_validator(mode="before")
    @classmethod
    def _normalize_source_aliases(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        if data.get("source_url") is not None:
            return data
        source = data.get("github_url")
        if source is None:
            source = data.get("url")
        if source is None:
            return data
        next_data = dict(data)
        next_data["source_url"] = source
        return next_data

    @field_validator("source_url")
    @classmethod
    def _validate_source_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            return ""
        parsed = urlparse(normalized)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("source_url must be a valid HTTP(S) URL")
        return normalized


class AnalyzeProjectRequest(BaseModel):
    """Request to analyze a project"""
    force_reclone: bool = Field(
        default=False,
        description="Force re-clone even if repo exists locally"
    )


class ConfirmProjectRequest(BaseModel):
    """Request to confirm or override project settings"""
    project_id: str = Field(..., description="Project ID to confirm")
    confirmed: bool = Field(
        default=True,
        description="Accept auto-detected settings"
    )
    content_directories_override: Optional[List[ContentDirectoryConfig]] = Field(
        default=None,
        description="Override content directories if not confirmed"
    )
    config_overrides: Optional[ProjectConfigOverrides] = Field(
        default=None,
        description="Additional configuration overrides"
    )
    analytics_enabled: bool = Field(
        default=False,
        description="Enable cookie-free analytics. Injects a lightweight tracking script (<1KB) "
                    "into your site layout. No cookies, no IP storage, EU-hosted. "
                    "Required for pageview analytics, SEO performance tracking, and content insights "
                    "in the dashboard."
    )


class UpdateProjectRequest(BaseModel):
    """Request to update project details"""
    name: Optional[str] = Field(default=None, description="New project name")
    source_url: Optional[str] = Field(
        default=None,
        description="Updated source URL (GitHub or generic public HTTP(S) URL)"
    )
    github_url: Optional[str] = Field(
        default=None,
        description="Legacy alias for source_url"
    )
    url: Optional[str] = Field(
        default=None,
        description="Legacy alias for source_url"
    )
    description: Optional[str] = Field(default=None, description="New description")
    content_directories: Optional[List[ContentDirectoryConfig]] = Field(
        default=None,
        description="Update content directories"
    )
    config_overrides: Optional[ProjectConfigOverrides] = Field(
        default=None,
        description="Update configuration overrides"
    )
    analytics_enabled: Optional[bool] = Field(
        default=None,
        description="Enable or disable cookie-free analytics for this project"
    )

    @model_validator(mode="before")
    @classmethod
    def _normalize_legacy_url_alias(cls, data: dict) -> dict:
        """Backwards compatibility: accept legacy aliases from older clients."""
        if not isinstance(data, dict):
            return data
        if data.get("source_url") is not None:
            return data
        legacy_url = data.get("github_url")
        if legacy_url is None:
            legacy_url = data.get("url")
        if legacy_url is None:
            return data
        next_data = dict(data)
        next_data["source_url"] = legacy_url
        return next_data

    @field_validator("source_url")
    @classmethod
    def _validate_source_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            return ""
        parsed = urlparse(normalized)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("source_url must be a valid HTTP(S) URL")
        return normalized


# ─────────────────────────────────────────────────
# Response Models
# ─────────────────────────────────────────────────

class OnboardProjectResponse(BaseModel):
    """Response from starting project onboarding"""
    project_id: str = Field(..., description="Created project ID")
    status: OnboardingStatus = Field(..., description="Current onboarding status")
    message: str = Field(..., description="Status message")


class ProjectDetectionResult(BaseModel):
    """Result from project analysis/detection"""
    project_id: str = Field(..., description="Project ID")
    tech_stack: TechStackDetection = Field(..., description="Detected technology stack")
    content_directories: list[str] = Field(
        ...,
        description="All detected content directories"
    )
    suggested_content_dir: Optional[str] = Field(
        default=None,
        description="Suggested primary content directory"
    )
    total_content_files: int = Field(
        default=0,
        description="Number of content files found"
    )
    framework_config_found: bool = Field(
        default=False,
        description="Whether framework config file was found"
    )


class ProjectResponse(BaseModel):
    """Full project response"""
    id: str
    user_id: str
    name: str
    url: str
    type: str
    description: Optional[str]
    is_default: bool
    is_archived: bool = False
    is_deleted: bool = False
    settings: Optional[ProjectSettings]
    last_analyzed_at: Optional[datetime]
    archived_at: Optional[datetime]
    deleted_at: Optional[datetime]
    created_at: datetime


class ProjectListResponse(BaseModel):
    """List of projects response"""
    projects: list[ProjectResponse]
    total: int
    default_project_id: Optional[str] = None


# ─────────────────────────────────────────────────
# Content Tree Models
# ─────────────────────────────────────────────────


class ProjectContentTreeDirectory(BaseModel):
    """Represents a directory entry in the project content tree."""

    name: str = Field(..., description="Directory name")
    path: str = Field(..., description="Path relative to repository root")
    has_markdown_files: bool = Field(
        default=False,
        description="Whether the directory subtree contains markdown content files",
    )


class ProjectContentTreeFile(BaseModel):
    """Represents a markdown file entry in the project content tree."""

    name: str = Field(..., description="File name")
    path: str = Field(..., description="Path relative to repository root")


class ProjectContentTreeResponse(BaseModel):
    """Content tree payload for directory browsing."""

    project_id: str = Field(..., description="Project ID")
    current_path: str = Field(..., description="Current directory path")
    parent_path: Optional[str] = Field(
        default=None,
        description="Parent directory path, null when at root",
    )
    directories: List[ProjectContentTreeDirectory] = Field(
        default_factory=list,
        description="Child directories",
    )
    files: List[ProjectContentTreeFile] = Field(
        default_factory=list,
        description="Markdown files in current directory",
    )
