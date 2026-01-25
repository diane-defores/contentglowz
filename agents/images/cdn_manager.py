"""
CDN Manager Agent
Uploads images to Bunny.net CDN and manages delivery
"""
from crewai import Agent, Task
from typing import Dict, Any, List, Optional
import re
import logging
from datetime import datetime

from agents.images.tools.bunny_cdn_tools import (
    upload_to_bunny_storage,
    verify_cdn_propagation,
    purge_cdn_cache,
    get_cdn_url
)
from agents.images.schemas.image_schemas import (
    ResponsiveImageSet,
    CDNUploadResult,
    ImageGenerationResult,
    ImageType
)
from agents.images.config.image_config import BUNNY_CONFIG

logger = logging.getLogger(__name__)


def create_cdn_manager(llm_model: str = "gpt-4o-mini") -> Agent:
    """
    Create the CDN Manager Agent.

    This agent manages CDN operations:
    - Uploads optimized images to Bunny.net Storage
    - Verifies CDN propagation
    - Generates final CDN URLs
    - Inserts images into article markdown

    Args:
        llm_model: LLM model to use for reasoning

    Returns:
        Configured CrewAI Agent
    """
    return Agent(
        role="CDN Deployment Specialist",
        goal="Deploy images to Bunny.net CDN and integrate them into article content",
        backstory="""You are an expert in CDN management and content delivery with expertise in:
        - Bunny.net Storage and CDN APIs
        - Content delivery optimization
        - Cache management and invalidation
        - Markdown content manipulation

        You ensure images are:
        - Properly uploaded to CDN storage
        - Verified for global accessibility
        - Correctly integrated into article markdown
        - Optimized for delivery with proper cache headers

        You understand the importance of:
        - Verifying CDN propagation before considering upload complete
        - Using proper file paths for organization
        - Generating accessible and cacheable URLs
        - Integrating images with proper markdown syntax and alt text""",
        tools=[
            upload_to_bunny_storage,
            verify_cdn_propagation,
            purge_cdn_cache,
            get_cdn_url
        ],
        verbose=True,
        allow_delegation=False
    )


def create_deployment_task(
    agent: Agent,
    image_sets: List[Dict[str, Any]],
    article_content: str,
    path_type: str = "articles"
) -> Task:
    """
    Create a deployment task for the CDN Manager.

    Args:
        agent: The CDN Manager agent
        image_sets: List of ResponsiveImageSet dicts
        article_content: Original article markdown
        path_type: CDN path type

    Returns:
        CrewAI Task for CDN deployment
    """
    images_text = "\n".join([
        f"- {img['file_name']}: {len(img.get('variants', []))} variants"
        for img in image_sets
    ])

    return Task(
        description=f"""Deploy the following optimized images to Bunny.net CDN.

**Images to Deploy:**
{images_text}

**CDN Path Type:** {path_type}

**Your Tasks:**
1. Upload each image variant to Bunny.net Storage
2. Verify CDN propagation for each uploaded image
3. Generate final CDN URLs
4. Insert images into article markdown at appropriate positions
5. Generate srcset markup for responsive images

**Integration Requirements:**
- Hero image should be at the top of the article
- Section images should follow their respective headings
- All images must have proper alt text
- Use lazy loading for below-fold images""",
        agent=agent,
        expected_output="""Deployment results:
- cdn_urls: List of all uploaded CDN URLs
- markdown_with_images: Updated article content with images
- upload_results: Status of each upload
- total_cdn_size_kb: Total storage used"""
    )


class CDNManager:
    """
    High-level interface for the CDN Manager agent.
    Provides methods for uploading and managing CDN content.
    """

    def __init__(self, llm_model: str = "gpt-4o-mini"):
        self.agent = create_cdn_manager(llm_model)
        self.llm_model = llm_model

    def upload_image_set(
        self,
        image_set: ResponsiveImageSet,
        path_type: str = "articles"
    ) -> Dict[str, Any]:
        """
        Upload a complete image set (all variants) to CDN.

        Args:
            image_set: ResponsiveImageSet with optimized variants
            path_type: CDN path type (articles, newsletter, social)

        Returns:
            Upload results with CDN URLs
        """
        start_time = datetime.utcnow()
        upload_results = []
        cdn_urls = {}

        try:
            for variant in image_set.variants:
                # Generate filename with suffix
                extension = f".{variant.format}" if isinstance(variant.format, str) else f".{variant.format.value}"
                filename = f"{image_set.file_name}{variant.suffix}{extension}"

                # Upload to CDN
                result = upload_to_bunny_storage(
                    source=variant.local_path,
                    file_name=filename,
                    path_type=path_type
                )

                if result.get("success"):
                    # Verify propagation
                    verification = verify_cdn_propagation(result["cdn_url"])

                    upload_result = CDNUploadResult(
                        success=True,
                        local_path=variant.local_path,
                        storage_path=result["storage_path"],
                        cdn_url=result["cdn_url"],
                        file_size_bytes=result["file_size_bytes"],
                        content_type=result["content_type"],
                        uploaded_at=datetime.utcnow(),
                        propagation_verified=verification.get("propagated", False)
                    )

                    cdn_urls[variant.suffix or "default"] = result["cdn_url"]
                else:
                    upload_result = CDNUploadResult(
                        success=False,
                        local_path=variant.local_path,
                        storage_path="",
                        cdn_url="",
                        file_size_bytes=0,
                        content_type="",
                        error_message=result.get("error")
                    )

                upload_results.append(upload_result.dict())

            end_time = datetime.utcnow()
            total_time_ms = int((end_time - start_time).total_seconds() * 1000)

            # Determine primary URL (default/no suffix)
            primary_url = cdn_urls.get("default", cdn_urls.get("", list(cdn_urls.values())[0] if cdn_urls else ""))

            return {
                "success": all(r["success"] for r in upload_results),
                "upload_results": upload_results,
                "cdn_urls": cdn_urls,
                "primary_cdn_url": primary_url,
                "total_uploaded": len([r for r in upload_results if r["success"]]),
                "total_size_kb": sum(r["file_size_bytes"] for r in upload_results if r["success"]) / 1024,
                "upload_time_ms": total_time_ms
            }

        except Exception as e:
            logger.error(f"CDN upload error: {e}")
            return {
                "success": False,
                "error": str(e),
                "upload_results": upload_results
            }

    def upload_batch(
        self,
        image_sets: List[ResponsiveImageSet],
        path_type: str = "articles"
    ) -> Dict[str, Any]:
        """
        Upload multiple image sets to CDN.

        Args:
            image_sets: List of ResponsiveImageSet objects
            path_type: CDN path type

        Returns:
            Batch upload results
        """
        start_time = datetime.utcnow()
        results = []
        all_urls = []
        total_size_kb = 0

        for i, image_set in enumerate(image_sets):
            logger.info(f"Uploading image set {i + 1}/{len(image_sets)}: {image_set.file_name}")

            result = self.upload_image_set(
                image_set=image_set,
                path_type=path_type
            )

            results.append(result)

            if result.get("success"):
                all_urls.extend(result.get("cdn_urls", {}).values())
                total_size_kb += result.get("total_size_kb", 0)

        end_time = datetime.utcnow()
        total_time_ms = int((end_time - start_time).total_seconds() * 1000)

        return {
            "success": all(r.get("success") for r in results),
            "results": results,
            "total_sets": len(image_sets),
            "all_cdn_urls": all_urls,
            "total_size_kb": round(total_size_kb, 2),
            "total_time_ms": total_time_ms
        }

    def insert_images_in_markdown(
        self,
        markdown_content: str,
        image_results: List[ImageGenerationResult],
        article_title: str
    ) -> Dict[str, Any]:
        """
        Insert generated images into article markdown.

        Args:
            markdown_content: Original article markdown
            image_results: List of ImageGenerationResult with CDN URLs
            article_title: Article title for context

        Returns:
            Updated markdown content
        """
        try:
            lines = markdown_content.split('\n')
            insertions = []

            # Separate images by type
            hero_image = None
            section_images = []
            og_image = None

            for result in image_results:
                if not result.success or not result.primary_cdn_url:
                    continue

                img_type = result.image_type if isinstance(result.image_type, str) else result.image_type.value

                if img_type == "hero_image":
                    hero_image = result
                elif img_type == "section_image":
                    section_images.append(result)
                elif img_type == "og_card":
                    og_image = result

            # Find insertion points
            frontmatter_end = -1
            first_heading_line = -1

            in_frontmatter = False
            for i, line in enumerate(lines):
                if line.strip() == '---':
                    if not in_frontmatter:
                        in_frontmatter = True
                    else:
                        frontmatter_end = i
                        in_frontmatter = False
                elif line.strip().startswith('#') and first_heading_line == -1:
                    first_heading_line = i

            # Insert hero image after frontmatter or at top
            if hero_image:
                insert_line = frontmatter_end + 1 if frontmatter_end > -1 else 0

                hero_markdown = self._generate_image_markdown(
                    url=hero_image.primary_cdn_url,
                    alt=hero_image.alt_text or f"Featured image for {article_title}",
                    responsive_urls=hero_image.responsive_urls,
                    css_class="hero-image"
                )

                insertions.append((insert_line, hero_markdown))

            # Find H2 headings for section images
            h2_lines = []
            for i, line in enumerate(lines):
                if line.strip().startswith('## '):
                    h2_lines.append(i)

            # Insert section images after H2 headings
            if section_images and h2_lines:
                # Distribute evenly
                step = max(1, len(h2_lines) // len(section_images))
                selected_h2s = h2_lines[::step][:len(section_images)]

                for img, h2_line in zip(section_images, selected_h2s):
                    section_markdown = self._generate_image_markdown(
                        url=img.primary_cdn_url,
                        alt=img.alt_text or "Section illustration",
                        responsive_urls=img.responsive_urls,
                        css_class="section-image",
                        lazy=True
                    )

                    # Insert after the heading line
                    insertions.append((h2_line + 1, section_markdown))

            # Apply insertions (reverse order to maintain line numbers)
            insertions.sort(key=lambda x: x[0], reverse=True)

            for line_num, content in insertions:
                lines.insert(line_num, content)
                lines.insert(line_num, "")  # Add blank line before

            updated_markdown = '\n'.join(lines)

            # Get OG image URL for metadata
            og_url = og_image.primary_cdn_url if og_image else (hero_image.primary_cdn_url if hero_image else None)

            return {
                "success": True,
                "markdown": updated_markdown,
                "images_inserted": len(insertions),
                "og_image_url": og_url,
                "hero_image_url": hero_image.primary_cdn_url if hero_image else None
            }

        except Exception as e:
            logger.error(f"Markdown insertion error: {e}")
            return {
                "success": False,
                "error": str(e),
                "markdown": markdown_content
            }

    def _generate_image_markdown(
        self,
        url: str,
        alt: str,
        responsive_urls: Optional[Dict[str, str]] = None,
        css_class: Optional[str] = None,
        lazy: bool = False
    ) -> str:
        """
        Generate markdown/HTML for an image with optional responsive srcset.

        Args:
            url: Primary image URL
            alt: Alt text
            responsive_urls: Dict of size suffix -> URL for srcset
            css_class: Optional CSS class
            lazy: Whether to add lazy loading

        Returns:
            Image markdown/HTML string
        """
        # If we have responsive URLs, generate HTML with srcset
        if responsive_urls and len(responsive_urls) > 1:
            srcset_parts = []
            for suffix, variant_url in responsive_urls.items():
                # Extract width from suffix (e.g., "-md" -> estimated width)
                width_map = {"": "1200w", "-md": "800w", "-sm": "480w", "-2x": "2400w"}
                width = width_map.get(suffix, "1200w")
                srcset_parts.append(f"{variant_url} {width}")

            srcset = ", ".join(srcset_parts)
            sizes = "(max-width: 480px) 100vw, (max-width: 800px) 100vw, 1200px"

            class_attr = f' class="{css_class}"' if css_class else ''
            loading_attr = ' loading="lazy"' if lazy else ''

            return f'<img src="{url}" srcset="{srcset}" sizes="{sizes}" alt="{alt}"{class_attr}{loading_attr} />'

        # Simple markdown image
        return f'![{alt}]({url})'

    def purge_urls(self, urls: List[str]) -> Dict[str, Any]:
        """
        Purge CDN cache for multiple URLs.

        Args:
            urls: List of CDN URLs to purge

        Returns:
            Purge results
        """
        results = []
        for url in urls:
            result = purge_cdn_cache(url)
            results.append({
                "url": url,
                **result
            })

        return {
            "success": all(r.get("success") for r in results),
            "results": results,
            "purged_count": sum(1 for r in results if r.get("success"))
        }
