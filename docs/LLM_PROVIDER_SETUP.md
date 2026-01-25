# LLM Provider Setup Guide

This guide covers LLM configuration with OpenRouter (recommended) and Groq fallback.

## Quick Start

```python
from utils.llm_config import LLMConfig

# Use tier-based selection
llm = LLMConfig.get_llm("balanced")  # Claude 3.5 Sonnet
llm = LLMConfig.get_llm("fast")      # Llama 3 70B
llm = LLMConfig.get_llm("premium")   # Claude 3 Opus
```

---

## Why OpenRouter?

OpenRouter provides **50-90% cost savings** with access to 100+ models through a single API key.

### Cost Comparison (per 1M tokens)

| Model | Direct API | OpenRouter | Savings |
|-------|-----------|------------|---------|
| GPT-4 Turbo | $30/$60 | $10/$30 | **67%** |
| Claude 3.5 Sonnet | $3/$15 | $3/$15 | Same, unified billing |
| Llama 3 70B | N/A | $0.59/$0.79 | **97% vs GPT-4** |
| Mixtral 8x7B | N/A | $0.24/$0.24 | **99% vs GPT-4** |

### Benefits
- Single API key for all providers
- Automatic fallback if model unavailable
- Built-in rate limiting and load balancing
- Detailed usage analytics
- Pay-as-you-go (no subscriptions)
- $5 free credit on signup

---

## Setup

### 1. Get API Key

```bash
# Sign up at https://openrouter.ai/
# Get $5 free credit on signup
# Generate API key: https://openrouter.ai/keys
```

### 2. Add to Doppler

```bash
doppler secrets set OPENROUTER_API_KEY="sk-or-v1-..."

# Optional: Keep Groq as fallback
doppler secrets set GROQ_API_KEY="gsk_..."
```

---

## Model Tiers

### Cheap Tier (Research & Drafts)
- **Model**: Mixtral 8x7B
- **Cost**: $0.24/$0.24 per 1M tokens
- **Use for**: Research, analysis, initial drafts

### Fast Tier (Data Processing)
- **Model**: Llama 3 70B
- **Cost**: $0.59/$0.79 per 1M tokens
- **Use for**: SERP analysis, keyword research, data extraction

### Balanced Tier (Content Generation) - DEFAULT
- **Model**: Claude 3.5 Sonnet
- **Cost**: $3/$15 per 1M tokens
- **Use for**: Article writing, SEO content, newsletters

### Premium Tier (Complex Reasoning)
- **Model**: Claude 3 Opus
- **Cost**: $15/$75 per 1M tokens
- **Use for**: Final editing, complex strategy, technical analysis

### Best Tier (Maximum Quality)
- **Model**: GPT-4 Turbo
- **Cost**: $10/$30 per 1M tokens
- **Use for**: Critical content, final QA

---

## Usage Examples

### Basic Usage

```python
from utils.llm_config import LLMConfig

# Fast & cheap for research
llm = LLMConfig.get_llm("fast")

# Balanced for content
llm = LLMConfig.get_llm("balanced")

# Premium for complex tasks
llm = LLMConfig.get_llm("premium")

# With custom temperature
llm = LLMConfig.get_llm("balanced", temperature=0.7)
```

### Convenience Functions

```python
from utils.llm_config import get_fast_llm, get_balanced_llm, get_premium_llm

research_llm = get_fast_llm(temperature=0.3)
content_llm = get_balanced_llm(temperature=0.7)
editor_llm = get_premium_llm(temperature=0.5)
```

### With CrewAI Agents

```python
from crewai import Agent
from utils.llm_config import LLMConfig

agent = Agent(
    role="SEO Research Analyst",
    goal="Analyze SERP data",
    llm=LLMConfig.get_llm("fast"),  # Cost-optimized
    tools=[...],
)
```

### Cost Estimation

```python
from utils.llm_config import LLMConfig

cost = LLMConfig.get_cost_estimate(
    model="balanced",
    input_tokens=1000,
    output_tokens=500
)
print(f"Estimated cost: ${cost['total_cost_usd']:.4f}")
```

---

## Agent-Specific Recommendations

| Agent | Tier | Model | Rationale |
|-------|------|-------|-----------|
| Research Analyst | Fast | Llama 3 70B | Data analysis, patterns |
| Content Strategist | Balanced | Claude 3.5 Sonnet | Strategy reasoning |
| Marketing Strategist | Balanced | Claude 3.5 Sonnet | Business insights |
| Copywriter | Balanced | Claude 3.5 Sonnet | Quality content |
| Technical SEO | Fast | Llama 3 70B | Structured data |
| Editor | Premium | Claude 3 Opus | Final polish |

**Estimated Monthly Cost (1000 requests)**:
- All Groq (free): $0 but limited models
- All Direct APIs: ~$50-100/month
- **With OpenRouter: ~$10-20/month** (5-10x cheaper)

---

## Groq (Free Alternative)

Groq offers **100% free** LLM access with rate limits.

### Setup

```bash
# Get free key at https://console.groq.com
doppler secrets set GROQ_API_KEY="gsk_..."
```

### Available Models (All Free)

| Model | Size | Daily Limit | Use Case |
|-------|------|-------------|----------|
| `llama-3.1-70b-versatile` | 70B | 7,200 req | Best quality |
| `llama-3.1-8b-instant` | 8B | 14,400 req | Fastest |
| `mixtral-8x7b-32768` | 8x7B | 14,400 req | Long context |
| `gemma2-9b-it` | 9B | 14,400 req | Google model |

### Usage with CrewAI

```python
from crewai import Agent, LLM
import os

llm = LLM(
    model="groq/llama-3.1-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY")
)

agent = Agent(
    role="SEO Expert",
    goal="Optimize content",
    llm=llm
)
```

---

## Fallback Strategy

The `LLMConfig` automatically handles fallbacks:

```
1. Try OpenRouter (if OPENROUTER_API_KEY set)
   ↓ fails
2. Try Groq (if GROQ_API_KEY set)
   ↓ fails
3. Try Direct API (OpenAI/Anthropic)
   ↓ fails
4. Raise error with helpful message
```

This ensures your app never breaks due to a single API being down.

---

## Simplified Dependencies

### Before (Complex)
```
langchain>=0.1.0
langchain-groq>=0.0.1
langchain-openai>=0.0.5
groq>=0.4.0
```

### After (Simple)
```
openai>=1.0.0  # Single dependency!
```

**Benefits**:
- One package instead of 4+
- Smaller Docker images (~500MB less)
- Faster builds (2-3x)
- Access to ALL models through OpenRouter

---

## Monitoring Costs

**OpenRouter Dashboard**: https://openrouter.ai/activity

Track:
- Cost per model
- Requests per day
- Average tokens per request
- Monthly spend projection

**Budget Alerts**:
- Dashboard → Settings → Budget Alerts
- Get notified at $5, $10, $20 thresholds

---

## Troubleshooting

### "Invalid API key"
```bash
# Check key is set
doppler secrets get OPENROUTER_API_KEY

# Key should start with: sk-or-v1-
```

### "Model not found"
```python
# Use tier name
llm = LLMConfig.get_llm("balanced")  # Works

# Or full model name
llm = LLMConfig.get_llm("anthropic/claude-3.5-sonnet")
```

### Rate limit exceeded (Groq)
- Wait 24 hours, or
- Use OpenRouter instead, or
- Create another Groq account

---

## Migration from Direct APIs

```python
# Before (direct Groq)
from langchain_groq import ChatGroq
llm = ChatGroq(api_key=os.getenv("GROQ_API_KEY"), model="mixtral-8x7b-32768")

# After (OpenRouter with fallback)
from utils.llm_config import LLMConfig
llm = LLMConfig.get_llm("cheap")  # Uses Mixtral via OpenRouter
```

---

## Summary

| Aspect | Groq (Free) | OpenRouter (Paid) |
|--------|-------------|-------------------|
| Cost | $0 | Pay-as-you-go |
| Models | Groq only | 100+ models |
| Rate limits | Lower | Higher |
| Fallback | None | Automatic |
| Best for | Testing, learning | Production |

**Recommendation**: Start with Groq for testing, migrate to OpenRouter for production.
