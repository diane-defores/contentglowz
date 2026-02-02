"""API routers (organized by domain)"""

from .mesh import router as mesh_router
from .research import router as research_router
from .health import router as health_router
from .projects import router as projects_router

__all__ = [
    "mesh_router",
    "research_router",
    "health_router",
    "projects_router",
]
