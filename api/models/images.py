"""Pydantic models for Image Robot API endpoints"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime


# ─────────────────────────────────────────────────
# Request Models
# ─────────────────────────────────────────────────

class GenerateImagesRequest(BaseModel):
    """Request to generate images for an article"""
    article_content: str = Field(
        ...,
        min_length=100,
        description="Markdown content of the article",
        examples=["# My Article\n\nThis is the content..."]
    )
    article_title: str = Field(
        ...,
        min_length=3,
        max_length=200,
        description="Title of the article",
        examples=["Getting Started with AI Agents"]
    )
    article_slug: str = Field(
        ...,
        min_length=3,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description="URL slug for the article",
        examples=["getting-started-ai-agents"]
    )
    strategy_type: Literal["minimal", "standard", "hero+sections", "rich"] = Field(
        default="standard",
        description="Image strategy type: minimal (hero only), standard (hero + OG), hero+sections (hero + section images), rich (all types)"
    )
    style_guide: str = Field(
        default="brand_primary",
        description="Style guide to use for branding consistency"
    )
    generate_responsive: bool = Field(
        default=True,
        description="Whether to generate responsive image variants"
    )
    path_type: Literal["articles", "newsletter", "social"] = Field(
        default="articles",
        description="CDN path type for organizing images"
    )


class UploadImageRequest(BaseModel):
    """Request to upload a single image to CDN"""
    source_url: HttpUrl = Field(
        ...,
        description="URL of the source image to upload"
    )
    file_name: str = Field(
        ...,
        min_length=3,
        max_length=200,
        description="SEO-friendly filename for the image"
    )
    alt_text: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Alt text for accessibility and SEO"
    )
    image_type: Literal["hero", "section", "thumbnail", "og"] = Field(
        default="hero",
        description="Type of image being uploaded"
    )
    path_type: Literal["articles", "newsletter", "social"] = Field(
        default="articles",
        description="CDN path type for organizing images"
    )


class VerifyOptimizerRequest(BaseModel):
    """Request to verify Bunny Optimizer status"""
    test_url: Optional[str] = Field(
        default=None,
        description="Optional URL to test optimizer transformation"
    )


# ─────────────────────────────────────────────────
# Response Models
# ─────────────────────────────────────────────────

class GeneratedImageResponse(BaseModel):
    """Response for a single generated image"""
    success: bool = Field(..., description="Whether image generation succeeded")
    image_type: str = Field(..., description="Type of image (hero, section, og, etc.)")
    primary_url: Optional[str] = Field(None, description="Primary CDN URL")
    responsive_urls: Dict[str, str] = Field(
        default_factory=dict,
        description="Responsive variant URLs keyed by width"
    )
    alt_text: str = Field(default="", description="Generated alt text")
    file_name: str = Field(default="", description="SEO-friendly filename")
    file_size_kb: Optional[float] = Field(None, description="File size in KB")
    error: Optional[str] = Field(None, description="Error message if failed")


class GenerateImagesResponse(BaseModel):
    """Response from image generation endpoint"""
    success: bool = Field(..., description="Overall success status")
    total_images: int = Field(default=0, description="Total images attempted")
    successful_images: int = Field(default=0, description="Successfully generated images")
    failed_images: int = Field(default=0, description="Failed image generations")
    images: List[GeneratedImageResponse] = Field(
        default_factory=list,
        description="Individual image results"
    )
    markdown_with_images: str = Field(
        default="",
        description="Article markdown with images inserted"
    )
    og_image_url: Optional[str] = Field(
        None,
        description="OG image URL for social sharing"
    )
    total_cdn_size_kb: float = Field(
        default=0,
        description="Total CDN storage used in KB"
    )
    processing_time_ms: int = Field(
        default=0,
        description="Total processing time in milliseconds"
    )
    strategy_used: str = Field(
        default="standard",
        description="Strategy type that was used"
    )


class UploadImageResponse(BaseModel):
    """Response from single image upload"""
    success: bool = Field(..., description="Whether upload succeeded")
    cdn_url: Optional[str] = Field(None, description="CDN URL of uploaded image")
    optimizer_url: Optional[str] = Field(
        None,
        description="Bunny Optimizer URL with transformation params"
    )
    responsive_urls: Dict[str, str] = Field(
        default_factory=dict,
        description="Responsive variant URLs"
    )
    file_size_kb: Optional[float] = Field(None, description="File size in KB")
    content_type: Optional[str] = Field(None, description="MIME content type")
    storage_path: Optional[str] = Field(None, description="Path in CDN storage")
    error: Optional[str] = Field(None, description="Error message if failed")


class OptimizerStatusResponse(BaseModel):
    """Response from optimizer status check"""
    enabled: bool = Field(..., description="Whether optimizer is enabled in config")
    config_enabled: bool = Field(
        ...,
        description="Whether optimizer is enabled in Bunny dashboard"
    )
    verified: Optional[bool] = Field(
        None,
        description="Whether optimizer transformation was verified"
    )
    hostname: Optional[str] = Field(None, description="CDN hostname")
    test_url: Optional[str] = Field(
        None,
        description="Test URL used for verification"
    )
    transformed_url: Optional[str] = Field(
        None,
        description="Transformed URL from test"
    )
    message: str = Field(..., description="Human-readable status message")
    supported_formats: List[str] = Field(
        default_factory=lambda: ["webp", "avif", "jpeg", "png"],
        description="Supported output formats"
    )
    default_quality: int = Field(default=85, description="Default quality setting")


class ImageRobotHistoryItem(BaseModel):
    """Single item in image generation history"""
    workflow_id: str
    timestamp: str
    article_title: str
    article_slug: str
    total_images: int
    successful_images: int
    failed_images: int
    processing_time_ms: int
    cdn_urls_count: int
    total_cdn_size_kb: float


class ImageRobotHistoryResponse(BaseModel):
    """Response containing generation history"""
    items: List[ImageRobotHistoryItem] = Field(
        default_factory=list,
        description="Recent generation history"
    )
    total_count: int = Field(default=0, description="Total history items")
