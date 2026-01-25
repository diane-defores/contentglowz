# GitHub Repository Analyzer - Quick Reference

## Usage

### Analyze Any GitHub Repository

```python
from agents.seo.tools.repo_analyzer import GitHubRepoAnalyzer

analyzer = GitHubRepoAnalyzer()

# Analyze with auto-fetch latest
report = analyzer.generate_analysis_report(
    repo_url="https://github.com/username/website.git",
    target_topics=["seo", "marketing", "automation"]
)

print(f"Framework: {report['structure']['framework']}")
print(f"Total pages: {report['seo_data']['total_pages']}")
print(f"Missing topics: {report['content_gaps']['missing_topics']}")
```

### Integrated with SEO Pipeline

```bash
# Analyze target site + run SEO pipeline
python run_seo_deployment.py "content strategy" --repo https://github.com/user/site.git

# Batch with repo analysis
python run_seo_deployment.py --batch "seo" "marketing" --repo https://github.com/user/site.git
```

## Features

### 🔄 Auto-Fetch Latest
**Always syncs before analysis** - `force_update=True` by default

```python
# Clones if new, or git pull if exists
repo_path = analyzer.clone_or_update_repo(
    "https://github.com/user/site.git",
    force_update=True  # Default
)
```

### 🏗️ Site Structure Detection
- Detects: Astro, Next.js, Gatsby
- Finds config files
- Maps content directories
- Counts total files

### 📄 Content File Discovery
Finds all markdown/MDX/Astro files:
```python
content_files = analyzer.find_all_content_files(repo_path)
# Returns: path, filename, size, modified date, frontmatter
```

### 🔍 Metadata Extraction
- Extracts YAML frontmatter
- Analyzes titles, descriptions, keywords
- Calculates SEO coverage stats

### 🔗 Internal Link Mapping
- Maps all internal markdown links
- Identifies orphan pages (no incoming links)
- Counts links per page

### 🎯 Content Gap Analysis
```python
gaps = analyzer.get_content_gaps(
    repo_path,
    target_topics=["seo", "marketing", "content"]
)
# Returns: covered_topics, missing_topics, partial_coverage
```

## Repository Storage

Cloned repos stored in:
```
/root/my-robots/data/repos/
├── website-1/
├── website-2/
└── competitor-site/
```

## Cron Integration

Update crontab to include repo analysis:

```bash
# Daily analysis with target repo
0 9 * * * cd /root/my-robots && python3 run_seo_deployment.py "seo" --repo https://github.com/user/site.git >> /var/log/seo-bot.log 2>&1
```

## API Reference

### GitHubRepoAnalyzer

#### Methods

**`clone_or_update_repo(repo_url, force_update=True)`**
- Clones or fetches latest changes
- Returns: Path to repo

**`analyze_site_structure(repo_path)`**
- Detects framework and config
- Returns: Structure dict

**`find_all_content_files(repo_path, extensions=['.md', '.mdx', '.astro'])`**
- Finds all content files
- Returns: List of file info dicts

**`extract_metadata(repo_path)`**
- Comprehensive metadata extraction
- Returns: Metadata dict with SEO stats

**`map_internal_links(repo_path, content_files=None)`**
- Maps internal linking structure
- Returns: Link map with orphan pages

**`get_content_gaps(repo_path, target_topics)`**
- Identifies missing content
- Returns: Gap analysis dict

**`generate_analysis_report(repo_url, target_topics=None)`**
- Complete analysis workflow
- Returns: Full report dict

## Example Workflow

```python
# 1. Analyze competitor site
analyzer = GitHubRepoAnalyzer()
competitor_report = analyzer.generate_analysis_report(
    "https://github.com/competitor/site.git",
    target_topics=["seo", "content marketing"]
)

# 2. Identify gaps
gaps = competitor_report['content_gaps']['missing_topics']
print(f"Opportunities: {gaps}")

# 3. Analyze internal linking
orphans = competitor_report['internal_links']['orphan_pages']
print(f"Orphan pages: {len(orphans)}")

# 4. Use insights for SEO strategy
# (Pass to Content Strategist agent)
```

## Tips

✅ **Always fetches latest** - No stale data  
✅ **Works offline after clone** - Fast subsequent analysis  
✅ **Respects .gitignore** - No node_modules clutter  
✅ **Handles multiple repos** - Analyze competitors in batch  
✅ **Integrates with agents** - Context for SEO decisions  

## Test Run

```bash
# Test the analyzer
python agents/seo/tools/repo_analyzer.py
```
