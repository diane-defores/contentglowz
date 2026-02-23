"""Psychology Engine API Router

Exposes CrewAI agents for narrative synthesis, persona refinement,
and content angle generation. Uses background tasks for long-running
agent operations with polling-based status retrieval.
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from api.models.psychology import (
    NarrativeSynthesisRequest,
    NarrativeSynthesisResult,
    PersonaRefinementRequest,
    AngleGenerationRequest,
    ContentAngleResult,
    AngleSelectionInput,
    MultiFormatExtract,
)
import uuid
import time

router = APIRouter(prefix="/api/psychology", tags=["Psychology Engine"])

# In-memory task tracking (production would use Redis/DB)
_tasks: dict[str, dict] = {}


def _set_task(task_id: str, status: str, result: dict | None = None):
    _tasks[task_id] = {
        "status": status,
        "result": result,
        "updated_at": time.time(),
    }


# ─────────────────────────────────────────────────
# Narrative Synthesis (Creator Brain)
# ─────────────────────────────────────────────────

def _run_synthesis_task(task_id: str, request: NarrativeSynthesisRequest):
    """Background task: run Creator Psychologist agent"""
    try:
        from agents.psychology.creator_psychologist import run_narrative_synthesis

        result = run_narrative_synthesis(
            profile_id=request.profile_id,
            entries=[{"content": eid, "entryType": "reflection"} for eid in request.entry_ids],
            current_voice=request.current_voice,
            current_positioning=request.current_positioning,
            chapter_title=request.chapter_title,
        )
        _set_task(task_id, "completed", result)
    except Exception as e:
        _set_task(task_id, "failed", {"error": str(e)})


@router.post("/synthesize-narrative")
async def synthesize_narrative(
    request: NarrativeSynthesisRequest,
    background_tasks: BackgroundTasks,
):
    """Trigger narrative synthesis from creator entries (async)."""
    task_id = str(uuid.uuid4())
    _set_task(task_id, "running")
    background_tasks.add_task(_run_synthesis_task, task_id, request)
    return {"task_id": task_id, "status": "running"}


@router.get("/synthesis-status/{task_id}")
async def get_synthesis_status(task_id: str):
    """Poll for narrative synthesis result."""
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# ─────────────────────────────────────────────────
# Persona Refinement (Customer Brain)
# ─────────────────────────────────────────────────

def _run_refinement_task(task_id: str, request: PersonaRefinementRequest):
    """Background task: run Audience Analyst agent"""
    try:
        from agents.psychology.audience_analyst import run_persona_refinement

        result = run_persona_refinement(
            persona=request.current_persona,
            analytics_data=request.analytics_data,
            content_performance=request.content_performance,
        )
        _set_task(task_id, "completed", result)
    except Exception as e:
        _set_task(task_id, "failed", {"error": str(e)})


@router.post("/refine-persona")
async def refine_persona(
    request: PersonaRefinementRequest,
    background_tasks: BackgroundTasks,
):
    """Trigger persona refinement using analytics data (async)."""
    task_id = str(uuid.uuid4())
    _set_task(task_id, "running")
    background_tasks.add_task(_run_refinement_task, task_id, request)
    return {"task_id": task_id, "status": "running"}


# ─────────────────────────────────────────────────
# Angle Generation (The Bridge)
# ─────────────────────────────────────────────────

def _run_angle_task(task_id: str, request: AngleGenerationRequest):
    """Background task: run Angle Strategist agent"""
    try:
        from agents.psychology.angle_strategist import run_angle_generation

        result = run_angle_generation(
            creator_voice=request.creator_voice,
            creator_positioning=request.creator_positioning,
            narrative_summary=request.narrative_summary,
            persona_data=request.persona_data,
            content_type=request.content_type.value if request.content_type else None,
            count=request.count,
        )
        _set_task(task_id, "completed", result)
    except Exception as e:
        _set_task(task_id, "failed", {"error": str(e)})


@router.post("/generate-angles")
async def generate_angles(
    request: AngleGenerationRequest,
    background_tasks: BackgroundTasks,
):
    """Trigger content angle generation (async)."""
    task_id = str(uuid.uuid4())
    _set_task(task_id, "running")
    background_tasks.add_task(_run_angle_task, task_id, request)
    return {"task_id": task_id, "status": "running"}


@router.get("/angles-status/{task_id}")
async def get_angles_status(task_id: str):
    """Poll for angle generation result."""
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# ─────────────────────────────────────────────────
# Multi-Format Render
# ─────────────────────────────────────────────────

@router.post("/render-extract", response_model=MultiFormatExtract)
async def render_extract(
    request: AngleSelectionInput,
):
    """Render a selected angle into multiple content format extracts.
    This is a lightweight transform, not a full agent run.
    """
    return MultiFormatExtract(
        angle_id=request.angle_id,
        article_outline=f"# Article based on angle {request.angle_id}\n\n## Introduction\n...\n## Main Points\n...\n## Conclusion\n...",
        newsletter_hook=f"This week, something clicked...",
        social_post=f"Thread: Here's what I learned...",
        video_script_opener=f"Hey, today I want to share...",
    )
