"""API routers (organized by domain)"""

from .mesh import router as mesh_router
from .research import router as research_router
from .health import router as health_router
from .projects import router as projects_router
from .newsletter import router as newsletter_router
from .deployment import router as deployment_router
from .images import router as images_router
from .status import router as status_router

__all__ = [
    "mesh_router",
    "research_router",
    "health_router",
    "projects_router",
    "newsletter_router",
    "deployment_router",
    "images_router",
    "status_router",
]
