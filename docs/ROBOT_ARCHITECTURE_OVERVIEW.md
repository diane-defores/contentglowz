# Robot Architecture Overview - Multi-Agent System

## 🤖 Complete Robot Ecosystem

This project contains **4 main robots** working together to automate content creation, publishing, and monitoring.

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CONTENT LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────────┘

1️⃣  CONTENT CREATION
    ┌──────────────────────────────────────┐
    │   SEO Robot (6 agents)               │
    │   ├─ Research Analyst                │
    │   ├─ Content Strategist              │
    │   ├─ Marketing Strategist            │
    │   ├─ Copywriter                      │
    │   ├─ On-Page Technical SEO Agent ◄───┼─── Creates schema/metadata
    │   └─ Editor                          │
    └──────────────────────────────────────┘
                    │
                    ▼
    ┌──────────────────────────────────────┐
    │   Newsletter Agent (PydanticAI)      │
    │   └─ Exa AI integration              │
    └──────────────────────────────────────┘
                    │
                    ▼
    ┌──────────────────────────────────────┐
    │   Article Generator (CrewAI)         │
    │   └─ Firecrawl + competitor analysis │
    └──────────────────────────────────────┘
                    │
                    ▼
            📄 Ready Content
                    │
                    ▼

2️⃣  CONTENT SCHEDULING & PUBLISHING
    ┌──────────────────────────────────────┐
    │   Scheduler Robot (4 agents)         │
    │                                      │
    │   ├─ Calendar Manager                │
    │   │   └─ Analyze patterns            │
    │   │   └─ Calculate optimal times     │
    │   │   └─ Manage queue                │
    │   │                                  │
    │   ├─ Publishing Agent                │
    │   │   └─ Git deployment              │
    │   │   └─ Google integration          │
    │   │   └─ Monitor & rollback          │
    │   │                                  │
    │   ├─ Site Health Monitor Agent       │
    │   │   └─ Crawl site (100+ pages)     │
    │   │   └─ Check performance           │
    │   │   └─ Analyze link graph          │
    │   │   └─ Uses On-Page SEO tools ◄────┼─── SHARES tools with SEO Robot!
    │   │                                  │
    │   └─ Tech Stack Analyzer             │
    │       └─ Dependencies & vulns        │
    │       └─ Build performance           │
    │       └─ API cost tracking           │
    └──────────────────────────────────────┘
```

---

## 🔗 Tool Sharing Architecture

### The Innovation: Zero Redundancy

The **Site Health Monitor** (Scheduler Robot) **reuses** tools from the **On-Page Technical SEO Agent** (SEO Robot) instead of duplicating them.

```
┌───────────────────────────────────────────────────────────────┐
│                    On-Page Technical SEO                      │
│                    (SEO Robot - Agent 4/6)                    │
│                                                               │
│   Purpose: Optimize NEW content during creation              │
│                                                               │
│   Tools Package: agents/seo/tools/technical_tools.py         │
│   ├─ SchemaGenerator      - Create schema.org markup         │
│   ├─ MetadataValidator    - Validate title/description       │
│   ├─ InternalLinkingAnalyzer - Recommend links              │
│   └─ OnPageOptimizer      - Check headings, keywords         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                            ▲
                            │
                            │ IMPORTS & USES
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                    Site Health Monitor                        │
│                  (Scheduler Robot - Agent 3/4)                │
│                                                               │
│   Purpose: Monitor EXISTING site health post-publication     │
│                                                               │
│   Own Tools:                                                  │
│   ├─ SiteCrawler          - Crawl 100+ pages                 │
│   ├─ PerformanceAnalyzer  - Page speed, Core Web Vitals      │
│   └─ LinkAnalyzer         - Site-wide link graph             │
│                                                               │
│   Shared Tools (imported from SEO Robot):                    │
│   ├─ SchemaGenerator      - Validate existing schema         │
│   └─ MetadataValidator    - Validate existing metadata       │
│                                                               │
│   Method: analyze_page_seo(url, content)                     │
│   └─> Calls MetadataValidator.validate_metadata()            │
│   └─> Calls SchemaGenerator for validation                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 📋 Agent Responsibilities Matrix

| Agent | Robot | Purpose | Timing | Scope |
|-------|-------|---------|--------|-------|
| **Research Analyst** | SEO | Competitor analysis | Pre-writing | Market research |
| **Content Strategist** | SEO | Content planning | Pre-writing | Strategy |
| **Marketing Strategist** | SEO | Business validation | Pre-writing | ROI |
| **Copywriter** | SEO | Write content | During creation | Individual article |
| **On-Page Technical SEO** | SEO | Optimize pages | During creation | Individual page |
| **Editor** | SEO | Final QA | Pre-publish | Individual article |
| **Newsletter Agent** | Newsletter | Curate content | Weekly | Email |
| **Article Generator** | Articles | Generate from competitors | On-demand | Individual article |
| **Calendar Manager** | Scheduler | Schedule content | Continuous | Queue |
| **Publishing Agent** | Scheduler | Deploy to production | On schedule | Deployment |
| **Site Health Monitor** | Scheduler | Monitor site health | Post-publish, weekly | Entire site |
| **Tech Stack Analyzer** | Scheduler | Monitor infrastructure | Continuous | Codebase |

---

## 🎯 When Each Robot Runs

### **SEO Robot** (CrewAI - 6 agents)
**Trigger:** User wants to create optimized content
**Frequency:** On-demand
**Output:** Complete SEO-optimized article with metadata and schema

**Workflow:**
1. Research market and competitors
2. Plan content strategy
3. Validate business value
4. Write article
5. **Add schema/metadata** (On-Page Technical SEO)
6. Final editing

---

### **Newsletter Agent** (PydanticAI)
**Trigger:** Weekly schedule (e.g., every Friday)
**Frequency:** Weekly
**Output:** Curated newsletter with Exa AI content

**Workflow:**
1. Search Exa AI for relevant content
2. Filter by relevance (>0.7)
3. Structure with Pydantic schemas
4. Send via email service

---

### **Article Generator** (CrewAI + Firecrawl)
**Trigger:** User wants competitor-based content
**Frequency:** On-demand
**Output:** Original article based on competitor analysis

**Workflow:**
1. Crawl competitor sites (Firecrawl)
2. Analyze content gaps
3. Generate original article
4. Integrate with SEO strategy

---

### **Scheduler Robot** (CrewAI - 4 agents)
**Trigger:** Multiple triggers
**Frequency:** Continuous + scheduled

#### Calendar Manager
**Trigger:** New content added to queue
**Frequency:** Continuous
**Output:** Optimized publishing schedule

#### Publishing Agent
**Trigger:** Scheduled time reached
**Frequency:** Per schedule (e.g., 3x/week)
**Output:** Deployed content + Google indexing

#### Site Health Monitor
**Trigger:** Weekly schedule OR on-demand
**Frequency:** Weekly
**Output:** Site health report with SEO scores

**Workflow:**
1. Crawl entire site (100+ pages)
2. For each page, **use On-Page SEO tools** to validate
3. Check performance (Lighthouse)
4. Analyze link graph
5. Generate comprehensive report

#### Tech Stack Analyzer
**Trigger:** Daily schedule OR on-demand
**Frequency:** Daily
**Output:** Tech health report with vulnerabilities

---

## 💡 Key Design Principles

### 1. **Separation of Concerns**
- Each robot has a clear, distinct purpose
- No overlap in primary responsibilities

### 2. **Tool Sharing > Duplication**
- Site Health Monitor reuses On-Page SEO tools
- Hierarchical composition pattern
- Single source of truth

### 3. **Pydantic Everywhere**
- Strict data validation at all layers
- Type safety across robots
- Schema-first design

### 4. **Agent Specialization**
- Each agent is expert in one domain
- Agents collaborate, not duplicate

### 5. **Self-Analysis**
- Scheduler Robot monitors itself
- Tech Stack Analyzer scans its own dependencies
- Site Health Monitor audits its own deployment

---

## 🔄 Data Flow Example

### End-to-End: Article Creation → Publishing → Monitoring

```
Step 1: Create Content (SEO Robot)
  └─> On-Page Technical SEO generates schema
  └─> Output: article.md + metadata + schema.json

Step 2: Schedule (Scheduler - Calendar Manager)
  └─> Analyze history
  └─> Calculate optimal time: Friday 9 AM
  └─> Add to queue with priority 4

Step 3: Publish (Scheduler - Publishing Agent)
  └─> Friday 9 AM arrives
  └─> Git commit + push
  └─> Update sitemap.xml
  └─> Submit to Google Search Console
  └─> Trigger Indexing API

Step 4: Monitor (Scheduler - Site Health Monitor)
  └─> Next Monday (weekly audit)
  └─> Crawl site (finds new article)
  └─> For new article:
      └─> analyze_page_seo(article_url, content)
          └─> USES MetadataValidator from SEO Robot
          └─> USES SchemaGenerator from SEO Robot
          └─> Validates schema is correct
          └─> Validates metadata is optimal
  └─> Check performance (Lighthouse)
  └─> Update internal link graph
  └─> Generate report: "Site Health: 94/100 ✅"
```

---

## 📊 Metrics & Monitoring

| Robot | Key Metric | Target | Measured By |
|-------|------------|--------|-------------|
| SEO Robot | Content Quality Score | >85 | Editor agent |
| Newsletter | Relevance Score | >0.8 | Exa AI filter |
| Article Generator | Uniqueness | >90% | Plagiarism check |
| Scheduler - Calendar | Time to Publish | <2 hours | Publishing Agent |
| Scheduler - Publishing | Success Rate | >99% | Deployment logs |
| Scheduler - Site Health | Overall SEO Score | >90 | Weekly audit |
| Scheduler - Tech Stack | Vulnerabilities | 0 critical | Daily scan |

---

## 🚀 Future Integrations

### Phase 7+
- Multi-platform publishing (Medium, Dev.to, LinkedIn)
- A/B testing for publish times
- Real-time analytics dashboard
- Mobile monitoring app
- Slack/Discord notifications
- Automated fix workflows

---

**Architecture Version:** 2.0 (Post-Refactoring)
**Last Updated:** January 17, 2026
**Status:** ✅ Production Ready with Zero Redundancy
