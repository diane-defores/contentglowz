"""Request/Response models for Content Drip (progressive publishing) endpoints."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum


# ─── Enums ───────────────────────────────────────────


class DripPlanStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CadenceMode(str, Enum):
    FIXED = "fixed"
    RAMP_UP = "ramp_up"
    CUSTOM = "custom"


class ClusterMode(str, Enum):
    AUTO = "auto"
    DIRECTORY = "directory"
    TAGS = "tags"
    MANUAL = "manual"
    NONE = "none"


class GatingMethod(str, Enum):
    FUTURE_DATE = "future_date"
    DRAFT_FLAG = "draft_flag"
    BOTH = "both"
    CUSTOM = "custom"


class RebuildMethod(str, Enum):
    WEBHOOK = "webhook"
    GITHUB_ACTIONS = "github_actions"
    MANUAL = "manual"
    LOCAL_SCRIPT = "local_script"


class SSGFramework(str, Enum):
    ASTRO = "astro"
    NEXT = "next"
    HUGO = "hugo"
    JEKYLL = "jekyll"
    ELEVENTY = "eleventy"
    CUSTOM = "custom"


class GSCAuthMethod(str, Enum):
    SERVICE_ACCOUNT = "service_account"
    OAUTH = "oauth"


# ─── Config sub-models ───────────────────────────────


class RampStep(BaseModel):
    from_day: int = Field(..., description="Relative day (0 = start)")
    items_per_day: int = Field(..., ge=1, description="Items per day for this phase")


class CadenceConfig(BaseModel):
    mode: CadenceMode = Field(default=CadenceMode.FIXED)
    items_per_day: int = Field(default=3, ge=1)
    ramp_schedule: Optional[List[RampStep]] = None
    publish_days: List[int] = Field(default=[0, 1, 2, 3, 4], description="0=Mon, 6=Sun")
    publish_time: str = Field(default="06:00", description="Local publish time HH:MM")
    timezone: str = Field(default="Europe/Paris")
    start_date: str = Field(..., description="ISO date YYYY-MM-DD")


class ClusterStrategy(BaseModel):
    mode: ClusterMode = Field(default=ClusterMode.DIRECTORY)
    pillar_first: bool = Field(default=True, description="Publish pillar before spokes")
    cluster_gap_days: int = Field(default=0, ge=0, description="Days between clusters")
    min_cluster_size: int = Field(default=3, ge=1)


class SSGConfig(BaseModel):
    framework: SSGFramework = Field(default=SSGFramework.ASTRO)
    gating_method: GatingMethod = Field(default=GatingMethod.FUTURE_DATE)
    rebuild_method: RebuildMethod = Field(default=RebuildMethod.MANUAL)
    rebuild_webhook_url: Optional[str] = None
    rebuild_github_repo: Optional[str] = None
    rebuild_github_branch: str = Field(default="main")
    content_directory: Optional[str] = None
    frontmatter_date_field: str = Field(default="pubDate")
    frontmatter_draft_field: str = Field(default="draft")


class GSCConfig(BaseModel):
    enabled: bool = Field(default=False)
    site_url: Optional[str] = None
    credentials_method: GSCAuthMethod = Field(default=GSCAuthMethod.SERVICE_ACCOUNT)
    submit_urls: bool = Field(default=True)
    max_submissions_per_day: int = Field(default=200)
    check_indexation: bool = Field(default=True)
    indexation_check_delay_hours: int = Field(default=48)


# ─── Requests ────────────────────────────────────────


class CreateDripPlanRequest(BaseModel):
    name: str = Field(..., description="Plan name, e.g. 'GoCharbon Launch'")
    project_id: Optional[str] = None
    cadence: CadenceConfig
    cluster_strategy: ClusterStrategy = Field(default_factory=ClusterStrategy)
    ssg_config: SSGConfig = Field(default_factory=SSGConfig)
    gsc_config: Optional[GSCConfig] = None


class UpdateDripPlanRequest(BaseModel):
    name: Optional[str] = None
    cadence: Optional[CadenceConfig] = None
    cluster_strategy: Optional[ClusterStrategy] = None
    ssg_config: Optional[SSGConfig] = None
    gsc_config: Optional[GSCConfig] = None


# ─── Responses ───────────────────────────────────────


class DripPlanResponse(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str]
    name: str
    status: str

    cadence_config: Dict[str, Any]
    cluster_strategy: Dict[str, Any]
    ssg_config: Dict[str, Any]
    gsc_config: Optional[Dict[str, Any]]

    total_items: int

    started_at: Optional[str]
    completed_at: Optional[str]
    last_drip_at: Optional[str]
    next_drip_at: Optional[str]

    schedule_job_id: Optional[str]

    created_at: str
    updated_at: str


class DripPlanListResponse(BaseModel):
    items: List[DripPlanResponse]
    total: int


class DripStatsResponse(BaseModel):
    total_items: int
    by_status: Dict[str, int]
    clusters: List[Dict[str, Any]]
