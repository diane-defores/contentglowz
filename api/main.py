"""
SEO Robots FastAPI Server

Production-grade API server exposing Python SEO agents to Next.js dashboard.
Uses FastAPI 0.128.0 (latest) with modern best practices.

Architecture:
- REST API for synchronous operations
- WebSocket for real-time streaming
- Dependency injection for agents
- Auto-generated OpenAPI docs
- CORS enabled for Next.js frontend

Run with:
    uvicorn api.main:app --reload --port 8000

Docs:
    http://localhost:8000/docs (Swagger UI)
    http://localhost:8000/redoc (ReDoc)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from api.routers import mesh_router, research_router, health_router, projects_router, newsletter_router, deployment_router


# ─────────────────────────────────────────────────
# Lifespan events (startup/shutdown)
# ─────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup/shutdown events
    
    Startup:
    - Load agents into memory
    - Initialize connections
    
    Shutdown:
    - Cleanup resources
    - Close connections
    """
    # Startup
    print("🚀 Starting SEO Robots API...")
    print(f"📍 Project root: {project_root}")
    print("✅ Loading Python agents...")
    
    # Pre-load agents (optional, for faster first request)
    # Note: Agents will be loaded on-demand when endpoints are called
    print("ℹ️  Agents will be loaded on-demand (lazy loading enabled)")
    
    print("✅ API ready to serve requests")
    
    yield
    
    # Shutdown
    print("👋 Shutting down SEO Robots API...")


# ─────────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────────

app = FastAPI(
    title="SEO Robots API",
    description="""
    🤖 **Multi-Agent SEO Automation System**
    
    Production-grade API exposing Python SEO agents for:
    - **Topical Mesh Analysis** - Audit & improve website structure
    - **Content Strategy** - Generate semantic cocoons
    - **Research & Analysis** - Competitor intelligence
    
    Built with:
    - **FastAPI 0.128.0** (latest stable)
    - **CrewAI** multi-agent orchestration
    - **Pydantic AI** structured validation
    - **NetworkX** graph-based authority calculation
    
    ## Features
    
    - ✅ REST API with auto-validation
    - ✅ WebSocket for real-time streaming
    - ✅ Auto-generated documentation
    - ✅ Type-safe with Pydantic
    - ✅ Dependency injection
    - ✅ Background tasks support
    - ✅ CORS enabled for Next.js
    
    ## Quick Start
    
    ```python
    # Analyze existing website
    POST /api/mesh/analyze
    {
      "repo_url": "https://github.com/user/site"
    }
    
    # Build new mesh
    POST /api/mesh/build
    {
      "main_topic": "Digital Marketing",
      "subtopics": ["SEO", "Social Media"]
    }
    ```
    
    ## WebSocket Real-time
    
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/api/mesh/analyze-stream')
    ws.send(JSON.stringify({ repo_url: "https://github.com/..." }))
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log(`Progress: ${data.percent}%`)
    }
    ```
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "SEO Robots Team",
        "url": "https://github.com/yourusername/my-robots",
    },
    license_info={
        "name": "MIT",
    }
)


# ─────────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────────

# CORS - Allow Next.js frontend to call API
# Note: FastAPI CORS middleware doesn't support wildcard subdomains (*.vercel.app)
# Using allow_origin_regex for flexible subdomain matching
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev
        "http://localhost:3001",      # Alternative port
        "http://127.0.0.1:3000",      # Alternative localhost
        "https://bizflowz.com",       # Production domain
        "https://www.bizflowz.com",   # Production domain
    ],
    allow_origin_regex=r"https://.*\.(vercel\.app|railway\.app|render\.com)$",
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


# ─────────────────────────────────────────────────
# Exception Handlers
# ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "type": type(exc).__name__
        }
    )


# ─────────────────────────────────────────────────
# Include Routers
# ─────────────────────────────────────────────────

# Health & monitoring (no prefix)
app.include_router(health_router)

# Domain routers (with /api prefix)
app.include_router(mesh_router)
app.include_router(research_router)
app.include_router(projects_router)
app.include_router(newsletter_router)
app.include_router(deployment_router)


# ─────────────────────────────────────────────────
# Run Server
# ─────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🚀 SEO ROBOTS API SERVER")
    print("="*60)
    print("\n📚 Documentation:")
    print("   Swagger UI: http://localhost:8000/docs")
    print("   ReDoc:      http://localhost:8000/redoc")
    print("\n🔗 Endpoints:")
    print("   Health:     http://localhost:8000/health")
    print("   Analyze:    POST http://localhost:8000/api/mesh/analyze")
    print("   Build:      POST http://localhost:8000/api/mesh/build")
    print("   WebSocket:  ws://localhost:8000/api/mesh/analyze-stream")
    print("   Projects:   POST http://localhost:8000/api/projects/onboard")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
