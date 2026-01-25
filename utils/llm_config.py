"""
LLM Configuration - OpenRouter Integration

Provides unified LLM access using OpenRouter for cost optimization.
Compatible with LangChain and CrewAI agents.

OpenRouter Benefits:
- 50-90% cheaper than direct API calls
- Access to 100+ models (GPT-4, Claude, Llama, etc.)
- Automatic fallback if model unavailable
- Single API key for all providers
- Pay only for what you use

Pricing Examples (per 1M tokens):
- GPT-4 Turbo: $10 input / $30 output (via OpenRouter)
- Claude 3 Opus: $15 input / $75 output
- Claude 3.5 Sonnet: $3 input / $15 output
- Llama 3 70B: $0.59 input / $0.79 output
- Mixtral 8x7B: $0.24 input / $0.24 output

vs Direct APIs:
- OpenAI GPT-4 Direct: $30 input / $60 output (3x more expensive)
- Anthropic Claude Direct: Similar or higher pricing

Get API key: https://openrouter.ai/keys
"""

import os
from typing import Optional, Dict, Any
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()


class LLMConfig:
    """
    Centralized LLM configuration using OpenRouter.
    
    Supports fallback to direct API keys if OpenRouter not configured.
    """
    
    # OpenRouter model mappings (cost-optimized)
    MODELS = {
        # Fast & Cheap (for research, analysis, drafts)
        "fast": "meta-llama/llama-3-70b-instruct",  # $0.59/$0.79 per 1M tokens
        "cheap": "mistralai/mixtral-8x7b-instruct",  # $0.24/$0.24 per 1M tokens
        
        # Balanced (for content generation, editing)
        "balanced": "anthropic/claude-3.5-sonnet",  # $3/$15 per 1M tokens
        "default": "anthropic/claude-3.5-sonnet",
        
        # Premium (for complex reasoning, final editing)
        "premium": "anthropic/claude-3-opus",  # $15/$75 per 1M tokens
        "best": "openai/gpt-4-turbo",  # $10/$30 per 1M tokens
        
        # Groq fallback (ultra-fast, free tier available)
        "groq-fast": "groq/llama-3-70b-8192",
        "groq-mixtral": "groq/mixtral-8x7b-32768",
    }
    
    @staticmethod
    def get_llm(
        model: str = "default",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        use_openrouter: bool = True,
        **kwargs
    ) -> ChatOpenAI:
        """
        Get LLM instance with OpenRouter or fallback to direct APIs.
        
        Args:
            model: Model tier or full model name
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            use_openrouter: Use OpenRouter if available (recommended)
            **kwargs: Additional LangChain ChatOpenAI parameters
            
        Returns:
            ChatOpenAI instance configured for OpenRouter or direct API
            
        Examples:
            # Use OpenRouter with balanced model
            llm = LLMConfig.get_llm("balanced")
            
            # Use cheap model for research
            llm = LLMConfig.get_llm("cheap", temperature=0.3)
            
            # Fallback to Groq if OpenRouter not configured
            llm = LLMConfig.get_llm("groq-fast")
        """
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        
        # Determine which model to use
        model_name = LLMConfig.MODELS.get(model, model)
        
        # Option 1: Use OpenRouter (recommended)
        if use_openrouter and openrouter_key:
            return ChatOpenAI(
                api_key=openrouter_key,
                base_url="https://openrouter.ai/api/v1",
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                model_kwargs={
                    "headers": {
                        "HTTP-Referer": os.getenv("APP_URL", "https://bizflowz.com"),
                        "X-Title": "BizFlowz SEO Robots"
                    }
                },
                **kwargs
            )
        
        # Option 2: Fallback to Groq (free/cheap)
        elif model_name.startswith("groq/"):
            groq_key = os.getenv("GROQ_API_KEY")
            if not groq_key:
                raise ValueError("GROQ_API_KEY not found in environment")
            
            # Use Groq-specific endpoint
            actual_model = model_name.replace("groq/", "")
            return ChatOpenAI(
                api_key=groq_key,
                base_url="https://api.groq.com/openai/v1",
                model=actual_model,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
        
        # Option 3: Fallback to direct OpenAI/Anthropic
        elif "gpt" in model_name:
            openai_key = os.getenv("OPENAI_API_KEY")
            if not openai_key:
                raise ValueError("OPENAI_API_KEY not found in environment")
            return ChatOpenAI(
                api_key=openai_key,
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
        
        elif "claude" in model_name:
            anthropic_key = os.getenv("ANTHROPIC_API_KEY")
            if not anthropic_key:
                raise ValueError("ANTHROPIC_API_KEY not found in environment")
            return ChatOpenAI(
                api_key=anthropic_key,
                base_url="https://api.anthropic.com/v1",
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
        
        else:
            raise ValueError(
                f"Model '{model}' not recognized and no OpenRouter key found. "
                f"Available tiers: {list(LLMConfig.MODELS.keys())}"
            )
    
    @staticmethod
    def get_cost_estimate(model: str, input_tokens: int, output_tokens: int) -> Dict[str, float]:
        """
        Estimate cost for a request using OpenRouter pricing.
        
        Args:
            model: Model tier or name
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            
        Returns:
            Dict with cost breakdown in USD
        """
        # Pricing per 1M tokens (approximate, check openrouter.ai for latest)
        pricing = {
            "fast": (0.59, 0.79),
            "cheap": (0.24, 0.24),
            "balanced": (3.0, 15.0),
            "premium": (15.0, 75.0),
            "best": (10.0, 30.0),
        }
        
        model_name = LLMConfig.MODELS.get(model, model)
        tier = next((k for k, v in LLMConfig.MODELS.items() if v == model_name), "balanced")
        
        input_rate, output_rate = pricing.get(tier, (3.0, 15.0))
        
        input_cost = (input_tokens / 1_000_000) * input_rate
        output_cost = (output_tokens / 1_000_000) * output_rate
        total_cost = input_cost + output_cost
        
        return {
            "input_cost_usd": round(input_cost, 6),
            "output_cost_usd": round(output_cost, 6),
            "total_cost_usd": round(total_cost, 6),
            "model": model_name,
            "tier": tier
        }


# Convenience functions
def get_fast_llm(**kwargs) -> ChatOpenAI:
    """Get fast, cheap LLM for research and analysis."""
    return LLMConfig.get_llm("fast", **kwargs)


def get_balanced_llm(**kwargs) -> ChatOpenAI:
    """Get balanced LLM for content generation."""
    return LLMConfig.get_llm("balanced", **kwargs)


def get_premium_llm(**kwargs) -> ChatOpenAI:
    """Get premium LLM for complex reasoning."""
    return LLMConfig.get_llm("premium", **kwargs)
