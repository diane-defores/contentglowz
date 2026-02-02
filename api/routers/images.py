"""Image Robot API endpoints

Exposes the Image Robot Crew functionality via REST API for:
- Generating images for articles
- Uploading single images with optimization
- Checking Bunny Optimizer status
- Viewing generation history

IMPORTANT: Uses lazy imports for heavy dependencies.
"""

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import time
import json
import logging
from pathlib import Path
from typing import TYPE_CHECKING

from api.models.images import (
    GenerateImagesRequest,
    GenerateImagesResponse,
    GeneratedImageResponse,
    UploadImageRequest,
    UploadImageResponse,
    VerifyOptimizerRequest,
    OptimizerStatusResponse,
    ImageRobotHistoryResponse,
    ImageRobotHistoryItem,
)
from api.dependencies import get_image_robot_crew

# Type hint only - not loaded at runtime
if TYPE_CHECKING:
    from agents.images.image_crew import ImageRobotCrew

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/images",
    tags=["Image Robot"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/generate",
    response_model=GenerateImagesResponse,
    summary="Generate images for article",
    description="""
    Generate optimized images for a blog article using the Image Robot Crew.

    **What it does:**
    - Analyzes article content to determine visual strategy
    - Generates images via Robolly API
    - Uploads to Bunny CDN with optional Optimizer URLs
    - Returns markdown with images inserted

    **Strategy types:**
    - `minimal`: Hero image only (fastest)
    - `standard`: Hero + OG card (default)
    - `hero+sections`: Hero + section images
    - `rich`: All image types including thumbnails

    **Returns:**
    - Generated image URLs with responsive variants
    - Updated markdown with images inserted
    - OG image URL for social sharing
    - Processing statistics
    """
)
async def generate_images(
    request: GenerateImagesRequest,
    crew: "ImageRobotCrew" = Depends(get_image_robot_crew)
) -> GenerateImagesResponse:
    """Generate images for an article via Image Robot Crew"""
    start_time = time.time()

    try:
        logger.info(f"Generating images for article: {request.article_title}")

        # Call the Image Robot Crew
        result = crew.process(
            article_content=request.article_content,
            article_title=request.article_title,
            article_slug=request.article_slug,
            strategy_type=request.strategy_type,
            style_guide=request.style_guide,
            generate_responsive=request.generate_responsive,
            path_type=request.path_type
        )

        # Convert to response format
        images = []
        for img_result in result.images:
            images.append(GeneratedImageResponse(
                success=img_result.success,
                image_type=img_result.image_type,
                primary_url=img_result.primary_cdn_url,
                responsive_urls=img_result.responsive_urls,
                alt_text=img_result.alt_text,
                file_name=img_result.file_name,
                file_size_kb=img_result.generated.file_size_kb if img_result.generated else None,
                error=img_result.errors[0] if img_result.errors else None
            ))

        processing_time_ms = int((time.time() - start_time) * 1000)

        return GenerateImagesResponse(
            success=result.successful_images > 0,
            total_images=result.total_images,
            successful_images=result.successful_images,
            failed_images=result.failed_images,
            images=images,
            markdown_with_images=result.markdown_with_images,
            og_image_url=result.og_image_url,
            total_cdn_size_kb=result.total_cdn_size_kb,
            processing_time_ms=processing_time_ms,
            strategy_used=result.strategy.strategy_type
        )

    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Image generation failed: {str(e)}"
        )


@router.post(
    "/upload",
    response_model=UploadImageResponse,
    summary="Upload single image to CDN",
    description="""
    Upload a single image to Bunny CDN with optimization.

    **What it does:**
    - Downloads image from source URL
    - Uploads to Bunny CDN storage
    - Generates Optimizer URLs for responsive variants

    **Returns:**
    - CDN URL of uploaded image
    - Optimizer URL with transformation params
    - Responsive variant URLs
    """
)
async def upload_image(
    request: UploadImageRequest,
    crew: "ImageRobotCrew" = Depends(get_image_robot_crew)
) -> UploadImageResponse:
    """Upload a single image with optimization"""
    try:
        logger.info(f"Uploading image: {request.file_name}")

        # Use CDN Manager directly for single uploads
        cdn_manager = crew.cdn_manager

        result = cdn_manager.upload_with_optimizer(
            source_url=str(request.source_url),
            file_name=request.file_name,
            alt_text=request.alt_text,
            image_type=request.image_type,
            path_type=request.path_type
        )

        if not result.get("success"):
            return UploadImageResponse(
                success=False,
                error=result.get("error", "Upload failed")
            )

        return UploadImageResponse(
            success=True,
            cdn_url=result.get("cdn_url"),
            optimizer_url=result.get("optimizer_url"),
            responsive_urls=result.get("responsive_urls", {}),
            file_size_kb=result.get("file_size_kb"),
            content_type=result.get("content_type"),
            storage_path=result.get("storage_path")
        )

    except Exception as e:
        logger.error(f"Image upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Image upload failed: {str(e)}"
        )


@router.get(
    "/optimizer/status",
    response_model=OptimizerStatusResponse,
    summary="Check Bunny Optimizer status",
    description="""
    Check the status of Bunny CDN Optimizer.

    **What it checks:**
    - Whether optimizer is enabled in config
    - CDN hostname configuration
    - Optionally verifies transformation works

    **Returns:**
    - Enabled status
    - Hostname and configuration
    - Verification result if test URL provided
    """
)
async def get_optimizer_status(
    test_url: str = None,
    crew: "ImageRobotCrew" = Depends(get_image_robot_crew)
) -> OptimizerStatusResponse:
    """Check Bunny Optimizer configuration and status"""
    try:
        from agents.images.config.image_config import BUNNY_CONFIG

        optimizer_config = BUNNY_CONFIG.get("optimizer", {})
        enabled = optimizer_config.get("enabled", False)
        hostname = BUNNY_CONFIG.get("cdn_hostname", "")

        # Base response
        response = OptimizerStatusResponse(
            enabled=enabled,
            config_enabled=enabled,
            hostname=hostname if hostname else None,
            message="Bunny Optimizer is " + ("enabled" if enabled else "disabled"),
            supported_formats=optimizer_config.get("formats", ["webp", "avif", "jpeg", "png"]),
            default_quality=optimizer_config.get("default_quality", 85)
        )

        # Optionally verify with a test URL
        if test_url and enabled and hostname:
            try:
                cdn_manager = crew.cdn_manager
                transformed = cdn_manager.build_optimizer_url(
                    base_url=test_url,
                    width=800,
                    quality=85,
                    format="webp"
                )
                response.verified = True
                response.test_url = test_url
                response.transformed_url = transformed
                response.message = "Bunny Optimizer is enabled and verified"
            except Exception as e:
                response.verified = False
                response.message = f"Bunny Optimizer enabled but verification failed: {e}"

        return response

    except Exception as e:
        logger.error(f"Optimizer status check failed: {e}")
        return OptimizerStatusResponse(
            enabled=False,
            config_enabled=False,
            message=f"Failed to check optimizer status: {str(e)}"
        )


@router.get(
    "/history",
    response_model=ImageRobotHistoryResponse,
    summary="Get generation history",
    description="""
    Get recent image generation history.

    **Returns:**
    - List of recent generation jobs
    - Statistics for each job
    """
)
async def get_generation_history(
    limit: int = 20,
    crew: "ImageRobotCrew" = Depends(get_image_robot_crew)
) -> ImageRobotHistoryResponse:
    """Get recent image generation history"""
    try:
        history_file = Path(crew.data_dir) / "workflow_history.json"

        if not history_file.exists():
            return ImageRobotHistoryResponse(items=[], total_count=0)

        with open(history_file, 'r') as f:
            history = json.load(f)

        # Get most recent items
        items = [
            ImageRobotHistoryItem(**item)
            for item in history[-limit:]
        ]
        items.reverse()  # Most recent first

        return ImageRobotHistoryResponse(
            items=items,
            total_count=len(history)
        )

    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        return ImageRobotHistoryResponse(items=[], total_count=0)


@router.post(
    "/quick-generate",
    response_model=GenerateImagesResponse,
    summary="Quick generate hero image only",
    description="""
    Fast image generation with hero image only.

    This is a convenience endpoint for quick generation
    without responsive variants. Good for previews.
    """
)
async def quick_generate_images(
    request: GenerateImagesRequest,
    crew: "ImageRobotCrew" = Depends(get_image_robot_crew)
) -> GenerateImagesResponse:
    """Quick image generation (hero only, no responsive)"""
    start_time = time.time()

    try:
        logger.info(f"Quick generating image for: {request.article_title}")

        result = crew.quick_process(
            article_content=request.article_content,
            article_title=request.article_title,
            article_slug=request.article_slug,
            hero_only=True
        )

        images = []
        for img_result in result.images:
            images.append(GeneratedImageResponse(
                success=img_result.success,
                image_type=img_result.image_type,
                primary_url=img_result.primary_cdn_url,
                responsive_urls=img_result.responsive_urls,
                alt_text=img_result.alt_text,
                file_name=img_result.file_name,
                error=img_result.errors[0] if img_result.errors else None
            ))

        processing_time_ms = int((time.time() - start_time) * 1000)

        return GenerateImagesResponse(
            success=result.successful_images > 0,
            total_images=result.total_images,
            successful_images=result.successful_images,
            failed_images=result.failed_images,
            images=images,
            markdown_with_images=result.markdown_with_images,
            og_image_url=result.og_image_url,
            total_cdn_size_kb=result.total_cdn_size_kb,
            processing_time_ms=processing_time_ms,
            strategy_used="minimal"
        )

    except Exception as e:
        logger.error(f"Quick image generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Quick image generation failed: {str(e)}"
        )
