# 📅 Scheduling Robot - Architecture & Specifications

## Overview
The Scheduling Robot is a multi-agent CrewAI system that orchestrates content publishing, manages editorial calendars, and performs continuous technical analysis of the site's SEO and tech stack health.

## Agent Architecture

### 1. Calendar Manager Agent
**Role:** Content scheduling and calendar optimization

**Responsibilities:**
- Analyze historical publishing patterns and performance
- Determine optimal publishing times based on:
  - Audience timezone and activity patterns
  - Google indexing cycles and peak crawl times
  - Competitor publishing schedules
  - Content type and seasonality
- Manage content queue and backlog
- Prevent publishing conflicts and maintain consistent cadence
- Generate editorial calendar recommendations

**Tools:**
- `analyze_publishing_history` - Extract patterns from past publishes
- `calculate_optimal_times` - ML-based optimal time prediction
- `manage_content_queue` - Queue management and prioritization
- `detect_scheduling_conflicts` - Identify and resolve conflicts
- `generate_calendar_view` - Create visual calendar representations

**Metrics:**
- Average time-to-publish: <2 hours from queue entry
- Scheduling conflict rate: <5%
- Optimal time accuracy: >85% (measured by engagement)

---

### 2. Publishing Agent
**Role:** Platform integration and content deployment

**Responsibilities:**
- Deploy content to production (Git commit/push, Astro build)
- Submit URLs to Google Search Console
- Trigger Google Indexing API for instant indexing
- Monitor deployment status and rollback on failure
- Track publishing analytics and success metrics
- Manage sitemap updates and robots.txt

**Tools:**
- `deploy_to_production` - Git operations and Astro build/deploy
- `submit_to_google` - Google Search Console URL submission
- `trigger_indexing_api` - Google Indexing API integration
- `monitor_deployment` - Health checks and status monitoring
- `update_sitemap` - Automatic sitemap generation
- `rollback_deployment` - Emergency rollback mechanism

**Integrations:**
- Google Search Console API
- Google Indexing API
- GitHub API (for deployment)
- Astro build system

**Metrics:**
- Deployment success rate: >99%
- Time to indexation: <24 hours average
- Rollback time: <5 minutes when needed

---

### 3. Technical SEO Analyzer Agent
**Role:** Continuous technical SEO auditing and optimization

**Responsibilities:**
- Crawl site and analyze technical SEO health
- Validate schema.org structured data
- Check page speed and Core Web Vitals
- Audit internal linking structure
- Detect broken links and redirect chains
- Analyze robots.txt and sitemap validity
- Monitor mobile-friendliness and accessibility
- Generate actionable technical SEO reports

**Tools:**
- `crawl_site_structure` - Full site crawl and analysis
- `validate_schema_markup` - Schema.org validation
- `check_page_speed` - Lighthouse/PageSpeed integration
- `analyze_internal_links` - Link graph analysis
- `detect_technical_issues` - Comprehensive issue detection
- `generate_seo_report` - Detailed technical SEO report

**Quality Thresholds:**
- Page speed score: >90
- Schema validation: 100%
- Broken links: 0
- Mobile-friendly: 100%
- Core Web Vitals: All green

**Metrics:**
- Audit frequency: Weekly (configurable)
- Issue detection rate: >95% accuracy
- Report generation time: <10 minutes

---

### 4. Tech Stack Analyzer Agent
**Role:** Self-analysis of infrastructure and dependencies

**Responsibilities:**
- Analyze project dependencies and detect vulnerabilities
- Monitor build performance and optimization opportunities
- Track bundle sizes and code splitting effectiveness
- Analyze CI/CD pipeline efficiency (Blacksmith)
- Detect outdated packages and suggest upgrades
- Monitor API costs (LLM, Exa, Firecrawl)
- Generate tech health scorecard

**Tools:**
- `analyze_dependencies` - Package.json/requirements.txt analysis
- `check_vulnerabilities` - Security vulnerability scanning
- `monitor_build_performance` - Build time and cache analysis
- `analyze_bundle_size` - Bundle analyzer integration
- `track_api_costs` - Cost monitoring and forecasting
- `generate_tech_report` - Comprehensive tech stack report

**Metrics:**
- Dependency audit frequency: Daily
- Critical vulnerability detection: <1 hour
- Build performance tracking: Every build
- Cost forecasting accuracy: >90%

---

## Workflow Orchestration

### Publishing Workflow
```
Content Ready → Calendar Manager (schedule) → Queue → Publishing Agent (deploy) →
Google Integration → Monitor → Analytics
```

### Self-Analysis Workflow (Weekly)
```
Trigger → Technical SEO Analyzer (audit site) → Tech Stack Analyzer (audit infra) →
Generate Combined Report → Log Issues → Auto-fix (if possible) → Notify
```

### Emergency Workflow
```
Deployment Failure → Publishing Agent (detect) → Rollback → Notify →
Tech Stack Analyzer (diagnose) → Generate Incident Report
```

---

## Pydantic Schemas

### Publishing Schemas
```python
class ContentItem(BaseModel):
    id: str
    title: str
    content_path: str
    content_type: str  # "article", "newsletter", "seo-content"
    priority: int  # 1-5
    source_robot: str  # "seo", "newsletter", "article"
    created_at: datetime
    scheduled_for: Optional[datetime]
    published_at: Optional[datetime]
    metadata: Dict[str, Any]

class PublishingSchedule(BaseModel):
    items: List[ContentItem]
    optimal_times: Dict[str, datetime]
    conflicts: List[str]
    recommendations: List[str]

class DeploymentResult(BaseModel):
    success: bool
    deployment_id: str
    commit_sha: str
    published_at: datetime
    urls: List[str]
    indexing_status: Dict[str, str]
    errors: List[str]
```

### Analysis Schemas
```python
class TechnicalSEOScore(BaseModel):
    overall_score: float  # 0-100
    page_speed: float
    schema_validity: float
    internal_linking: float
    mobile_friendly: bool
    core_web_vitals: Dict[str, float]
    issues: List[Dict[str, Any]]
    recommendations: List[str]

class TechStackHealth(BaseModel):
    overall_health: float  # 0-100
    dependencies: Dict[str, str]
    vulnerabilities: List[Dict[str, Any]]
    build_performance: Dict[str, float]
    api_costs: Dict[str, float]
    outdated_packages: List[str]
    recommendations: List[str]

class SchedulerReport(BaseModel):
    report_id: str
    generated_at: datetime
    seo_analysis: TechnicalSEOScore
    tech_analysis: TechStackHealth
    publishing_stats: Dict[str, Any]
    calendar_overview: Dict[str, Any]
    action_items: List[str]
```

---

## Configuration

### Environment Variables
```bash
# Google APIs
GOOGLE_SEARCH_CONSOLE_CREDENTIALS=path/to/credentials.json
GOOGLE_INDEXING_API_KEY=your_api_key

# GitHub (for deployment)
GITHUB_TOKEN=your_github_token
GITHUB_REPO=username/repo

# Monitoring
SCHEDULER_AUDIT_FREQUENCY=weekly  # daily, weekly, monthly
SCHEDULER_AUTO_FIX=true  # Auto-fix simple issues
SCHEDULER_NOTIFY_EMAIL=team@example.com

# Publishing Settings
PUBLISH_AUTO_DEPLOY=true
PUBLISH_REQUIRE_APPROVAL=false  # Manual approval for publishes
PUBLISH_TIMEZONE=America/New_York
```

### Calendar Rules
```yaml
publishing_rules:
  - name: "Peak Hours"
    days: ["Monday", "Tuesday", "Wednesday", "Thursday"]
    times: ["09:00", "14:00", "18:00"]
    timezone: "America/New_York"

  - name: "Weekend Light"
    days: ["Saturday", "Sunday"]
    times: ["10:00"]
    timezone: "America/New_York"

  - name: "Avoid Holidays"
    blackout_dates: ["2026-12-25", "2026-01-01"]

content_rules:
  - type: "newsletter"
    frequency: "weekly"
    day: "Friday"
    time: "09:00"

  - type: "seo-content"
    frequency: "3x/week"
    spacing: "48h"  # Minimum hours between publishes

  - type: "article"
    frequency: "2x/week"
    spacing: "72h"
```

---

## Integration Points

### Input Sources
1. **SEO Robot** → Content queue (articles, optimized pages)
2. **Newsletter Agent** → Content queue (newsletters)
3. **Article Generator** → Content queue (competitor-based articles)
4. **Manual** → Priority queue (urgent content)

### Output Destinations
1. **GitHub** → Code repository (commits, PRs)
2. **Google Search Console** → URL submissions
3. **Google Indexing API** → Instant indexing
4. **Analytics Dashboard** → Performance metrics
5. **Notification System** → Slack/Email alerts

### Internal Dependencies
- **Astro Build System** → Static site generation
- **Git/GitHub** → Version control and deployment
- **NetworkX** → Internal linking graph analysis (from SEO Robot)
- **Lighthouse** → Page speed analysis
- **BeautifulSoup/Scrapy** → Site crawling

---

## Quality Metrics

### Publishing Performance
- **Uptime:** 99.9% availability
- **Time to Publish:** <2 hours from queue entry
- **Indexing Speed:** <24 hours average to Google index
- **Error Rate:** <1% deployment failures

### Analysis Accuracy
- **SEO Issue Detection:** >95% accuracy
- **False Positive Rate:** <5%
- **Tech Vulnerability Detection:** >98% accuracy
- **Cost Forecast Accuracy:** >90%

### User Experience
- **Report Generation:** <10 minutes
- **Dashboard Load Time:** <2 seconds
- **Calendar View Responsiveness:** <1 second

---

## Future Enhancements (Phase 7+)

1. **Multi-Platform Publishing**
   - Social media scheduling (Twitter, LinkedIn)
   - Medium/Dev.to cross-posting
   - Email newsletter automation

2. **AI-Driven Optimization**
   - ML-based optimal time prediction
   - Auto-A/B testing for publish times
   - Predictive analytics for content performance

3. **Advanced Analytics**
   - Real-time indexing status dashboard
   - Predictive SEO scoring
   - Competitive timing analysis

4. **Integration Expansion**
   - Bing Webmaster Tools
   - Yandex Webmaster
   - Additional search engines
