"""Social Listener — multi-platform social listening for the Idea Pool.

Level 5 ingestion: scrapes Reddit, X, Hacker News, and YouTube for
trending topics, ranks by engagement + recency + cross-platform convergence,
detects recurring questions, and injects ideas via bulk_create_ideas().

Sources:
  - Reddit    — Exa AI (include_domains=["reddit.com"])
  - X/Twitter — Exa AI (include_domains=["x.com", "twitter.com"])
  - YouTube   — Exa AI (include_domains=["youtube.com"])
  - HN        — Algolia HN API (free, no auth)
"""

import os
import re
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx

try:
    from exa_py import Exa

    EXA_AVAILABLE = True
except ImportError:
    EXA_AVAILABLE = False


# ── Types ────────────────────────────────────────────────────────────

NormalizedItem = dict[str, Any]
"""
{
    "title": str,
    "url": str,
    "platform": "reddit" | "x" | "hn" | "youtube",
    "engagement": int,
    "comment_count": int,
    "author": str | None,
    "published_at": str | None,   # ISO 8601
    "snippet": str,
    "is_question": bool,
}
"""


# ── Config ───────────────────────────────────────────────────────────

_QUESTION_PREFIXES = re.compile(
    r"^(how|why|what|where|when|which|who|is there|are there|can i|should i|does|do)\b",
    re.IGNORECASE,
)

_HN_ALGOLIA_BASE = "https://hn.algolia.com/api/v1/search"
_HN_TIMEOUT = 10.0
_EXA_RESULTS_PER_PLATFORM = 15


# ── Exa wrapper ──────────────────────────────────────────────────────


def _get_exa() -> "Exa":
    api_key = os.getenv("EXA_API_KEY")
    if not api_key:
        raise ValueError("EXA_API_KEY not configured")
    if not EXA_AVAILABLE:
        raise ImportError("exa-py not installed")
    return Exa(api_key)


def _search_exa(
    exa: "Exa",
    query: str,
    include_domains: list[str],
    days_back: int = 30,
    num_results: int = _EXA_RESULTS_PER_PLATFORM,
) -> list[dict]:
    """Search Exa with domain filter and date range."""
    start_date = (datetime.now(timezone.utc) - timedelta(days=days_back)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )
    try:
        resp = exa.search_and_contents(
            query=query,
            num_results=num_results,
            include_domains=include_domains,
            start_published_date=start_date,
            text={"max_characters": 500},
        )
        return [
            {
                "title": r.title or "",
                "url": r.url or "",
                "text": (r.text or "")[:500],
                "published_date": r.published_date,
                "score": getattr(r, "score", None),
            }
            for r in resp.results
        ]
    except Exception as e:
        print(f"  ⚠ Exa search failed for {include_domains}: {e}")
        return []


# ── Collectors ───────────────────────────────────────────────────────


def _collect_reddit(
    exa: "Exa", topics: list[str], days_back: int
) -> list[NormalizedItem]:
    items = []
    for topic in topics:
        for raw in _search_exa(exa, topic, ["reddit.com"], days_back):
            items.append(
                _make_item(raw, platform="reddit", topic=topic)
            )
    return items


def _collect_x(
    exa: "Exa", topics: list[str], days_back: int
) -> list[NormalizedItem]:
    items = []
    for topic in topics:
        for raw in _search_exa(exa, topic, ["x.com", "twitter.com"], days_back):
            items.append(
                _make_item(raw, platform="x", topic=topic)
            )
    return items


def _collect_youtube(
    exa: "Exa", topics: list[str], days_back: int
) -> list[NormalizedItem]:
    items = []
    for topic in topics:
        for raw in _search_exa(exa, topic, ["youtube.com"], days_back):
            items.append(
                _make_item(raw, platform="youtube", topic=topic)
            )
    return items


def _make_item(raw: dict, platform: str, topic: str) -> NormalizedItem:
    """Convert an Exa result to a normalized item."""
    title = (raw.get("title") or "").strip()
    return {
        "title": title,
        "url": raw.get("url", ""),
        "platform": platform,
        "engagement": 0,  # Exa doesn't return engagement; ranked by relevance
        "comment_count": 0,
        "author": None,
        "published_at": raw.get("published_date"),
        "snippet": (raw.get("text") or "")[:300],
        "is_question": _is_question(title),
        "_topic": topic,
        "_exa_score": raw.get("score"),
    }


def _collect_hn(topics: list[str], days_back: int) -> list[NormalizedItem]:
    """Collect stories from Hacker News via Algolia API."""
    cutoff = int(
        (datetime.now(timezone.utc) - timedelta(days=days_back)).timestamp()
    )
    items = []

    for topic in topics:
        try:
            resp = httpx.get(
                _HN_ALGOLIA_BASE,
                params={
                    "query": topic,
                    "tags": "story",
                    "numericFilters": f"created_at_i>{cutoff}",
                    "hitsPerPage": 20,
                },
                timeout=_HN_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()

            for hit in data.get("hits", []):
                title = (hit.get("title") or "").strip()
                if not title:
                    continue
                url = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}"
                created = hit.get("created_at")

                items.append({
                    "title": title,
                    "url": url,
                    "platform": "hn",
                    "engagement": hit.get("points", 0) or 0,
                    "comment_count": hit.get("num_comments", 0) or 0,
                    "author": hit.get("author"),
                    "published_at": created,
                    "snippet": (hit.get("story_text") or "")[:300],
                    "is_question": _is_question(title),
                    "_topic": topic,
                    "_exa_score": None,
                })

        except Exception as e:
            print(f"  ⚠ HN Algolia failed for '{topic}': {e}")

    return items


# ── Question detection ───────────────────────────────────────────────


def _is_question(title: str) -> bool:
    """Detect if a title is a question."""
    if "?" in title:
        return True
    return bool(_QUESTION_PREFIXES.match(title.strip()))


# ── Deduplication ────────────────────────────────────────────────────


def _trigrams(text: str) -> set[str]:
    """Generate character trigrams from text."""
    text = text.lower().strip()
    if len(text) < 3:
        return {text}
    return {text[i : i + 3] for i in range(len(text) - 2)}


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def deduplicate(items: list[NormalizedItem], threshold: float = 0.6) -> list[NormalizedItem]:
    """Remove near-duplicate items by trigram Jaccard on titles.

    Keeps the item with higher engagement when duplicates are found.
    """
    if not items:
        return []

    kept: list[NormalizedItem] = []
    kept_trigrams: list[set[str]] = []

    # Sort by engagement desc so we keep the best version
    sorted_items = sorted(items, key=lambda x: x.get("engagement", 0), reverse=True)

    for item in sorted_items:
        tri = _trigrams(item["title"])
        is_dup = False
        for kt in kept_trigrams:
            if _jaccard(tri, kt) >= threshold:
                is_dup = True
                break
        if not is_dup:
            kept.append(item)
            kept_trigrams.append(tri)

    return kept


# ── Convergence detection ────────────────────────────────────────────


def detect_convergence(
    items: list[NormalizedItem], threshold: float = 0.45
) -> list[NormalizedItem]:
    """Detect cross-platform convergence and annotate items.

    When similar titles appear on 2+ platforms, the best one gets
    a convergence bonus and the list of platforms in _convergence_platforms.
    """
    for item in items:
        item.setdefault("_convergence_platforms", [item["platform"]])
        item.setdefault("_convergence_score", 1.0)

    trigram_cache = [(i, _trigrams(item["title"])) for i, item in enumerate(items)]

    # Find cross-platform matches
    merged = set()  # indices that were merged into another
    for i, (idx_a, tri_a) in enumerate(trigram_cache):
        if idx_a in merged:
            continue
        for idx_b, tri_b in trigram_cache[i + 1 :]:
            if idx_b in merged:
                continue
            if items[idx_a]["platform"] == items[idx_b]["platform"]:
                continue  # same platform = not convergence
            if _jaccard(tri_a, tri_b) >= threshold:
                # Merge: add platform to the higher-engagement item
                platforms = set(items[idx_a]["_convergence_platforms"])
                platforms.add(items[idx_b]["platform"])
                items[idx_a]["_convergence_platforms"] = sorted(platforms)

                n = len(platforms)
                items[idx_a]["_convergence_score"] = 1.0 + (n - 1) * 0.5  # 1.5 for 2, 2.0 for 3+
                merged.add(idx_b)

    # Remove merged items
    return [item for i, item in enumerate(items) if i not in merged]


# ── Ranking ──────────────────────────────────────────────────────────


def rank_results(items: list[NormalizedItem], days_back: int = 30) -> list[NormalizedItem]:
    """Score items by engagement + recency + convergence.

    Formula: score = (engagement_norm * 0.4) + (recency * 0.3) + (convergence * 0.3)
    Scaled to 0-100.
    """
    if not items:
        return []

    now = datetime.now(timezone.utc)

    # Compute raw signals
    max_engagement = max((it.get("engagement", 0) for it in items), default=1) or 1
    max_exa_score = max((it.get("_exa_score") or 0 for it in items), default=1) or 1

    for item in items:
        # Engagement: normalize to 0-1
        eng = item.get("engagement", 0)
        exa_s = item.get("_exa_score") or 0
        # Blend real engagement with Exa relevance score (for platforms without engagement data)
        eng_norm = (eng / max_engagement) * 0.7 + (exa_s / max_exa_score) * 0.3 if exa_s else eng / max_engagement

        # Recency: 1.0 for today, decays to 0.0 at days_back
        recency = 0.5  # default if no date
        pub = item.get("published_at")
        if pub:
            try:
                if isinstance(pub, str):
                    # Handle various date formats
                    pub_dt = datetime.fromisoformat(pub.replace("Z", "+00:00"))
                else:
                    pub_dt = pub
                if pub_dt.tzinfo is None:
                    pub_dt = pub_dt.replace(tzinfo=timezone.utc)
                age_days = (now - pub_dt).total_seconds() / 86400
                recency = max(0.0, 1.0 - (age_days / days_back))
            except (ValueError, TypeError):
                pass

        # Convergence
        conv = item.get("_convergence_score", 1.0)
        conv_norm = min(conv / 2.0, 1.0)  # 2.0 = max (3+ platforms)

        # Engagement velocity
        age_days_raw = 1.0
        if pub:
            try:
                pub_dt2 = datetime.fromisoformat(str(pub).replace("Z", "+00:00"))
                if pub_dt2.tzinfo is None:
                    pub_dt2 = pub_dt2.replace(tzinfo=timezone.utc)
                age_days_raw = max((now - pub_dt2).total_seconds() / 86400, 0.1)
            except (ValueError, TypeError):
                pass
        velocity = eng / age_days_raw if eng > 0 else 0

        # Final score (0-100)
        score = round(
            (eng_norm * 0.4 + recency * 0.3 + conv_norm * 0.3) * 100, 1
        )

        item["_score"] = score
        item["_engagement_velocity"] = round(velocity, 1)

    items.sort(key=lambda x: x.get("_score", 0), reverse=True)
    return items


# ── Build Idea Pool items ────────────────────────────────────────────


def _build_idea_items(items: list[NormalizedItem]) -> list[dict]:
    """Convert ranked normalized items to Idea Pool format."""
    idea_items = []
    for item in items:
        platforms_found = item.get("_convergence_platforms", [item["platform"]])
        convergence_score = item.get("_convergence_score", 1.0)

        tags = ["social_listening", item["platform"]]
        if item.get("is_question"):
            tags.append("question")
        if convergence_score > 1.0:
            tags.append("converging")
            for p in platforms_found:
                if p != item["platform"] and p not in tags:
                    tags.append(p)

        idea_items.append({
            "title": item["title"][:200],
            "raw_data": {
                "url": item.get("url", ""),
                "platform": item["platform"],
                "engagement": item.get("engagement", 0),
                "comment_count": item.get("comment_count", 0),
                "author": item.get("author"),
                "snippet": item.get("snippet", ""),
                "is_question": item.get("is_question", False),
                "convergence_platforms": platforms_found if convergence_score > 1.0 else [],
            },
            "trending_signals": {
                "source": "social_listening",
                "platforms_found": platforms_found,
                "total_engagement": item.get("engagement", 0),
                "engagement_velocity": item.get("_engagement_velocity", 0),
                "convergence_score": convergence_score,
                "question_signal": item.get("is_question", False),
            },
            "priority_score": item.get("_score", 0),
            "tags": tags,
        })

    return idea_items


# ── Main orchestrator ────────────────────────────────────────────────


def ingest_social_listening(
    topics: list[str],
    days_back: int = 30,
    max_ideas: int = 50,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> dict[str, Any]:
    """Run social listening across all platforms and ingest into the Idea Pool.

    Args:
        topics: Search topics (e.g. ["ai content marketing", "seo automation"])
        days_back: How many days back to search
        max_ideas: Max ideas to inject
        project_id: Optional project scope
        user_id: Optional user scope

    Returns:
        {"count": int, "sources": {"reddit": int, "x": int, "hn": int, "youtube": int}}
    """
    from status import get_status_service

    # Track per-platform counts
    source_counts: dict[str, int] = {"reddit": 0, "x": 0, "hn": 0, "youtube": 0}

    # Collect from all sources
    all_items: list[NormalizedItem] = []

    # HN first (no API key needed)
    print(f"🔍 Social listening: {topics} (last {days_back} days)")
    hn_items = _collect_hn(topics, days_back)
    all_items.extend(hn_items)
    print(f"  HN: {len(hn_items)} results")

    # Exa-powered sources
    try:
        exa = _get_exa()

        reddit_items = _collect_reddit(exa, topics, days_back)
        all_items.extend(reddit_items)
        print(f"  Reddit: {len(reddit_items)} results")

        x_items = _collect_x(exa, topics, days_back)
        all_items.extend(x_items)
        print(f"  X: {len(x_items)} results")

        yt_items = _collect_youtube(exa, topics, days_back)
        all_items.extend(yt_items)
        print(f"  YouTube: {len(yt_items)} results")

    except (ValueError, ImportError) as e:
        print(f"  ⚠ Exa not available: {e} — continuing with HN only")

    if not all_items:
        print("ℹ️  No social listening results")
        return {"count": 0, "sources": source_counts}

    # Deduplicate
    deduped = deduplicate(all_items)
    print(f"  Deduped: {len(all_items)} → {len(deduped)}")

    # Detect convergence
    converged = detect_convergence(deduped)
    converging_count = sum(1 for it in converged if it.get("_convergence_score", 1.0) > 1.0)
    if converging_count:
        print(f"  Convergence: {converging_count} cross-platform topics detected")

    # Rank
    ranked = rank_results(converged, days_back)

    # Trim to max_ideas
    ranked = ranked[:max_ideas]

    # Count per platform
    for item in ranked:
        p = item["platform"]
        if p in source_counts:
            source_counts[p] += 1

    # Build and inject
    idea_items = _build_idea_items(ranked)

    svc = get_status_service()
    count = svc.bulk_create_ideas(
        source="social_listening",
        items=idea_items,
        project_id=project_id,
        user_id=user_id,
    )

    print(f"✅ Ingested {count} social listening ideas ({source_counts})")
    return {"count": count, "sources": source_counts}
