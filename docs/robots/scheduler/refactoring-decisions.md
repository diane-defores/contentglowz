# Architecture Refactoring - Agent Responsibilities

## Issue Identified
Initially had redundant "Technical SEO" functionality across two agents with unclear boundaries.

## Solution Implemented

### Renamed Agents for Clarity

**1. SEO Robot: `on_page_technical_seo.py`** (formerly `technical_seo.py`)
- **Class:** `OnPageTechnicalSEOAgent`
- **Role:** Optimize individual pages DURING content creation
- **Scope:** NEW content being written
- **Tools:**
  - `SchemaGenerator` - Generate schema.org for new articles
  - `MetadataValidator` - Validate title/description
  - `InternalLinkingAnalyzer` - Recommend links for new content
  - `OnPageOptimizer` - Check headings, word count, keyword usage

**2. Scheduler Robot: `site_health_monitor.py`** (formerly `technical_seo_analyzer.py`)
- **Class:** `SiteHealthMonitorAgent`
- **Role:** Monitor EXISTING site health continuously
- **Scope:** Site-wide audits and monitoring
- **Tools:**
  - `SiteCrawler` - Crawl entire site
  - `PerformanceAnalyzer` - Page speed, Core Web Vitals
  - `LinkAnalyzer` - Site-wide link graph analysis
  - **USES** On-Page SEO tools for individual page analysis

---

## Tool Sharing Architecture

### Before (Redundant)
```
SEO Robot                Scheduler Robot
├─ Schema tools          ├─ Schema validation (duplicate!)
├─ Metadata tools        ├─ Metadata validation (duplicate!)
└─ Link analysis         └─ Link analysis (different scope)
```

### After (Hierarchical)
```
Site Health Monitor
├─ Site-wide crawling
├─ Performance monitoring
├─ Aggregate scoring
└─ analyze_page_seo()
    └─ USES On-Page Technical SEO tools
        ├─ SchemaGenerator/Validator
        ├─ MetadataValidator
        └─ OnPageOptimizer
```

---

## Benefits

1. **No Code Duplication**
   - Site Health Monitor imports and uses On-Page SEO tools
   - Single source of truth for page-level analysis

2. **Clear Separation of Concerns**
   - On-Page SEO = Content creation time
   - Site Health Monitor = Post-publication monitoring

3. **Composability**
   - Site Health Monitor can analyze 100 pages by calling On-Page tools 100 times
   - On-Page SEO tools are reusable across different contexts

4. **Better Names**
   - "On-Page Technical SEO" = clearly about individual pages
   - "Site Health Monitor" = clearly about site-wide health

---

## Usage Examples

### On-Page SEO (During Content Creation)
```python
from agents.seo.on_page_technical_seo import OnPageTechnicalSEOAgent

seo_agent = OnPageTechnicalSEOAgent()
result = seo_agent.optimize_technical_seo(
    article_content="...",
    article_metadata={"title": "..."},
    existing_pages=["blog/post1", "blog/post2"]
)
# Returns: Schema markup, metadata validation, internal link recommendations
```

### Site Health Monitor (After Publication)
```python
from agents.scheduler.site_health_monitor import SiteHealthMonitorAgent

monitor = SiteHealthMonitorAgent(base_url="https://yoursite.com")

# Full site audit (uses On-Page tools for each page)
audit = monitor.run_full_audit(max_pages=100)

# Quick check (uses On-Page tools for homepage)
health = monitor.quick_health_check()
```

---

## Files Changed

1. **Renamed:**
   - `agents/seo/technical_seo.py` → `agents/seo/on_page_technical_seo.py`
   - `agents/scheduler/technical_seo_analyzer.py` → `agents/scheduler/site_health_monitor.py`

2. **Updated:**
   - `agents/seo/on_page_technical_seo.py` - Added factory function, clearer docstrings
   - `agents/scheduler/site_health_monitor.py` - Now imports and uses On-Page SEO tools
   - `agents/scheduler/scheduler_crew.py` - Updated imports and references

3. **Removed Redundancy:**
   - `SchemaValidator` in `seo_audit_tools.py` - now uses On-Page tools instead

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│     Content Creation Pipeline       │
│          (SEO Robot)                │
└─────────────────────────────────────┘
                ↓
    OnPageTechnicalSEOAgent
    ├─ Generate schema
    ├─ Validate metadata
    ├─ Recommend internal links
    └─ Optimize on-page elements
                ↓
         Published Content
                ↓
┌─────────────────────────────────────┐
│     Post-Publication Monitoring     │
│       (Scheduler Robot)             │
└─────────────────────────────────────┘
                ↓
     SiteHealthMonitorAgent
     ├─ Crawl site (100+ pages)
     ├─ Check performance
     ├─ Analyze link graph
     └─ For each page:
         └─ analyze_page_seo()
             └─ USES OnPageTechnicalSEOAgent tools
                 ├─ Validate metadata
                 └─ Check schema
```

---

**Date:** January 17, 2026
**Status:** ✅ Refactoring Complete
**Impact:** Zero redundancy, clearer responsibilities, better code reuse
