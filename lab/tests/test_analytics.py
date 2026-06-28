"""Tests for the cookie-free analytics system.

Run with:
    python -m pytest tests/test_analytics.py -v
    # or standalone:
    python tests/test_analytics.py --base-url http://localhost:8000
"""

import argparse
import sys

import requests

DEFAULT_BASE_URL = "http://localhost:8000"


class AnalyticsTests:
    def __init__(self, base_url: str, auth_token: str | None = None):
        self.base = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers["Content-Type"] = "application/json"
        if auth_token:
            self.session.headers["Authorization"] = f"Bearer {auth_token}"
        self.results: list[dict] = []

    def _step(self, name: str, passed: bool, detail: str = "") -> bool:
        status = "PASS" if passed else "FAIL"
        self.results.append({"name": name, "passed": passed, "detail": detail})
        print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
        return passed

    def _get(self, path: str) -> requests.Response:
        return self.session.get(f"{self.base}{path}")

    def _post(self, path: str, json: dict | None = None, **kwargs) -> requests.Response:
        return self.session.post(f"{self.base}{path}", json=json, **kwargs)

    def _options(self, path: str) -> requests.Response:
        return self.session.options(f"{self.base}{path}")

    # ─── Script endpoint ──────────────────────────────

    def test_script_endpoint(self) -> bool:
        print("\n--- Script Endpoint ---")

        resp = self._get("/a/s.js")
        self._step("Script returns 200", resp.status_code == 200)

        ct = resp.headers.get("content-type", "")
        self._step("Content-Type is JS", "javascript" in ct, f"got: {ct}")

        size = len(resp.content)
        self._step("Script is under 1KB", size < 1024, f"size: {size}B")

        self._step("Contains sendBeacon", "sendBeacon" in resp.text)
        self._step("Contains pushState hook", "pushState" in resp.text)

        cors = resp.headers.get("access-control-allow-origin", "")
        self._step("CORS header is *", cors == "*", f"got: {cors}")

        return all(r["passed"] for r in self.results)

    # ─── CORS preflight ───────────────────────────────

    def test_cors_preflight(self) -> bool:
        print("\n--- CORS Preflight ---")

        resp = self._options("/a/collect")
        self._step("Preflight returns 204", resp.status_code == 204)

        cors = resp.headers.get("access-control-allow-origin", "")
        self._step("Allow-Origin is *", cors == "*")

        methods = resp.headers.get("access-control-allow-methods", "")
        self._step("POST in allowed methods", "POST" in methods, f"got: {methods}")

        return all(r["passed"] for r in self.results[-3:])

    # ─── Collect endpoint ─────────────────────────────

    def test_collect_valid(self) -> bool:
        print("\n--- Collect (valid domain) ---")

        resp = self._post("/a/collect", json={
            "d": "example.com",
            "p": "/blog/test-post",
            "r": "https://google.com",
            "us": "twitter",
            "um": "social",
            "uc": "launch",
        })
        # Always 204, regardless of whether domain is registered
        self._step("Collect returns 204", resp.status_code == 204)

        cors = resp.headers.get("access-control-allow-origin", "")
        self._step("CORS header present", cors == "*")

        return all(r["passed"] for r in self.results[-2:])

    def test_collect_malformed(self) -> bool:
        print("\n--- Collect (malformed payload) ---")

        # Missing required field — should still return 204 (silent failure)
        resp = self._post("/a/collect", json={"bad": "data"})
        self._step("Malformed returns 204 (silent)", resp.status_code == 204)

        return all(r["passed"] for r in self.results[-1:])

    def test_collect_empty_body(self) -> bool:
        print("\n--- Collect (empty body) ---")

        resp = requests.post(
            f"{self.base}/a/collect",
            data="",
            headers={"Content-Type": "application/json"},
        )
        self._step("Empty body returns 204 (silent)", resp.status_code == 204)

        return all(r["passed"] for r in self.results[-1:])

    # ─── Auth-protected query endpoints ───────────────

    def test_query_requires_auth(self) -> bool:
        print("\n--- Query endpoints require auth ---")

        no_auth = requests.Session()
        endpoints = [
            "/api/analytics/summary?projectId=test",
            "/api/analytics/pages?projectId=test",
            "/api/analytics/referrers?projectId=test",
            "/api/analytics/timeseries?projectId=test",
        ]

        for ep in endpoints:
            resp = no_auth.get(f"{self.base}{ep}")
            name = ep.split("?")[0].split("/")[-1]
            # 401 or 403 — unauthenticated
            self._step(
                f"{name} rejects unauthenticated",
                resp.status_code in (401, 403),
                f"status={resp.status_code}",
            )

        return all(r["passed"] for r in self.results[-4:])

    def run_all(self) -> bool:
        self.test_script_endpoint()
        self.test_cors_preflight()
        self.test_collect_valid()
        self.test_collect_malformed()
        self.test_collect_empty_body()
        self.test_query_requires_auth()

        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)
        print(f"\n{'='*40}")
        print(f"Results: {passed}/{total} passed")
        print(f"{'='*40}")
        return passed == total


# ─── pytest integration ───────────────────────────


def _make_suite() -> AnalyticsTests:
    return AnalyticsTests(DEFAULT_BASE_URL)


def test_script_endpoint():
    assert _make_suite().test_script_endpoint()


def test_cors_preflight():
    assert _make_suite().test_cors_preflight()


def test_collect_valid():
    assert _make_suite().test_collect_valid()


def test_collect_malformed():
    assert _make_suite().test_collect_malformed()


def test_collect_empty_body():
    assert _make_suite().test_collect_empty_body()


def test_query_requires_auth():
    assert _make_suite().test_query_requires_auth()


# ─── Standalone runner ────────────────────────────


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--token", default=None, help="Clerk JWT for auth tests")
    args = parser.parse_args()

    suite = AnalyticsTests(args.base_url, args.token)
    ok = suite.run_all()
    sys.exit(0 if ok else 1)
