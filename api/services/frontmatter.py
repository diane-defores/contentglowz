"""
Frontmatter Parser/Writer — Read and update YAML frontmatter in Markdown files.

Handles the standard format:
    ---
    key: value
    ---
    Body content here...
"""

import re
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import yaml


_FM_PATTERN = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def read_frontmatter(file_path: str) -> Dict[str, Any]:
    """Parse YAML frontmatter from a Markdown file.

    Returns an empty dict if no frontmatter is found.
    """
    content = Path(file_path).read_text(encoding="utf-8")
    match = _FM_PATTERN.match(content)
    if not match:
        return {}
    return yaml.safe_load(match.group(1)) or {}


def read_frontmatter_and_body(file_path: str) -> Tuple[Dict[str, Any], str]:
    """Parse frontmatter and return (frontmatter_dict, body_text)."""
    content = Path(file_path).read_text(encoding="utf-8")
    match = _FM_PATTERN.match(content)
    if not match:
        return {}, content
    fm = yaml.safe_load(match.group(1)) or {}
    body = content[match.end():]
    return fm, body


def update_frontmatter(file_path: str, updates: Dict[str, Any]) -> None:
    """Update specific frontmatter fields without touching the body.

    Only modifies the fields present in `updates`. Other fields are preserved.
    The body content is untouched.
    """
    content = Path(file_path).read_text(encoding="utf-8")
    match = _FM_PATTERN.match(content)
    if not match:
        raise ValueError(f"No frontmatter found in {file_path}")

    fm = yaml.safe_load(match.group(1)) or {}
    fm.update(updates)

    # Rebuild the file: new frontmatter + original body
    body = content[match.end():]
    new_fm = yaml.dump(fm, default_flow_style=False, allow_unicode=True, sort_keys=False)
    Path(file_path).write_text(f"---\n{new_fm}---\n{body}", encoding="utf-8")
