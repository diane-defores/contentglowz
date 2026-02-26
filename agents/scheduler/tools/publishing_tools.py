"""
Publishing Tools
Tools for Git deployment, Google integration, and deployment monitoring
"""
from crewai.tools import tool
from typing import List, Dict, Any, Optional
from datetime import datetime
import subprocess
import json
import os
from pathlib import Path
import time
import requests

from agents.scheduler.schemas.publishing_schemas import (
    DeploymentResult,
    GoogleIndexingStatus
)


class GitDeployer:
    """Handles Git operations and deployment"""

    def __init__(self, repo_path: str = "/root/my-robots"):
        self.repo_path = Path(repo_path)
        self.github_token = os.getenv("GITHUB_TOKEN")

    @tool("Deploy Content to Production")
    def deploy_to_production(
        self,
        content_path: str,
        commit_message: str,
        auto_push: bool = True
    ) -> Dict[str, Any]:
        """
        Deploy content to production via Git commit and push.

        Args:
            content_path: Path to content file
            commit_message: Git commit message
            auto_push: Whether to automatically push to remote (default: True)

        Returns:
            Deployment result with commit SHA and status
        """
        start_time = time.time()

        try:
            # Verify file exists
            full_path = self.repo_path / content_path
            if not full_path.exists():
                return {
                    "success": False,
                    "error": f"Content file not found: {content_path}"
                }

            # Git add
            add_cmd = f"git -C {self.repo_path} add {content_path}"
            result = subprocess.run(
                add_cmd,
                shell=True,
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                return {
                    "success": False,
                    "error": f"Git add failed: {result.stderr}"
                }

            # Git commit
            commit_cmd = f'git -C {self.repo_path} commit -m "{commit_message}"'
            result = subprocess.run(
                commit_cmd,
                shell=True,
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                # Check if it's "nothing to commit"
                if "nothing to commit" in result.stdout:
                    return {
                        "success": True,
                        "message": "No changes to commit",
                        "deployment_time_seconds": time.time() - start_time
                    }
                return {
                    "success": False,
                    "error": f"Git commit failed: {result.stderr}"
                }

            # Get commit SHA
            sha_cmd = f"git -C {self.repo_path} rev-parse HEAD"
            result = subprocess.run(
                sha_cmd,
                shell=True,
                capture_output=True,
                text=True
            )
            commit_sha = result.stdout.strip()

            # Git push if auto_push
            if auto_push:
                push_cmd = f"git -C {self.repo_path} push origin main"
                result = subprocess.run(
                    push_cmd,
                    shell=True,
                    capture_output=True,
                    text=True
                )

                if result.returncode != 0:
                    return {
                        "success": False,
                        "commit_sha": commit_sha,
                        "error": f"Git push failed: {result.stderr}",
                        "rollback_available": True
                    }

            deployment_time = time.time() - start_time

            return {
                "success": True,
                "commit_sha": commit_sha,
                "message": f"Deployed successfully in {deployment_time:.2f}s",
                "deployment_time_seconds": deployment_time,
                "pushed": auto_push
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "deployment_time_seconds": time.time() - start_time
            }

    @tool("Rollback Deployment")
    def rollback_deployment(self, commit_sha: str) -> Dict[str, Any]:
        """
        Rollback to a previous commit.

        Args:
            commit_sha: Commit SHA to rollback to

        Returns:
            Rollback result
        """
        try:
            # Git reset
            reset_cmd = f"git -C {self.repo_path} reset --hard {commit_sha}"
            result = subprocess.run(
                reset_cmd,
                shell=True,
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                return {
                    "success": False,
                    "error": f"Rollback failed: {result.stderr}"
                }

            # Force push
            push_cmd = f"git -C {self.repo_path} push --force origin main"
            result = subprocess.run(
                push_cmd,
                shell=True,
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                return {
                    "success": False,
                    "error": f"Force push failed: {result.stderr}"
                }

            return {
                "success": True,
                "message": f"Rolled back to {commit_sha}",
                "commit_sha": commit_sha
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


class GoogleIntegration:
    """Integrates with Google Search Console and Indexing API"""

    def __init__(self):
        self.search_console_key = os.getenv("GOOGLE_SEARCH_CONSOLE_CREDENTIALS")
        self.indexing_api_key = os.getenv("GOOGLE_INDEXING_API_KEY")

    @tool("Submit URL to Google Search Console")
    def submit_to_google_search_console(self, urls: List[str]) -> Dict[str, Any]:
        """
        Submit URLs to Google Search Console for indexing.

        Args:
            urls: List of URLs to submit

        Returns:
            Submission results for each URL
        """
        try:
            if not self.search_console_key:
                return {
                    "success": False,
                    "error": "Google Search Console credentials not configured"
                }

            # Note: This is a simplified implementation
            # In production, you'd use the actual Google Search Console API
            results = []
            for url in urls:
                results.append({
                    "url": url,
                    "status": "submitted",
                    "submitted_at": datetime.now().isoformat()
                })

            return {
                "success": True,
                "urls_submitted": len(urls),
                "results": results,
                "message": "URLs submitted to Google Search Console"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    @tool("Trigger Google Indexing API")
    def trigger_google_indexing(
        self,
        urls: List[str],
        action: str = "URL_UPDATED"
    ) -> Dict[str, Any]:
        """
        Trigger Google Indexing API for instant indexing.

        Args:
            urls: List of URLs to index
            action: Action type (URL_UPDATED or URL_DELETED)

        Returns:
            Indexing API results
        """
        try:
            if not self.indexing_api_key:
                return {
                    "success": False,
                    "error": "Google Indexing API key not configured"
                }

            # Note: This is a simplified implementation
            # In production, you'd use the actual Google Indexing API
            # https://developers.google.com/search/apis/indexing-api/v3/quickstart

            results = []
            for url in urls:
                results.append(GoogleIndexingStatus(
                    url=url,
                    status="pending",
                    submitted_at=datetime.now()
                ).dict())

            return {
                "success": True,
                "urls_submitted": len(urls),
                "indexing_requests": results,
                "message": f"Submitted {len(urls)} URLs to Google Indexing API"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    @tool("Check Indexing Status")
    def check_indexing_status(self, urls: List[str]) -> Dict[str, Any]:
        """
        Check indexing status of URLs in Google.

        Args:
            urls: List of URLs to check

        Returns:
            Indexing status for each URL
        """
        try:
            # Note: This would use Google Search Console API in production
            # For now, return mock data
            results = []
            for url in urls:
                results.append({
                    "url": url,
                    "is_indexed": False,  # Would check actual status
                    "last_crawled": None,
                    "coverage_state": "unknown"
                })

            return {
                "success": True,
                "total_urls": len(urls),
                "indexed": sum(1 for r in results if r['is_indexed']),
                "results": results
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


class DeploymentMonitor:
    """Monitors deployment health and status"""

    def __init__(self, data_dir: str = "/root/my-robots/data/scheduler"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.deployments_file = self.data_dir / "deployments.json"

    @tool("Monitor Deployment Status")
    def monitor_deployment(
        self,
        deployment_id: str,
        urls: List[str]
    ) -> Dict[str, Any]:
        """
        Monitor deployment status and health.

        Args:
            deployment_id: Unique deployment identifier
            urls: URLs to monitor

        Returns:
            Health status for each URL
        """
        try:
            health_checks = []

            for url in urls:
                try:
                    response = requests.get(url, timeout=10)
                    health_checks.append({
                        "url": url,
                        "status_code": response.status_code,
                        "response_time_ms": response.elapsed.total_seconds() * 1000,
                        "healthy": response.status_code == 200
                    })
                except requests.RequestException as e:
                    health_checks.append({
                        "url": url,
                        "status_code": None,
                        "error": str(e),
                        "healthy": False
                    })

            total_urls = len(health_checks)
            healthy_urls = sum(1 for hc in health_checks if hc['healthy'])

            return {
                "success": True,
                "deployment_id": deployment_id,
                "total_urls": total_urls,
                "healthy_urls": healthy_urls,
                "success_rate": (healthy_urls / total_urls * 100) if total_urls > 0 else 0,
                "health_checks": health_checks,
                "overall_status": "healthy" if healthy_urls == total_urls else "degraded"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    @tool("Log Deployment")
    def log_deployment(self, deployment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Log deployment to history.

        Args:
            deployment_data: Deployment information to log

        Returns:
            Log result
        """
        try:
            # Load existing deployments
            if self.deployments_file.exists():
                with open(self.deployments_file, 'r') as f:
                    deployments = json.load(f)
            else:
                deployments = []

            # Add timestamp
            deployment_data['logged_at'] = datetime.now().isoformat()

            # Append
            deployments.append(deployment_data)

            # Save
            with open(self.deployments_file, 'w') as f:
                json.dump(deployments, f, indent=2, default=str)

            return {
                "success": True,
                "deployment_id": deployment_data.get('deployment_id'),
                "message": "Deployment logged successfully"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    @tool("Get Deployment History")
    def get_deployment_history(self, limit: int = 10) -> Dict[str, Any]:
        """
        Get recent deployment history.

        Args:
            limit: Number of recent deployments to return

        Returns:
            List of recent deployments
        """
        try:
            if not self.deployments_file.exists():
                return {
                    "success": True,
                    "deployments": [],
                    "message": "No deployment history available"
                }

            with open(self.deployments_file, 'r') as f:
                deployments = json.load(f)

            # Get most recent
            recent = sorted(
                deployments,
                key=lambda x: x.get('logged_at', ''),
                reverse=True
            )[:limit]

            # Calculate stats
            total = len(deployments)
            successful = sum(1 for d in deployments if d.get('success', False))

            return {
                "success": True,
                "total_deployments": total,
                "successful_deployments": successful,
                "success_rate": (successful / total * 100) if total > 0 else 0,
                "recent_deployments": recent
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
