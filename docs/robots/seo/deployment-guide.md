# 🚀 SEO Deployment Guide

## Quick Start

### Option 1: Manual Execution (Recommended for testing)

```bash
# Test with dry-run (no commit)
python run_seo_deployment.py "content marketing" --dry-run

# Run and deploy to GitHub
python run_seo_deployment.py "content marketing"

# Batch process multiple topics
python run_seo_deployment.py --batch "seo tools" "link building" "keyword research"

# Check deployment status
python run_seo_deployment.py --status
```

### Option 2: Automated Cron Jobs

#### 1. Setup Cron Schedule

Edit `cron_seo_schedule.txt` with your topics:

```bash
# Daily at 9 AM
0 9 * * * cd /root/my-robots && /root/my-robots/venv/bin/python3 run_seo_deployment.py "your topic" >> /var/log/seo-bot.log 2>&1
```

#### 2. Install Cron Job

```bash
# Install
crontab cron_seo_schedule.txt

# Verify
crontab -l

# View logs
tail -f /var/log/seo-bot.log
```

#### 3. Create Log Directory (if needed)

```bash
sudo touch /var/log/seo-bot.log
sudo chmod 666 /var/log/seo-bot.log
```

## How It Works

### Pipeline Flow

```
1. Research Analyst
   ├─ Analyzes SERP for target keyword
   ├─ Identifies competitors
   └─ Finds content gaps

2. Content Strategist
   ├─ Builds topic clusters
   ├─ Creates content outlines
   └─ Plans editorial calendar

3. GitHub Deployment
   ├─ Creates markdown file
   ├─ Adds SEO metadata
   ├─ Commits to repository
   └─ Triggers GitHub Pages rebuild
```

### Output Location

Content is deployed to:
```
website/src/pages/strategies/[topic-slug].md
```

### Git Integration

- Auto-commits to current branch (usually `master`)
- Commit message: `SEO: Add [Title]`
- Pushes to origin automatically

## Command Reference

### Basic Commands

```bash
# Single topic
python run_seo_deployment.py "topic name"

# Skip deployment (save locally only)
python run_seo_deployment.py "topic" --no-deploy

# Dry run (test without saving)
python run_seo_deployment.py "topic" --dry-run

# Check status
python run_seo_deployment.py --status
```

### Batch Processing

```bash
# Multiple topics with default 60s delay
python run_seo_deployment.py --batch "topic 1" "topic 2" "topic 3"

# Custom delay between topics (120s)
python run_seo_deployment.py --batch "topic 1" "topic 2" --delay 120

# Batch without auto-commit
python run_seo_deployment.py --batch "topic 1" "topic 2" --no-deploy
```

## Cron Schedule Examples

```bash
# Daily at 9 AM
0 9 * * * [command]

# Monday and Thursday at 10 AM
0 10 * * 1,4 [command]

# Twice daily (9 AM and 6 PM)
0 9,18 * * * [command]

# Every 4 hours
0 */4 * * * [command]

# First day of month at 9 AM
0 9 1 * * [command]

# Weekdays only at 2 PM
0 14 * * 1-5 [command]
```

## Troubleshooting

### Check Git Status

```bash
cd /root/my-robots
git status
git log --oneline -5
```

### View Recent Deployments

```bash
ls -lt website/src/pages/strategies/
```

### Check Cron Logs

```bash
# View logs
tail -f /var/log/seo-bot.log

# View recent errors
grep -i error /var/log/seo-bot.log

# View cron execution history
grep CRON /var/log/syslog
```

### Test GitHub Tools Directly

```python
from agents.seo.tools.github_tools import check_deployment_status

status = check_deployment_status()
print(status)
```

## Environment Variables

Ensure these are set in `.env`:

```bash
GROQ_API_KEY=your_key_here
SERPER_API_KEY=your_key_here  # For SERP analysis
```

## Repository Structure

The SEO agents work directly with your repository:
- Analyze existing site structure
- Modify markdown files in place
- Commit changes back to GitHub
- Your hosting provider rebuilds automatically

## Best Practices

1. **Test First**: Always use `--dry-run` with new topics
2. **Start Manual**: Run manually before setting up cron
3. **Monitor Logs**: Check logs regularly for errors
4. **Batch Wisely**: Use delays to avoid API rate limits
5. **Review Output**: Check generated content quality
6. **Git Hygiene**: Review commits before pushing to production

## Cost Optimization

- Use Groq (free tier) for LLM calls
- Batch similar topics to reduce API calls
- Cache research data when possible
- Set reasonable cron intervals (daily, not hourly)

## Next Steps

After deployment is working:

1. Add more agents (Copywriter, Technical SEO)
2. Implement content validation
3. Add schema.org markup generation
4. Set up performance monitoring
5. Create deployment notifications (email/Slack)
