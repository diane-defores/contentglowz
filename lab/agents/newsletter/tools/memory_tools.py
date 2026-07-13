"""
Project Intelligence context tools for newsletter agents.

The newsletter crew receives a prebuilt, tenant-scoped Project Intelligence
context package before CrewAI starts. These tools expose only that bound context
to agents; they never read an external memory provider and never fall back to
global memory.
"""

from crewai.tools import tool


_runtime_user_id: str | None = None
_runtime_project_id: str | None = None
_runtime_context_prompt: str | None = None


def set_project_context_tool_scope(
    *,
    user_id: str | None,
    project_id: str | None,
    context_prompt: str | None,
) -> None:
    global _runtime_user_id, _runtime_project_id, _runtime_context_prompt
    _runtime_user_id = user_id
    _runtime_project_id = project_id
    _runtime_context_prompt = context_prompt


def clear_project_context_tool_scope() -> None:
    set_project_context_tool_scope(user_id=None, project_id=None, context_prompt=None)


def _bound_context_or_message() -> str:
    if not _runtime_user_id or not _runtime_project_id:
        return "Project Intelligence context unavailable: missing project scope."
    if not _runtime_context_prompt:
        return "Project Intelligence context is explicitly empty for this project."
    return _runtime_context_prompt


@tool
def recall_project_context(query: str) -> str:
    """Return the prebuilt Project Intelligence context for this project scope."""
    context = _bound_context_or_message()
    if "missing project scope" in context.lower():
        return context
    return f"Project Intelligence context for query '{query}':\n{context}"


@tool
def recall_past_newsletters(limit: int = 10) -> str:
    """Return past-generation signals included in the prebuilt context."""
    context = _bound_context_or_message()
    if "missing project scope" in context.lower():
        return context
    return f"Project Intelligence past-generation context (limit {limit}):\n{context}"


@tool
def recall_brand_voice() -> str:
    """Return brand, voice, audience, and style context from Project Intelligence."""
    context = _bound_context_or_message()
    if "missing project scope" in context.lower():
        return context
    return f"Project Intelligence brand/context guidance:\n{context}"


# Backward-compatible names for callers during this migration; these only bind
# prebuilt Project Intelligence context.
set_memory_tool_scope = set_project_context_tool_scope
clear_memory_tool_scope = clear_project_context_tool_scope
