"""Structured audit actor helpers for lifecycle events."""

from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


KNOWN_AGENTS = {
    "scheduler": ("agent", "scheduler", "Scheduler"),
    "scheduler_robot": ("agent", "scheduler", "Scheduler"),
    "drip-scheduler": ("agent", "drip_scheduler", "Drip Scheduler"),
    "drip_scheduler": ("agent", "drip_scheduler", "Drip Scheduler"),
    "drip-executor": ("agent", "drip_executor", "Drip Executor"),
    "drip_executor": ("agent", "drip_executor", "Drip Executor"),
    "template-generator": ("agent", "template_generator", "Template Generator"),
    "template_generator": ("agent", "template_generator", "Template Generator"),
    "article_pipeline": ("agent", "article_pipeline", "Article Pipeline"),
    "newsletter_pipeline": ("agent", "newsletter_pipeline", "Newsletter Pipeline"),
    "short_pipeline": ("agent", "short_pipeline", "Short Pipeline"),
    "social_post_pipeline": ("agent", "social_post_pipeline", "Social Post Pipeline"),
    "images_robot": ("agent", "images", "Images Robot"),
    "newsletter_robot": ("agent", "newsletter", "Newsletter Robot"),
    "seo_robot": ("agent", "seo", "SEO Robot"),
    "short_crew": ("agent", "short_crew", "Short Crew"),
    "social_crew": ("agent", "social_crew", "Social Crew"),
}

KNOWN_SYSTEMS = {
    "system": ("system", "system", "System"),
    "migration": ("system", "migration", "Migration"),
    "webhook": ("system", "webhook", "Webhook"),
}


class AuditActor(BaseModel):
    """Canonical actor identity stored in audit trails."""

    actor_type: str = Field(..., description="Actor type: user, agent, or system")
    actor_id: str = Field(..., description="Stable canonical actor ID")
    actor_label: str = Field(..., description="Human-readable actor label")
    actor_metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional audit context metadata",
    )


def actor_from_user_id(user_id: str, actor_label: Optional[str] = None) -> AuditActor:
    """Create a user actor from a Clerk user id."""

    label = actor_label or user_id
    return AuditActor(actor_type="user", actor_id=user_id, actor_label=label)


def actor_from_agent(agent_id: str, actor_label: Optional[str] = None) -> AuditActor:
    """Create an explicit agent actor from a canonical agent id."""

    canonical = agent_id.strip()
    if canonical in KNOWN_AGENTS:
        actor_type, resolved_id, resolved_label = KNOWN_AGENTS[canonical]
        return AuditActor(
            actor_type=actor_type,
            actor_id=resolved_id,
            actor_label=actor_label or resolved_label,
        )
    return AuditActor(
        actor_type="agent",
        actor_id=canonical,
        actor_label=actor_label or canonical.replace("_", " ").replace("-", " ").title(),
    )


def actor_from_system(system_id: str, actor_label: Optional[str] = None) -> AuditActor:
    """Create an explicit system actor from a canonical system id."""

    canonical = system_id.strip()
    if canonical in KNOWN_SYSTEMS:
        actor_type, resolved_id, resolved_label = KNOWN_SYSTEMS[canonical]
        return AuditActor(
            actor_type=actor_type,
            actor_id=resolved_id,
            actor_label=actor_label or resolved_label,
        )
    return AuditActor(
        actor_type="system",
        actor_id=canonical,
        actor_label=actor_label or canonical.replace("_", " ").replace("-", " ").title(),
    )


def actor_from_string(value: Optional[str]) -> AuditActor:
    """Backfill a structured actor from a legacy string field."""

    raw = (value or "system").strip()
    if raw.startswith("user_"):
        return actor_from_user_id(raw)

    if raw in KNOWN_SYSTEMS:
        actor_type, actor_id, actor_label = KNOWN_SYSTEMS[raw]
        return AuditActor(actor_type=actor_type, actor_id=actor_id, actor_label=actor_label)

    if raw in KNOWN_AGENTS:
        actor_type, actor_id, actor_label = KNOWN_AGENTS[raw]
        return AuditActor(actor_type=actor_type, actor_id=actor_id, actor_label=actor_label)

    return AuditActor(actor_type="agent", actor_id=raw, actor_label=raw.replace("_", " ").replace("-", " ").title())


def coerce_actor(value: str | AuditActor) -> AuditActor:
    """Normalize a legacy actor string or structured actor."""

    if isinstance(value, AuditActor):
        return value
    return actor_from_string(value)
