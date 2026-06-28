from datetime import datetime, timezone

from api.models.project_intelligence import (
    ProjectIntelligenceJob,
    ProjectIntelligenceRecommendation,
    ProjectIntelligenceStatusResponse,
)


def test_project_intelligence_job_aliases_roundtrip():
    now = datetime.now(timezone.utc)
    job = ProjectIntelligenceJob(
        id="job-1",
        userId="user-1",
        projectId="project-1",
        jobType="project_intelligence.ingest",
        status="completed",
        summary={"accepted": 1},
        createdAt=now,
        updatedAt=now,
    )
    payload = job.model_dump(by_alias=True)
    assert payload["userId"] == "user-1"
    assert payload["projectId"] == "project-1"
    assert payload["jobType"] == "project_intelligence.ingest"


def test_project_intelligence_recommendation_defaults():
    now = datetime.now(timezone.utc)
    recommendation = ProjectIntelligenceRecommendation(
        id="rec-1",
        userId="user-1",
        projectId="project-1",
        recommendationKey="k-1",
        recommendationType="coverage_gap",
        title="Increase source diversity",
        summary="Use more connectors.",
        createdAt=now,
        updatedAt=now,
    )
    assert recommendation.status == "open"
    assert recommendation.evidence_ids == []


def test_project_intelligence_status_response_embeds_jobs():
    now = datetime.now(timezone.utc)
    status = ProjectIntelligenceStatusResponse(
        projectId="project-1",
        counts={"sources": 2},
        activeJob=ProjectIntelligenceJob(
            id="job-1",
            userId="user-1",
            projectId="project-1",
            jobType="project_intelligence.sync",
            status="running",
            summary={},
            createdAt=now,
            updatedAt=now,
        ),
    )
    assert status.project_id == "project-1"
    assert status.active_job is not None
    assert status.active_job.status == "running"
