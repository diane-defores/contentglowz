"""
Scheduler Robot - Multi-Agent Content Publishing and Analysis System
Orchestrates 4 specialized agents for automated content scheduling, publishing,
and technical analysis of the site and infrastructure.

Agents:
1. Calendar Manager - Scheduling optimization and queue management
2. Publishing Agent - Content deployment and Google integration
3. Technical SEO Analyzer - Site health and SEO auditing
4. Tech Stack Analyzer - Infrastructure and dependency analysis
"""
from crewai import Crew, Task, Process
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
from pathlib import Path

from agents.scheduler.calendar_manager import create_calendar_manager
from agents.scheduler.publishing_agent import create_publishing_agent
from agents.scheduler.site_health_monitor import create_site_health_monitor
from agents.scheduler.tech_stack_analyzer import create_tech_stack_analyzer
from agents.scheduler.schemas.analysis_schemas import SchedulerReport

# Conditional status tracking (graceful degradation)
try:
    from status import get_status_service
    STATUS_AVAILABLE = True
except ImportError:
    STATUS_AVAILABLE = False


class SchedulerCrew:
    """
    Scheduler Robot Crew orchestrating content publishing and analysis workflows
    """

    def __init__(
        self,
        llm_model: str = "mixtral-8x7b-32768",
        base_url: str = "http://localhost:3000",
        project_path: str = "/root/my-robots"
    ):
        """
        Initialize Scheduler Crew with all agents.

        Args:
            llm_model: LLM model to use for all agents
            base_url: Base URL of the site to analyze
            project_path: Path to project directory
        """
        self.llm_model = llm_model
        self.base_url = base_url
        self.project_path = project_path

        # Initialize agents
        self.calendar_manager = create_calendar_manager(llm_model)
        self.publishing_agent = create_publishing_agent(llm_model)
        self.site_health_monitor = create_site_health_monitor(llm_model, base_url)
        self.tech_stack = create_tech_stack_analyzer(llm_model, project_path)

        # Data directory
        self.data_dir = Path(project_path) / "data" / "scheduler"
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def publish_content_workflow(
        self,
        content_path: str,
        title: str,
        content_type: str = "article",
        priority: int = 3,
        urls: Optional[List[str]] = None,
        auto_schedule: bool = True
    ) -> Dict[str, Any]:
        """
        Complete workflow: Schedule → Publish → Monitor → Index

        Args:
            content_path: Path to content file
            title: Content title
            content_type: Type of content (article, newsletter, etc.)
            priority: Priority level (1-5)
            urls: URLs to publish (if None, will be derived)
            auto_schedule: Whether to automatically schedule

        Returns:
            Complete workflow result
        """
        try:
            workflow_id = f"publish_{int(datetime.now().timestamp())}"

            # Status tracking: transition to scheduled if we have a status_record_id
            status_record_id = kwargs.get("status_record_id") if hasattr(self, '_dummy') else None
            # Check if this content has a tracked status record
            if STATUS_AVAILABLE:
                try:
                    status_svc = get_status_service()
                    # Look for approved content matching this title
                    approved = status_svc.list_content(status="approved", content_type=content_type)
                    for record in approved:
                        if record.title == title or record.content_path == content_path:
                            status_record_id = record.id
                            status_svc.transition(status_record_id, "scheduled", "scheduler_robot", reason="Auto-scheduled for publishing")
                            break
                except Exception as e:
                    print(f"⚠ Status tracking scheduling failed (non-critical): {e}")

            # Step 1: Add to queue and schedule
            content_data = {
                "id": workflow_id,
                "title": title,
                "content_path": content_path,
                "content_type": content_type,
                "priority": priority,
                "source_robot": "manual",  # Or derive from context
                "metadata": {}
            }

            schedule_result = self.calendar_manager.schedule_content(
                content_data=content_data,
                auto_schedule=auto_schedule
            )

            if not schedule_result.get('success'):
                if STATUS_AVAILABLE and status_record_id:
                    try:
                        status_svc = get_status_service()
                        status_svc.transition(status_record_id, "approved", "scheduler_robot", reason="Scheduling failed, reverting")
                    except Exception:
                        pass
                return {
                    "success": False,
                    "workflow_id": workflow_id,
                    "stage": "scheduling",
                    "error": schedule_result.get('error')
                }

            # Status tracking: transition to publishing
            if STATUS_AVAILABLE and status_record_id:
                try:
                    status_svc = get_status_service()
                    status_svc.transition(status_record_id, "publishing", "scheduler_robot")
                except Exception as e:
                    print(f"⚠ Status tracking publishing transition failed: {e}")

            # Step 2: Publish content
            if urls is None:
                # Derive URL from content path (simplified)
                filename = Path(content_path).stem
                urls = [f"{self.base_url}/{filename}"]

            publish_result = self.publishing_agent.publish_content(
                content_path=content_path,
                title=title,
                urls=urls,
                auto_index=True
            )

            if not publish_result.get('success'):
                if STATUS_AVAILABLE and status_record_id:
                    try:
                        status_svc = get_status_service()
                        status_svc.transition(status_record_id, "failed", "scheduler_robot", reason=publish_result.get('error'))
                    except Exception:
                        pass
                return {
                    "success": False,
                    "workflow_id": workflow_id,
                    "stage": "publishing",
                    "scheduling": schedule_result,
                    "error": publish_result.get('error')
                }

            # Step 3: Log completion
            self._log_publish_workflow(
                workflow_id=workflow_id,
                schedule_result=schedule_result,
                publish_result=publish_result
            )

            # Status tracking: mark as published
            if STATUS_AVAILABLE and status_record_id:
                try:
                    status_svc = get_status_service()
                    status_svc.transition(status_record_id, "published", "scheduler_robot", reason="Successfully published")
                    target_url = urls[0] if urls else None
                    if target_url:
                        status_svc.update_content(status_record_id, target_url=target_url)
                except Exception as e:
                    print(f"⚠ Status tracking published transition failed: {e}")

            return {
                "success": True,
                "workflow_id": workflow_id,
                "scheduling": schedule_result,
                "publishing": publish_result,
                "message": f"Content '{title}' published successfully"
            }

        except Exception as e:
            if STATUS_AVAILABLE and status_record_id:
                try:
                    status_svc = get_status_service()
                    status_svc.transition(status_record_id, "failed", "scheduler_robot", reason=str(e))
                except Exception:
                    pass
            return {
                "success": False,
                "workflow_id": workflow_id,
                "error": str(e)
            }

    def weekly_analysis_workflow(
        self,
        max_pages: int = 100,
        include_build_analysis: bool = True
    ) -> Dict[str, Any]:
        """
        Weekly workflow: Audit SEO → Analyze Tech Stack → Generate Report

        Args:
            max_pages: Maximum pages to crawl for SEO audit
            include_build_analysis: Whether to run build analysis

        Returns:
            Comprehensive scheduler report
        """
        try:
            report_id = f"report_{int(datetime.now().timestamp())}"

            # Step 1: Site Health Audit
            seo_audit = self.site_health_monitor.run_full_audit(max_pages=max_pages)

            if not seo_audit.get('success'):
                return {
                    "success": False,
                    "report_id": report_id,
                    "stage": "seo_audit",
                    "error": seo_audit.get('error')
                }

            # Step 2: Tech Stack Analysis
            if include_build_analysis:
                tech_analysis = self.tech_stack.run_full_analysis()
            else:
                # Quick security check only
                tech_analysis = {
                    "analysis_id": f"quick_{report_id}",
                    "analyzed_at": datetime.now().isoformat(),
                    **self.tech_stack.quick_security_check()
                }

            if not tech_analysis.get('success'):
                return {
                    "success": False,
                    "report_id": report_id,
                    "stage": "tech_analysis",
                    "seo_audit": seo_audit,
                    "error": tech_analysis.get('error')
                }

            # Step 3: Get publishing statistics
            publishing_stats = self.calendar_manager.get_queue_status()
            calendar_overview = {
                "total_items_queued": publishing_stats.get('total_items', 0),
                "total_items_scheduled": publishing_stats.get('by_status', {}).get('scheduled', 0),
                "total_items_published": 0,  # Would track this
                "upcoming_publishes": [
                    item['title'] for item in publishing_stats.get('next_items', [])[:5]
                ],
                "conflicts_count": len(self.calendar_manager.detect_conflicts().get('conflicts', [])),
                "next_available_slot": None
            }

            # Step 4: Determine overall status
            seo_score = seo_audit.get('overall_score', 0)
            tech_health = tech_analysis.get('overall_health', 0)

            if (seo_audit.get('critical_issues', 0) > 0 or
                tech_analysis.get('critical_vulnerabilities', 0) > 0):
                overall_status = "critical"
            elif seo_score < 70 or tech_health < 70:
                overall_status = "warning"
            else:
                overall_status = "healthy"

            # Aggregate action items
            action_items = []
            action_items.extend(tech_analysis.get('action_items', []))
            if seo_audit.get('critical_issues', 0) > 0:
                action_items.append(
                    f"CRITICAL: Fix {seo_audit['critical_issues']} critical SEO issues"
                )

            # Aggregate achievements
            achievements = []
            if seo_score > 90:
                achievements.append("Excellent technical SEO score (>90)")
            if tech_analysis.get('critical_vulnerabilities', 0) == 0:
                achievements.append("Zero critical security vulnerabilities")

            # Build trends
            trends = {
                "seo_score": "stable",
                "tech_health": tech_analysis.get('build_metrics', {}).get('build_trend', 'stable'),
                "publishing_frequency": "stable"
            }

            # Create comprehensive report
            report = {
                "report_id": report_id,
                "generated_at": datetime.now().isoformat(),
                "seo_analysis": {
                    "analysis_id": seo_audit.get('audit_id'),
                    "analyzed_at": seo_audit.get('analyzed_at'),
                    "overall_score": seo_score,
                    "page_speed_score": seo_audit.get('page_speed_score', 0),
                    "schema_validity_score": seo_audit.get('schema_validity_score', 0),
                    "internal_linking_score": seo_audit.get('internal_linking_score', 0),
                    "mobile_friendly_score": seo_audit.get('mobile_friendly_score', 0),
                    "accessibility_score": seo_audit.get('accessibility_score', 0),
                    "core_web_vitals": seo_audit.get('core_web_vitals', {}),
                    "schema_validation": seo_audit.get('schema_validation', {}),
                    "internal_linking": seo_audit.get('internal_linking', {}),
                    "issues": seo_audit.get('issues', []),
                    "critical_issues": seo_audit.get('critical_issues', 0),
                    "recommendations": seo_audit.get('recommendations', []),
                    "pages_crawled": seo_audit.get('pages_crawled', 0),
                    "crawl_errors": seo_audit.get('crawl_errors', []),
                    "mobile_friendly": seo_audit.get('mobile_friendly', True),
                    "https_enabled": seo_audit.get('https_enabled', True),
                    "sitemap_valid": seo_audit.get('sitemap_valid', True),
                    "robots_txt_valid": seo_audit.get('robots_txt_valid', True)
                },
                "tech_analysis": tech_analysis,
                "publishing_stats": {
                    "period_start": (datetime.now() - __import__('datetime').timedelta(days=7)).isoformat(),
                    "period_end": datetime.now().isoformat(),
                    "total_publishes": 0,  # Would track
                    "successful_publishes": 0,
                    "failed_publishes": 0,
                    "average_time_to_publish_hours": 0,
                    "average_time_to_index_hours": 0,
                    "publishes_by_type": {},
                    "publishes_by_day": {}
                },
                "calendar_overview": calendar_overview,
                "overall_status": overall_status,
                "action_items": action_items,
                "achievements": achievements,
                "trends": trends
            }

            # Save report
            self._save_report(report)

            return {
                "success": True,
                **report
            }

        except Exception as e:
            return {
                "success": False,
                "report_id": report_id,
                "error": str(e)
            }

    def quick_health_check(self) -> Dict[str, Any]:
        """
        Quick health check across all systems.

        Returns:
            Summary health status
        """
        try:
            # SEO quick check
            seo_health = self.site_health_monitor.quick_health_check()

            # Security quick check
            security_health = self.tech_stack.quick_security_check()

            # Queue status
            queue_status = self.calendar_manager.get_queue_status()

            # Deployment history
            deploy_history = self.publishing_agent.get_deployment_history(limit=5)

            overall_status = "healthy"
            issues = []

            if not seo_health.get('success') or seo_health.get('overall_health') != "healthy":
                overall_status = "warning"
                issues.append("SEO health check failed or needs improvement")

            if security_health.get('status') in ['critical', 'warning']:
                overall_status = security_health['status']
                issues.append(f"Security status: {security_health['status']}")

            return {
                "success": True,
                "overall_status": overall_status,
                "seo_health": seo_health,
                "security_health": security_health,
                "queue_status": queue_status,
                "recent_deployments": deploy_history.get('recent_deployments', []),
                "issues": issues
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def _log_publish_workflow(
        self,
        workflow_id: str,
        schedule_result: Dict,
        publish_result: Dict
    ):
        """Log publish workflow to history"""
        log_file = self.data_dir / "publish_workflows.json"

        if log_file.exists():
            with open(log_file, 'r') as f:
                workflows = json.load(f)
        else:
            workflows = []

        workflows.append({
            "workflow_id": workflow_id,
            "timestamp": datetime.now().isoformat(),
            "schedule_result": schedule_result,
            "publish_result": publish_result
        })

        with open(log_file, 'w') as f:
            json.dump(workflows, f, indent=2, default=str)

    def _save_report(self, report: Dict):
        """Save analysis report"""
        report_file = self.data_dir / f"report_{report['report_id']}.json"

        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)


def create_scheduler_crew(
    llm_model: str = "mixtral-8x7b-32768",
    base_url: str = "http://localhost:3000",
    project_path: str = "/root/my-robots"
) -> SchedulerCrew:
    """
    Factory function to create Scheduler Crew.

    Args:
        llm_model: LLM model for all agents
        base_url: Base URL of the site
        project_path: Project directory path

    Returns:
        Initialized SchedulerCrew instance
    """
    return SchedulerCrew(
        llm_model=llm_model,
        base_url=base_url,
        project_path=project_path
    )


# Example usage
if __name__ == "__main__":
    # Create scheduler crew
    crew = create_scheduler_crew()

    # Run quick health check
    health = crew.quick_health_check()
    print("Health Check:", json.dumps(health, indent=2))

    # Run weekly analysis
    # report = crew.weekly_analysis_workflow(max_pages=50)
    # print("Weekly Report:", json.dumps(report, indent=2))
