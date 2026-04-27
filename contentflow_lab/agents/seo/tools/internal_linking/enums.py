"""Shared enums for the internal linking tools suite."""

from enum import Enum


class LinkType(str, Enum):
    """Types of internal links."""
    PILLAR_TO_CLUSTER = "pillar_to_cluster"
    CLUSTER_TO_PILLAR = "cluster_to_pillar"
    CONVERSION = "conversion"
    PERSONALIZED = "personalized"
    FUNNEL_TRANSITION = "funnel_transition"
    HYBRID_OBJECTIVE = "hybrid_objective"


class ConversionObjective(str, Enum):
    """Business conversion objectives."""
    LEAD_GENERATION = "lead_generation"
    DEMO_REQUEST = "demo_request"
    TRIAL_SIGNUP = "trial_signup"
    PURCHASE = "purchase"
    CONSULTATION = "consultation"
    WEBINAR_REGISTRATION = "webinar_registration"
