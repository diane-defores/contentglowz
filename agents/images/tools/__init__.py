"""Image Robot Tools"""
from agents.images.tools.robolly_tools import (
    generate_robolly_image,
    validate_robolly_image,
    get_robolly_templates
)
from agents.images.tools.bunny_cdn_tools import (
    upload_to_bunny_storage,
    verify_cdn_propagation,
    purge_cdn_cache,
    get_cdn_url
)
from agents.images.tools.optimization_tools import (
    compress_image,
    convert_to_webp,
    generate_responsive_variants,
    calculate_image_hash
)
from agents.images.tools.strategy_tools import (
    analyze_article_for_images,
    extract_key_topics,
    determine_image_count,
    select_templates_for_article
)

__all__ = [
    # Robolly tools
    "generate_robolly_image",
    "validate_robolly_image",
    "get_robolly_templates",
    # Bunny CDN tools
    "upload_to_bunny_storage",
    "verify_cdn_propagation",
    "purge_cdn_cache",
    "get_cdn_url",
    # Optimization tools
    "compress_image",
    "convert_to_webp",
    "generate_responsive_variants",
    "calculate_image_hash",
    # Strategy tools
    "analyze_article_for_images",
    "extract_key_topics",
    "determine_image_count",
    "select_templates_for_article"
]
