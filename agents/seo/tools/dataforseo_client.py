"""
DataForSEO API v3 Client

Reusable HTTP client for all DataForSEO endpoints.
Uses Basic Auth (login:password base64-encoded).

Docs: https://docs.dataforseo.com/v3/

Usage:
    client = DataForSEOClient()
    results = client.serp_google_organic("content marketing", location_code=2840)
    keywords = client.keyword_overview(["seo tools", "content marketing"])
"""

import os
import logging
import time
from base64 import b64encode
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

BASE_URL = "https://api.dataforseo.com/v3"

# Common location codes
LOCATIONS = {
    "us": 2840,
    "uk": 2826,
    "fr": 2250,
    "de": 2276,
    "ca": 2124,
    "au": 2036,
}

# Common language codes
LANGUAGES = {
    "en": "en",
    "fr": "fr",
    "de": "de",
    "es": "es",
}


class DataForSEOError(Exception):
    """Raised when the DataForSEO API returns an error."""

    def __init__(self, message: str, status_code: int = None, response: dict = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


class DataForSEOClient:
    """
    Client for DataForSEO API v3.

    Requires DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD env vars.
    """

    def __init__(
        self,
        login: Optional[str] = None,
        password: Optional[str] = None,
        timeout: int = 30,
    ):
        self.login = login or os.getenv("DATAFORSEO_LOGIN")
        self.password = password or os.getenv("DATAFORSEO_PASSWORD")

        if not self.login or not self.password:
            raise ValueError(
                "DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set "
                "in environment variables or passed explicitly"
            )

        creds = b64encode(f"{self.login}:{self.password}".encode()).decode()
        self.headers = {
            "Authorization": f"Basic {creds}",
            "Content-Type": "application/json",
        }
        self.timeout = timeout

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _request(
        self,
        method: str,
        endpoint: str,
        *,
        payload: Optional[List[Dict[str, Any]]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Perform a raw DataForSEO HTTP request and return the parsed JSON body."""
        url = f"{BASE_URL}/{endpoint}"

        try:
            if method == "POST":
                resp = requests.post(
                    url,
                    headers=self.headers,
                    json=payload,
                    timeout=self.timeout,
                )
            elif method == "GET":
                resp = requests.get(
                    url,
                    headers=self.headers,
                    params=params,
                    timeout=self.timeout,
                )
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
        except requests.RequestException as e:
            raise DataForSEOError(f"HTTP request failed: {e}")

        if resp.status_code != 200:
            raise DataForSEOError(
                f"HTTP {resp.status_code}: {resp.text[:500]}",
                status_code=resp.status_code,
            )

        try:
            data = resp.json()
        except ValueError as e:
            raise DataForSEOError(f"Invalid JSON response: {e}")

        if data.get("status_code") != 20000:
            raise DataForSEOError(
                f"API error {data.get('status_code')}: {data.get('status_message')}",
                status_code=data.get("status_code"),
                response=data,
            )

        return data

    def _extract_task_results(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Flatten successful task results from a DataForSEO response."""
        tasks = data.get("tasks", [])
        if not tasks:
            return []

        results: List[Dict[str, Any]] = []
        for task in tasks:
            if task.get("status_code") != 20000:
                logger.warning(
                    "Task error %s: %s",
                    task.get("status_code"),
                    task.get("status_message"),
                )
                continue
            task_results = task.get("result") or []
            results.extend(task_results)
        return results

    def _post(self, endpoint: str, payload: List[Dict]) -> List[Dict]:
        """
        POST to a DataForSEO endpoint and return the flattened results array.

        Args:
            endpoint: API path after /v3/ (e.g. "serp/google/organic/live/advanced")
            payload: List of task dicts (DFS always expects a list)

        Returns:
            List of result dicts from the response

        Raises:
            DataForSEOError on HTTP or API-level errors
        """
        data = self._request("POST", endpoint, payload=payload)
        return self._extract_task_results(data)

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """GET a DataForSEO endpoint and return the parsed response body."""
        return self._request("GET", endpoint, params=params)

    def task_post(self, endpoint: str, payload: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Create one or more DataForSEO Standard tasks.

        Returns task metadata, including task ids, instead of live results.
        """
        data = self._request("POST", endpoint, payload=payload)
        return data.get("tasks", [])

    def task_get(self, endpoint: str) -> List[Dict[str, Any]]:
        """
        Fetch results for a previously created Standard task.

        Returns the flattened task results in the same shape as `_post()`.
        """
        data = self._get(endpoint)
        return self._extract_task_results(data)

    def task_get_response(self, endpoint: str) -> List[Dict[str, Any]]:
        """Fetch the raw task metadata array for a Standard task result endpoint."""
        data = self._get(endpoint)
        return data.get("tasks", [])

    def wait_for_task_results(
        self,
        endpoint: str,
        timeout_seconds: int = 30,
        poll_interval_seconds: float = 2.0,
    ) -> List[Dict[str, Any]]:
        """
        Poll a Standard task until it returns results or the timeout expires.
        """
        deadline = time.monotonic() + timeout_seconds
        last_status: Optional[str] = None

        while time.monotonic() <= deadline:
            tasks = self.task_get_response(endpoint)
            if not tasks:
                time.sleep(poll_interval_seconds)
                continue

            results = self._extract_task_results({"tasks": tasks})
            if results:
                return results

            first_task = tasks[0]
            last_status = (
                f"{first_task.get('status_code')}: {first_task.get('status_message')}"
            )
            time.sleep(poll_interval_seconds)

        raise DataForSEOError(
            "Timed out waiting for DataForSEO task results"
            + (f" ({last_status})" if last_status else "")
        )

    @staticmethod
    def _location_code(location: str) -> int:
        """Resolve a location string to a DFS location code."""
        if isinstance(location, int):
            return location
        return LOCATIONS.get(location.lower(), 2840)  # default US

    # ------------------------------------------------------------------
    # SERP
    # ------------------------------------------------------------------

    def serp_google_organic(
        self,
        keyword: str,
        location: str | int = "us",
        language: str = "en",
        depth: int = 10,
    ) -> Dict[str, Any]:
        """
        Live Google organic SERP results.

        Args:
            keyword: Search query
            location: Country code ("us", "fr") or DFS location code (2840)
            language: Language code ("en", "fr")
            depth: Number of results (10, 20, 50, 100)

        Returns:
            Dict with items (organic results), item_types, spell, etc.
        """
        payload = [
            {
                "keyword": keyword,
                "location_code": self._location_code(location),
                "language_code": language,
                "depth": depth,
            }
        ]

        results = self._post("serp/google/organic/live/advanced", payload)
        return results[0] if results else {}

    def serp_google_organic_task_post(
        self,
        keyword: str,
        location: str | int = "us",
        language: str = "en",
        depth: int = 10,
        priority: int = 1,
    ) -> str:
        """
        Create a Standard SERP task and return its DataForSEO task id.

        Standard tasks are useful when you want cheaper, asynchronous execution
        for batch pipelines instead of immediate live results.
        """
        payload = [
            {
                "keyword": keyword,
                "location_code": self._location_code(location),
                "language_code": language,
                "depth": depth,
                "priority": priority,
            }
        ]
        tasks = self.task_post("serp/google/organic/task_post", payload)
        if not tasks:
            raise DataForSEOError("No tasks returned from SERP task_post")
        task_id = tasks[0].get("id")
        if not task_id:
            raise DataForSEOError("SERP task_post response did not include a task id")
        return task_id

    def serp_google_organic_task_get(self, task_id: str) -> Dict[str, Any]:
        """
        Fetch the result of a previously created Standard SERP task.
        """
        results = self.task_get(f"serp/google/organic/task_get/advanced/{task_id}")
        return results[0] if results else {}

    def serp_google_organic_batch_task_post(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
        depth: int = 100,
        priority: int = 1,
    ) -> List[str]:
        """
        Submit multiple SERP tasks in one API call via Standard queue.

        Returns list of task IDs. Each keyword is one task ($0.05/task).
        """
        payload = [
            {
                "keyword": kw,
                "location_code": self._location_code(location),
                "language_code": language,
                "depth": depth,
                "priority": priority,
            }
            for kw in keywords
        ]
        tasks = self.task_post("serp/google/organic/task_post", payload)
        return [t["id"] for t in tasks if t.get("id")]

    # ------------------------------------------------------------------
    # DataForSEO Labs — Keyword Research
    # ------------------------------------------------------------------

    def keyword_overview(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
    ) -> List[Dict[str, Any]]:
        """
        Get keyword metrics: search volume, CPC, competition, difficulty.

        Args:
            keywords: List of keywords (max 1000)
            location: Country code or DFS location code
            language: Language code

        Returns:
            List of keyword data dicts
        """
        payload = [
            {
                "keywords": keywords[:1000],
                "location_code": self._location_code(location),
                "language_code": language,
            }
        ]

        results = self._post(
            "dataforseo_labs/google/keyword_overview/live", payload
        )
        if not results:
            return []
        return results[0].get("items", [])

    def keyword_overview_task_post(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
    ) -> str:
        """Create a Standard keyword overview task and return its task id."""
        payload = [
            {
                "keywords": keywords[:1000],
                "location_code": self._location_code(location),
                "language_code": language,
            }
        ]
        tasks = self.task_post(
            "dataforseo_labs/google/keyword_overview/task_post",
            payload,
        )
        if not tasks:
            raise DataForSEOError("No tasks returned from keyword_overview task_post")
        task_id = tasks[0].get("id")
        if not task_id:
            raise DataForSEOError(
                "keyword_overview task_post response did not include a task id"
            )
        return task_id

    def keyword_overview_task_get(self, task_id: str) -> List[Dict[str, Any]]:
        """Fetch the items for a previously created Standard keyword overview task."""
        results = self.task_get(
            f"dataforseo_labs/google/keyword_overview/task_get/{task_id}"
        )
        if not results:
            return []
        return results[0].get("items", [])

    def keyword_overview_standard(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
        timeout_seconds: int = 30,
        poll_interval_seconds: float = 2.0,
    ) -> List[Dict[str, Any]]:
        """
        Run keyword overview through DataForSEO Standard tasks and wait for results.
        """
        task_id = self.keyword_overview_task_post(
            keywords=keywords,
            location=location,
            language=language,
        )
        results = self.wait_for_task_results(
            f"dataforseo_labs/google/keyword_overview/task_get/{task_id}",
            timeout_seconds=timeout_seconds,
            poll_interval_seconds=poll_interval_seconds,
        )
        if not results:
            return []
        return results[0].get("items", [])

    def keyword_ideas(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
        limit: int = 50,
        include_seed: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Get keyword ideas based on seed keywords.

        Returns related keywords with volume, difficulty, CPC.
        """
        payload = [
            {
                "keywords": keywords,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
                "include_seed_keyword": include_seed,
            }
        ]

        results = self._post(
            "dataforseo_labs/google/keyword_ideas/live", payload
        )
        if not results:
            return []
        return results[0].get("items", [])

    def keyword_ideas_task_post(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
        limit: int = 50,
        include_seed: bool = False,
    ) -> str:
        """Create a Standard keyword idea task and return its task id."""
        payload = [
            {
                "keywords": keywords,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
                "include_seed_keyword": include_seed,
            }
        ]
        tasks = self.task_post(
            "dataforseo_labs/google/keyword_ideas/task_post",
            payload,
        )
        if not tasks:
            raise DataForSEOError("No tasks returned from keyword_ideas task_post")
        task_id = tasks[0].get("id")
        if not task_id:
            raise DataForSEOError(
                "keyword_ideas task_post response did not include a task id"
            )
        return task_id

    def keyword_ideas_standard(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
        limit: int = 50,
        include_seed: bool = False,
        timeout_seconds: int = 30,
        poll_interval_seconds: float = 2.0,
    ) -> List[Dict[str, Any]]:
        """Run keyword ideas through DataForSEO Standard tasks and wait for results."""
        task_id = self.keyword_ideas_task_post(
            keywords=keywords,
            location=location,
            language=language,
            limit=limit,
            include_seed=include_seed,
        )
        results = self.wait_for_task_results(
            f"dataforseo_labs/google/keyword_ideas/task_get/{task_id}",
            timeout_seconds=timeout_seconds,
            poll_interval_seconds=poll_interval_seconds,
        )
        if not results:
            return []
        return results[0].get("items", [])

    def keyword_suggestions(
        self,
        keyword: str,
        location: str | int = "us",
        language: str = "en",
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Get keyword suggestions (autocomplete-style) for a seed keyword.
        """
        payload = [
            {
                "keyword": keyword,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
            }
        ]

        results = self._post(
            "dataforseo_labs/google/keyword_suggestions/live", payload
        )
        if not results:
            return []
        return results[0].get("items", [])

    def keyword_suggestions_task_post(
        self,
        keyword: str,
        location: str | int = "us",
        language: str = "en",
        limit: int = 50,
    ) -> str:
        """Create a Standard keyword suggestions task and return its task id."""
        payload = [
            {
                "keyword": keyword,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
            }
        ]
        tasks = self.task_post(
            "dataforseo_labs/google/keyword_suggestions/task_post",
            payload,
        )
        if not tasks:
            raise DataForSEOError("No tasks returned from keyword_suggestions task_post")
        task_id = tasks[0].get("id")
        if not task_id:
            raise DataForSEOError(
                "keyword_suggestions task_post response did not include a task id"
            )
        return task_id

    def keyword_suggestions_standard(
        self,
        keyword: str,
        location: str | int = "us",
        language: str = "en",
        limit: int = 50,
        timeout_seconds: int = 30,
        poll_interval_seconds: float = 2.0,
    ) -> List[Dict[str, Any]]:
        """Run keyword suggestions through a Standard task and wait for results."""
        task_id = self.keyword_suggestions_task_post(
            keyword=keyword,
            location=location,
            language=language,
            limit=limit,
        )
        results = self.wait_for_task_results(
            f"dataforseo_labs/google/keyword_suggestions/task_get/{task_id}",
            timeout_seconds=timeout_seconds,
            poll_interval_seconds=poll_interval_seconds,
        )
        if not results:
            return []
        return results[0].get("items", [])

    def keyword_suggestions_batch(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Get keyword suggestions for multiple keywords in a single API call.

        Each keyword is billed as one task but sent in one HTTP request.
        """
        payload = [
            {
                "keyword": kw,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
            }
            for kw in keywords
        ]
        results = self._post(
            "dataforseo_labs/google/keyword_suggestions/live", payload
        )
        all_items = []
        for result in results:
            all_items.extend(result.get("items", []))
        return all_items

    def keyword_suggestions_batch_standard(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
        limit: int = 50,
        timeout_seconds: int = 30,
        poll_interval_seconds: float = 2.0,
    ) -> List[Dict[str, Any]]:
        """
        Get keyword suggestions for multiple keywords via Standard queue.

        All keywords submitted in one POST, polled per task.
        """
        payload = [
            {
                "keyword": kw,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
            }
            for kw in keywords
        ]
        tasks = self.task_post(
            "dataforseo_labs/google/keyword_suggestions/task_post",
            payload,
        )
        task_ids = [t["id"] for t in tasks if t.get("id")]
        if not task_ids:
            raise DataForSEOError("No task IDs returned from suggestions batch task_post")

        all_items = []
        for task_id in task_ids:
            results = self.wait_for_task_results(
                f"dataforseo_labs/google/keyword_suggestions/task_get/{task_id}",
                timeout_seconds=timeout_seconds,
                poll_interval_seconds=poll_interval_seconds,
            )
            for result in results:
                all_items.extend(result.get("items", []))
        return all_items

    # ------------------------------------------------------------------
    # DataForSEO Labs — Competitor Research
    # ------------------------------------------------------------------

    def competitors_domain(
        self,
        target: str,
        location: str | int = "us",
        language: str = "en",
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Find competing domains for a target domain.

        Args:
            target: Target domain (e.g. "example.com")
            location: Country code or DFS location code
            language: Language code
            limit: Max results

        Returns:
            List of competitor dicts with avg_position, intersections, etc.
        """
        payload = [
            {
                "target": target,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
            }
        ]

        results = self._post(
            "dataforseo_labs/google/competitors_domain/live", payload
        )
        if not results:
            return []
        return results[0].get("items", [])

    def ranked_keywords(
        self,
        target: str,
        location: str | int = "us",
        language: str = "en",
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get keywords a domain ranks for, with positions and metrics.

        Args:
            target: Domain to analyze (e.g. "hubspot.com")

        Returns:
            List of keyword ranking dicts
        """
        payload = [
            {
                "target": target,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
            }
        ]

        results = self._post(
            "dataforseo_labs/google/ranked_keywords/live", payload
        )
        if not results:
            return []
        return results[0].get("items", [])

    def ranked_keywords_task_post(
        self,
        target: str,
        location: str | int = "us",
        language: str = "en",
        limit: int = 100,
    ) -> str:
        """Create a Standard ranked keywords task and return its task id."""
        payload = [
            {
                "target": target,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
            }
        ]
        tasks = self.task_post(
            "dataforseo_labs/google/ranked_keywords/task_post",
            payload,
        )
        if not tasks:
            raise DataForSEOError("No tasks returned from ranked_keywords task_post")
        task_id = tasks[0].get("id")
        if not task_id:
            raise DataForSEOError(
                "ranked_keywords task_post response did not include a task id"
            )
        return task_id

    def ranked_keywords_standard(
        self,
        target: str,
        location: str | int = "us",
        language: str = "en",
        limit: int = 100,
        timeout_seconds: int = 30,
        poll_interval_seconds: float = 2.0,
    ) -> List[Dict[str, Any]]:
        """Run ranked keywords through a Standard task and wait for results."""
        task_id = self.ranked_keywords_task_post(
            target=target,
            location=location,
            language=language,
            limit=limit,
        )
        results = self.wait_for_task_results(
            f"dataforseo_labs/google/ranked_keywords/task_get/{task_id}",
            timeout_seconds=timeout_seconds,
            poll_interval_seconds=poll_interval_seconds,
        )
        if not results:
            return []
        return results[0].get("items", [])

    def domain_intersection(
        self,
        targets: Dict[str, str],
        location: str | int = "us",
        language: str = "en",
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Find keywords where multiple domains intersect/differ.

        Args:
            targets: Dict like {"1": "domain1.com", "2": "domain2.com"}
                     Up to 20 domains. DFS compares them.
            location: Country code or DFS location code
            language: Language code
            limit: Max results

        Returns:
            List of keyword intersection dicts
        """
        payload = [
            {
                "targets": targets,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
            }
        ]

        results = self._post(
            "dataforseo_labs/google/domain_intersection/live", payload
        )
        if not results:
            return []
        return results[0].get("items", [])

    def domain_intersection_task_post(
        self,
        targets: Dict[str, str],
        location: str | int = "us",
        language: str = "en",
        limit: int = 100,
    ) -> str:
        """Create a Standard domain intersection task and return its task id."""
        payload = [
            {
                "targets": targets,
                "location_code": self._location_code(location),
                "language_code": language,
                "limit": limit,
            }
        ]
        tasks = self.task_post(
            "dataforseo_labs/google/domain_intersection/task_post",
            payload,
        )
        if not tasks:
            raise DataForSEOError(
                "No tasks returned from domain_intersection task_post"
            )
        task_id = tasks[0].get("id")
        if not task_id:
            raise DataForSEOError(
                "domain_intersection task_post response did not include a task id"
            )
        return task_id

    def domain_intersection_standard(
        self,
        targets: Dict[str, str],
        location: str | int = "us",
        language: str = "en",
        limit: int = 100,
        timeout_seconds: int = 30,
        poll_interval_seconds: float = 2.0,
    ) -> List[Dict[str, Any]]:
        """Run domain intersection through a Standard task and wait for results."""
        task_id = self.domain_intersection_task_post(
            targets=targets,
            location=location,
            language=language,
            limit=limit,
        )
        results = self.wait_for_task_results(
            f"dataforseo_labs/google/domain_intersection/task_get/{task_id}",
            timeout_seconds=timeout_seconds,
            poll_interval_seconds=poll_interval_seconds,
        )
        if not results:
            return []
        return results[0].get("items", [])

    # ------------------------------------------------------------------
    # Google Trends
    # ------------------------------------------------------------------

    def google_trends_explore(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
        time_range: str = "past_12_months",
    ) -> Dict[str, Any]:
        """
        Google Trends data for keywords.

        Args:
            keywords: Up to 5 keywords to compare
            location: Country code or DFS location code
            language: Language code
            time_range: One of "past_hour", "past_4_hours", "past_day",
                       "past_7_days", "past_30_days", "past_90_days",
                       "past_12_months", "past_5_years"

        Returns:
            Trends data with interest over time
        """
        payload = [
            {
                "keywords": keywords[:5],
                "location_code": self._location_code(location),
                "language_code": language,
                "time_range": time_range,
            }
        ]

        results = self._post(
            "keywords_data/google_trends/explore/live", payload
        )
        return results[0] if results else {}

    # ------------------------------------------------------------------
    # Search Intent
    # ------------------------------------------------------------------

    def search_intent(
        self,
        keywords: List[str],
        location: str | int = "us",
        language: str = "en",
    ) -> List[Dict[str, Any]]:
        """
        Classify search intent for keywords (informational, commercial,
        navigational, transactional).

        Args:
            keywords: List of keywords (max 1000)

        Returns:
            List of dicts with keyword, intent, probability
        """
        payload = [
            {
                "keywords": keywords[:1000],
                "location_code": self._location_code(location),
                "language_code": language,
            }
        ]

        results = self._post(
            "dataforseo_labs/google/search_intent/live", payload
        )
        if not results:
            return []
        return results[0].get("items", [])

    # ------------------------------------------------------------------
    # Domain Overview
    # ------------------------------------------------------------------

    def domain_rank_overview(
        self,
        target: str,
        location: str | int = "us",
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Get domain rank overview: organic/paid traffic, keywords count, etc.

        Args:
            target: Domain to analyze

        Returns:
            Domain metrics dict
        """
        payload = [
            {
                "target": target,
                "location_code": self._location_code(location),
                "language_code": language,
            }
        ]

        results = self._post(
            "dataforseo_labs/google/domain_rank_overview/live", payload
        )
        if not results:
            return {}
        items = results[0].get("items", [])
        return items[0] if items else {}
