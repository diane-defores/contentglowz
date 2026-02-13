"""
Scheduler Service - Background task that runs scheduled jobs.

Runs as an asyncio background task inside FastAPI's lifespan.
Checks every 60s for jobs whose next_run_at <= now and dispatches them.
Also auto-transitions scheduled content whose scheduledFor has passed.
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional

from status.service import get_status_service, ContentNotFoundError


class SchedulerService:
    """
    Background scheduler that processes due jobs and auto-publishes
    scheduled content.
    """

    def __init__(self):
        self._running = False
        self._check_interval = 60  # seconds

    async def start(self) -> None:
        """Start the scheduler loop."""
        self._running = True
        print("📅 Scheduler service started (checking every 60s)")

        while self._running:
            try:
                await self._tick()
            except Exception as e:
                print(f"⚠ Scheduler tick error: {e}")

            await asyncio.sleep(self._check_interval)

    def stop(self) -> None:
        """Stop the scheduler loop."""
        self._running = False
        print("📅 Scheduler service stopped")

    async def _tick(self) -> None:
        """Single scheduler tick: process due jobs + auto-transition scheduled content."""
        svc = get_status_service()

        # 1. Process due schedule jobs
        due_jobs = svc.get_due_jobs()
        for job in due_jobs:
            await self._dispatch_job(job)

        # 2. Auto-transition scheduled content whose scheduledFor has passed
        await self._auto_transition_scheduled(svc)

    async def _dispatch_job(self, job: dict) -> None:
        """Dispatch a due job to the appropriate robot."""
        svc = get_status_service()
        job_id = job["id"]
        job_type = job["job_type"]

        print(f"📅 Dispatching job {job_id} (type={job_type})")

        # Mark as running
        svc.update_schedule_job(
            job_id,
            last_run_at=datetime.utcnow().isoformat(),
            last_run_status="running",
        )

        try:
            if job_type == "newsletter":
                await self._run_newsletter_job(job)
            elif job_type == "seo":
                await self._run_seo_job(job)
            elif job_type == "article":
                await self._run_article_job(job)
            else:
                print(f"⚠ Unknown job type: {job_type}")

            # Mark completed and calculate next run
            next_run = self._calculate_next_run(job)
            svc.update_schedule_job(
                job_id,
                last_run_status="completed",
                next_run_at=next_run,
            )
            print(f"✅ Job {job_id} completed. Next run: {next_run}")

        except Exception as e:
            print(f"❌ Job {job_id} failed: {e}")
            next_run = self._calculate_next_run(job)
            svc.update_schedule_job(
                job_id,
                last_run_status="failed",
                next_run_at=next_run,
            )

    async def _run_newsletter_job(self, job: dict) -> None:
        """Run a newsletter generation job."""
        config = job.get("configuration", {})
        generator_id = job.get("generator_id")

        # Import and call the newsletter agent
        try:
            from agents.newsletter.newsletter_agent import generate_newsletter

            result = await asyncio.to_thread(
                generate_newsletter,
                topics=config.get("topics", []),
                target_audience=config.get("target_audience", "general"),
                tone=config.get("tone", "professional"),
                max_sections=config.get("max_sections", 5),
            )

            if result:
                # Create a content record for the generated newsletter
                svc = get_status_service()
                record = svc.create_content(
                    title=result.get("subject_line", "Scheduled Newsletter"),
                    content_type="newsletter",
                    source_robot="newsletter",
                    status="generated",
                    project_id=job.get("project_id"),
                    content_preview=str(result.get("subject_line", ""))[:500],
                    metadata={
                        "generator_id": generator_id,
                        "scheduled_job_id": job["id"],
                    },
                )
                # Save body
                html_content = result.get("html", "")
                if html_content:
                    svc.save_content_body(
                        record.id,
                        html_content,
                        edited_by="scheduler",
                        edit_note="Scheduled generation",
                    )
                # Transition to pending_review
                svc.transition(record.id, "pending_review", "scheduler")

        except ImportError:
            print("⚠ Newsletter agent not available for scheduled generation")
        except Exception as e:
            raise RuntimeError(f"Newsletter generation failed: {e}") from e

    async def _run_seo_job(self, job: dict) -> None:
        """Run an SEO analysis job. Placeholder for future implementation."""
        print(f"ℹ️  SEO job {job['id']} - dispatching not yet implemented")

    async def _run_article_job(self, job: dict) -> None:
        """Run an article generation job. Placeholder for future implementation."""
        print(f"ℹ️  Article job {job['id']} - dispatching not yet implemented")

    async def _auto_transition_scheduled(self, svc) -> None:
        """Auto-transition content whose scheduledFor has passed."""
        now = datetime.utcnow().isoformat()

        # Find all content with status=scheduled and scheduledFor <= now
        scheduled_items = svc.list_content(status="scheduled", limit=100)

        for item in scheduled_items:
            if item.scheduled_for and item.scheduled_for.isoformat() <= now:
                try:
                    svc.transition(
                        item.id,
                        "publishing",
                        "scheduler",
                        reason="Scheduled time reached",
                    )
                    print(f"📅 Auto-transitioning {item.id} to publishing")
                except Exception as e:
                    print(f"⚠ Failed to auto-transition {item.id}: {e}")

    def _calculate_next_run(self, job: dict) -> Optional[str]:
        """Calculate the next run time based on schedule configuration."""
        now = datetime.utcnow()
        schedule = job.get("schedule", "daily")
        schedule_time = job.get("schedule_time", "09:00")
        schedule_day = job.get("schedule_day")

        # Parse target time
        try:
            hour, minute = (int(x) for x in schedule_time.split(":"))
        except (ValueError, AttributeError):
            hour, minute = 9, 0

        if schedule == "daily":
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)
            return next_run.isoformat()

        elif schedule == "weekly":
            day = schedule_day if schedule_day is not None else 0  # Monday
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            days_ahead = day - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_run += timedelta(days=days_ahead)
            return next_run.isoformat()

        elif schedule == "monthly":
            day = schedule_day if schedule_day is not None else 1
            day = min(day, 28)  # Cap at 28 for safety
            next_run = now.replace(day=day, hour=hour, minute=minute, second=0, microsecond=0)
            if next_run <= now:
                # Next month
                if now.month == 12:
                    next_run = next_run.replace(year=now.year + 1, month=1)
                else:
                    next_run = next_run.replace(month=now.month + 1)
            return next_run.isoformat()

        elif schedule == "custom" and job.get("cron_expression"):
            # For custom cron, set next run to 24h from now as fallback
            return (now + timedelta(hours=24)).isoformat()

        return None


# ─── Singleton ────────────────────────────────────────

_scheduler_instance: Optional[SchedulerService] = None


def get_scheduler_service() -> SchedulerService:
    """Get or create the singleton SchedulerService."""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = SchedulerService()
    return _scheduler_instance
