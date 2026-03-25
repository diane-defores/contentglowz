"""Source ingestion — pulls ideas from external sources into the Idea Pool.

Each function reads from one source and calls bulk_create_ideas().
Called by the scheduler on a recurring basis.
"""

from typing import Optional


def ingest_newsletter_inbox(
    days_back: int = 7,
    folder: str = "Newsletters",
    max_results: int = 20,
    project_id: Optional[str] = None,
) -> int:
    """Read newsletters via IMAP and extract topics as ideas.

    Returns:
        Number of ideas created.
    """
    from status import get_status_service

    try:
        from agents.newsletter.tools.imap_tools import IMAPNewsletterReader
    except ImportError:
        print("⚠ imap-tools not installed, skipping newsletter inbox ingestion")
        return 0

    try:
        reader = IMAPNewsletterReader()
    except (ValueError, ImportError) as e:
        print(f"⚠ IMAP not configured: {e}")
        return 0

    emails = reader.fetch_newsletters(
        days_back=days_back,
        folder=folder,
        max_results=max_results,
    )

    if not emails:
        print("ℹ️  No newsletters found")
        return 0

    items = []
    for email in emails:
        # Extract topic from subject line (strip common prefixes)
        subject = email.subject.strip()
        for prefix in ["Re:", "Fwd:", "[Newsletter]", "📧", "📬"]:
            subject = subject.removeprefix(prefix).strip()

        if not subject:
            continue

        # Extract a preview from text content
        preview = (email.text or "")[:500].strip()

        items.append({
            "title": subject,
            "raw_data": {
                "from_email": email.from_email,
                "from_name": email.from_name,
                "date": email.date.isoformat() if email.date else None,
                "preview": preview,
                "is_newsletter": email.is_newsletter,
            },
            "tags": ["newsletter_inbox", email.from_name or email.from_email],
        })

    svc = get_status_service()
    count = svc.bulk_create_ideas(
        source="newsletter_inbox",
        items=items,
        project_id=project_id,
    )
    print(f"✅ Ingested {count} ideas from newsletter inbox")
    return count


def ingest_seo_keywords(
    seed_keywords: list[str],
    max_keywords: int = 30,
    project_id: Optional[str] = None,
) -> int:
    """Generate SEO keyword ideas using Advertools.

    Args:
        seed_keywords: Base keywords to expand (e.g. ["ai", "content", "automation"])
        max_keywords: Max keywords to generate

    Returns:
        Number of ideas created.
    """
    from status import get_status_service

    try:
        from agents.seo_research_tools import SEOResearchTools
    except ImportError:
        print("⚠ SEO research tools not available")
        return 0

    tools = SEOResearchTools()

    # Generate keyword combinations
    keywords = tools.generate_keywords(
        seed_keywords=seed_keywords,
        max_len=3,
        save=False,
    )
    keywords = keywords[:max_keywords]

    if not keywords:
        print("ℹ️  No keywords generated")
        return 0

    # Also generate question variations from the first seed
    variations = tools.generate_keyword_variations(
        base_keyword=" ".join(seed_keywords[:2]),
        include_questions=True,
        include_modifiers=True,
    )

    items = []
    for kw in keywords:
        items.append({
            "title": kw,
            "raw_data": {"keyword_type": "combination"},
            "seo_signals": {"source": "advertools", "type": "generated"},
            "tags": ["seo_keyword"],
        })

    # Add question keywords
    for q in variations.get("questions", [])[:10]:
        items.append({
            "title": q,
            "raw_data": {"keyword_type": "question"},
            "seo_signals": {"source": "advertools", "type": "question"},
            "tags": ["seo_keyword", "question"],
        })

    svc = get_status_service()
    count = svc.bulk_create_ideas(
        source="seo_keywords",
        items=items,
        project_id=project_id,
    )
    print(f"✅ Ingested {count} SEO keyword ideas")
    return count


def ingest_weekly_ritual(
    entries: list[dict],
    narrative_summary: Optional[str] = None,
    project_id: Optional[str] = None,
) -> int:
    """Convert weekly ritual entries into ideas.

    Args:
        entries: List of ritual entry dicts (entry_type, content, tags)
        narrative_summary: Optional narrative synthesis text

    Returns:
        Number of ideas created.
    """
    from status import get_status_service

    items = []
    for entry in entries:
        content = entry.get("content", "").strip()
        if not content:
            continue

        entry_type = entry.get("entry_type", "reflection")
        # Only ideas and pivots are directly actionable
        if entry_type in ("idea", "pivot"):
            items.append({
                "title": content[:120],
                "raw_data": {
                    "entry_type": entry_type,
                    "full_content": content,
                    "tags": entry.get("tags", []),
                },
                "tags": ["weekly_ritual", entry_type],
            })

    # If there's a narrative summary, add it as a meta-idea
    if narrative_summary:
        items.append({
            "title": f"Narrative: {narrative_summary[:100]}",
            "raw_data": {
                "entry_type": "narrative_summary",
                "full_content": narrative_summary,
            },
            "tags": ["weekly_ritual", "narrative"],
        })

    if not items:
        return 0

    svc = get_status_service()
    count = svc.bulk_create_ideas(
        source="weekly_ritual",
        items=items,
        project_id=project_id,
    )
    print(f"✅ Ingested {count} ideas from weekly ritual")
    return count
