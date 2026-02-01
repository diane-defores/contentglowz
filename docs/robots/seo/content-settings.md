# Content Configuration System

This document outlines the decoupled configuration system for content robots, focusing on frontmatter validation.

## Overview

The system is designed to be autonomous and is not coupled with the internal linking configuration. It allows for defining hierarchical and persistent settings for content validation.

- **Main Configuration**: `/agents/seo/config/content_config.py`
- **Validator Engine**: `/agents/seo/validation/frontmatter_validator.py`
- **Database Tables**: `ProjectContentConfig`, `UserContentConfig` (in Turso)

## Configuration Layers

Settings are applied with the following precedence (highest to lowest):
1.  **Custom Settings**: Runtime overrides.
2.  **Session Config**: (Not yet implemented).
3.  **User Config**: Fetched from `UserContentConfig` table.
4.  **Project Config**: Fetched from `ProjectContentConfig` table.
5.  **Default Config**: Defined in `content_config.py`.

## Frontmatter Validation

Validation rules are defined in `content_config.py` using `FrontmatterValidationConfig`.

### Example: `strict_seo` Template

This template enforces strict SEO rules for frontmatter.

```python
"strict_seo": ContentConfiguration(
    frontmatter_validation=FrontmatterValidationConfig(
        strict_mode=True,
        fields={
            "title": FrontmatterField(
                field_type=FieldType.STRING,
                rules=[
                    ValidationRule(rule_type="required"),
                    ValidationRule(rule_type="minLength", value=20),
                    ValidationRule(rule_type="maxLength", value=70)
                ]
            ),
            "description": FrontmatterField(
                field_type=FieldType.STRING,
                rules=[
                    ValidationRule(rule_type="required"),
                    ValidationRule(rule_type="minLength", value=50),
                    ValidationRule(rule_type="maxLength", value=160)
                ]
            ),
            # ... other fields
        }
    )
),
```

### Usage

The `FrontmatterValidator` class uses the configuration to validate content.

```python
from agents.seo.config.content_config import config_manager
from agents.seo.validation.frontmatter_validator import FrontmatterValidator

# Get merged configuration
config = await config_manager.get_config(user_id="some-user", project_id="some-project")

# Validate
validator = FrontmatterValidator(config)
errors = validator.validate(my_frontmatter_dict)

if errors:
    print("Validation failed:", errors)
```
