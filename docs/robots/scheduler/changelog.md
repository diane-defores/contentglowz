# Changelog - Scheduling Robot

## [1.0.1] - 2026-01-17 - Architecture Refactoring

### Changed
- **RENAMED:** `technical_seo_analyzer.py` → `site_health_monitor.py`
  - Class: `TechnicalSEOAnalyzerAgent` → `SiteHealthMonitorAgent`
  - Factory: `create_technical_seo_analyzer()` → `create_site_health_monitor()`
  - **Reason:** Clearer distinction from SEO Robot's `on_page_technical_seo.py`

- **RENAMED in SEO Robot:** `agents/seo/technical_seo.py` → `agents/seo/on_page_technical_seo.py`
  - Class: `TechnicalSEOAgent` → `OnPageTechnicalSEOAgent`
  - **Reason:** Clarify this agent optimizes NEW content during creation

### Removed
- **DELETED:** `SchemaValidator` class from `agents/scheduler/tools/seo_audit_tools.py`
  - **Reason:** Redundant - now uses `agents.seo.tools.technical_tools.SchemaGenerator` instead

### Added
- **NEW:** Tool sharing architecture
  - `site_health_monitor.py` now imports and uses On-Page SEO tools:
    ```python
    from agents.seo.tools.technical_tools import SchemaGenerator, MetadataValidator
    ```
  - New method: `analyze_page_seo()` uses On-Page tools for individual page validation

- **NEW:** Documentation files
  - `ARCHITECTURE_REFACTORING.md` - Explains the refactoring decisions
  - `FINAL_ARCHITECTURE.md` - Complete architecture overview
  - `CHANGELOG.md` - This file

### Improved
- **Zero code duplication** - Schema and metadata validation now exists in ONE place
- **Clearer responsibilities:**
  - On-Page Technical SEO (SEO Robot) = NEW content optimization
  - Site Health Monitor (Scheduler Robot) = EXISTING site monitoring
- **Better tool reuse** - Site Health Monitor composes On-Page tools hierarchically

### Migration Guide

If you were using the old agents directly:

**Before:**
```python
from agents.scheduler.technical_seo_analyzer import create_technical_seo_analyzer
seo = create_technical_seo_analyzer()
```

**After:**
```python
from agents.scheduler.site_health_monitor import create_site_health_monitor
monitor = create_site_health_monitor()
```

**Before:**
```python
from agents.seo.technical_seo import TechnicalSEOAgent
seo = TechnicalSEOAgent()
```

**After:**
```python
from agents.seo.on_page_technical_seo import OnPageTechnicalSEOAgent
seo = OnPageTechnicalSEOAgent()
```

### Breaking Changes
- ⚠️ Import paths changed (see Migration Guide above)
- ⚠️ Class names changed (see Migration Guide above)
- ⚠️ `scheduler_crew.py` now uses `site_health_monitor` instead of `technical_seo`

### Non-Breaking
- ✅ All functionality preserved
- ✅ Tool interfaces unchanged
- ✅ Pydantic schemas unchanged

---

## [1.0.0] - 2026-01-17 - Initial Release

### Added
- Complete 4-agent Scheduling Robot system
- Calendar Manager Agent with intelligent scheduling
- Publishing Agent with Git and Google integration
- Technical SEO Analyzer Agent (later renamed to Site Health Monitor)
- Tech Stack Analyzer Agent with vulnerability scanning
- 17 Pydantic schemas for data validation
- 33 tool functions across 14 tool classes
- Comprehensive documentation and examples
- Configuration system with YAML and environment variables

### Features
- Automated content scheduling with ML-based time optimization
- Git-based deployment with rollback support
- Google Search Console and Indexing API integration
- Site-wide SEO auditing and health monitoring
- Dependency tracking and vulnerability scanning
- Build performance monitoring
- API cost tracking and forecasting
- Self-analysis capability (robot audits itself)

---

**Version Format:** [Major.Minor.Patch]
- **Major:** Breaking changes
- **Minor:** New features, backward compatible
- **Patch:** Bug fixes, refactoring, documentation
