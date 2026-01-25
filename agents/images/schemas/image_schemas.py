"""
Image Robot Schemas
Pydantic models for image generation, optimization, and CDN management
"""
from pydantic import BaseModel, Field, HttpUrl, validator
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


class ImageType(str, Enum):
    """Types of images that can be generated"""
    HERO = "hero_image"
    SECTION = "section_image"
    OG_CARD = "og_card"
    THUMBNAIL = "thumbnail"


class ImageFormat(str, Enum):
    """Supported image formats"""
    JPG = "jpg"
    JPEG = "jpeg"
    PNG = "png"
    WEBP = "webp"
    AVIF = "avif"


class ImageBrief(BaseModel):
    """Brief for a single image to be generated"""
    image_type: ImageType = Field(..., description="Type of image to generate")
    title_text: str = Field(..., description="Main title text for overlay")
    subtitle_text: Optional[str] = Field(None, description="Optional subtitle")
    template_id: Optional[str] = Field(None, description="Robolly template ID to use")
    placement_hint: Optional[str] = Field(None, description="Where in article to place")
    context_keywords: List[str] = Field(default_factory=list, description="Keywords for context")

    class Config:
        use_enum_values = True


class ImageStrategy(BaseModel):
    """Complete visual strategy for an article"""
    article_title: str = Field(..., description="Title of the article")
    article_slug: str = Field(..., description="URL slug for the article")
    article_topics: List[str] = Field(default_factory=list, description="Main topics")
    article_word_count: int = Field(default=0, description="Word count of article")

    strategy_type: str = Field(default="standard", description="Strategy type (minimal, standard, hero+sections, rich)")
    style_guide: str = Field(default="brand_primary", description="Style guide to use")

    num_images: int = Field(..., ge=1, le=10, description="Total number of images")
    image_briefs: List[ImageBrief] = Field(default_factory=list, description="Briefs for each image")

    generate_og_card: bool = Field(default=True, description="Whether to generate OG card")
    generate_responsive: bool = Field(default=True, description="Generate responsive variants")

    @validator('num_images')
    def validate_num_images(cls, v):
        if v < 1:
            raise ValueError('Must generate at least 1 image')
        if v > 10:
            raise ValueError('Cannot generate more than 10 images')
        return v

    @validator('image_briefs')
    def validate_briefs_match_count(cls, v, values):
        if 'num_images' in values and len(v) != values['num_images']:
            # Auto-adjust - this is a warning, not an error
            pass
        return v


class GeneratedImage(BaseModel):
    """A single generated image from Robolly"""
    image_type: ImageType = Field(..., description="Type of image")
    robolly_render_id: str = Field(..., description="Robolly render ID")
    original_url: str = Field(..., description="Original Robolly URL")

    title_text: str = Field(..., description="Title used in generation")
    template_id: str = Field(..., description="Template used")
    style_guide: str = Field(..., description="Style guide applied")

    dimensions: Dict[str, int] = Field(..., description="Width and height")
    format: ImageFormat = Field(..., description="Image format")
    file_size_bytes: Optional[int] = Field(None, description="File size in bytes")

    generated_at: datetime = Field(default_factory=datetime.utcnow)
    generation_time_ms: Optional[int] = Field(None, description="Time to generate in ms")

    @property
    def file_size_kb(self) -> float:
        if self.file_size_bytes:
            return self.file_size_bytes / 1024
        return 0

    class Config:
        use_enum_values = True


class OptimizedImage(BaseModel):
    """An optimized version of an image"""
    source_image_id: str = Field(..., description="ID of source GeneratedImage")

    format: ImageFormat = Field(..., description="Output format")
    width: int = Field(..., gt=0, description="Image width")
    height: int = Field(..., gt=0, description="Image height")
    quality: int = Field(..., ge=1, le=100, description="Compression quality")

    file_size_bytes: int = Field(..., description="File size in bytes")
    compression_ratio: float = Field(..., description="Compression ratio vs original")

    local_path: Optional[str] = Field(None, description="Local file path")
    file_hash: str = Field(..., description="MD5 hash of file")

    suffix: str = Field(default="", description="Size suffix (-sm, -md, -2x)")

    @property
    def file_size_kb(self) -> float:
        return self.file_size_bytes / 1024

    class Config:
        use_enum_values = True


class ResponsiveImageSet(BaseModel):
    """Complete set of responsive images for one source"""
    original: GeneratedImage = Field(..., description="Original generated image")
    variants: List[OptimizedImage] = Field(default_factory=list, description="Optimized variants")

    # HTML attributes
    srcset: str = Field(default="", description="HTML srcset attribute")
    sizes: str = Field(default="", description="HTML sizes attribute")

    # SEO
    alt_text: str = Field(..., description="SEO alt text")
    file_name: str = Field(..., description="SEO-friendly filename")

    # Placement
    placement_markdown: Optional[str] = Field(None, description="Markdown position marker")


class CDNUploadResult(BaseModel):
    """Result of uploading an image to CDN"""
    success: bool = Field(..., description="Upload success status")

    local_path: str = Field(..., description="Source local path")
    storage_path: str = Field(..., description="Path in CDN storage")
    cdn_url: str = Field(..., description="Final CDN URL")

    file_size_bytes: int = Field(..., description="Uploaded file size")
    content_type: str = Field(..., description="MIME content type")

    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    propagation_verified: bool = Field(default=False, description="CDN propagation verified")

    error_message: Optional[str] = Field(None, description="Error if upload failed")

    @property
    def file_size_kb(self) -> float:
        return self.file_size_bytes / 1024


class ImageGenerationResult(BaseModel):
    """Result of generating a single image through full pipeline"""
    success: bool = Field(..., description="Overall success status")
    image_type: ImageType = Field(..., description="Type of image")

    # Pipeline stages
    generated: Optional[GeneratedImage] = Field(None, description="Generation result")
    optimized: List[OptimizedImage] = Field(default_factory=list, description="Optimized versions")
    cdn_uploads: List[CDNUploadResult] = Field(default_factory=list, description="CDN upload results")

    # Final URLs
    primary_cdn_url: Optional[str] = Field(None, description="Primary CDN URL")
    responsive_urls: Dict[str, str] = Field(default_factory=dict, description="Responsive variant URLs")

    # SEO metadata
    alt_text: str = Field(default="", description="Generated alt text")
    file_name: str = Field(default="", description="SEO filename")

    # Timing
    total_time_ms: Optional[int] = Field(None, description="Total pipeline time")

    # Errors
    errors: List[str] = Field(default_factory=list, description="Errors encountered")

    class Config:
        use_enum_values = True


class ArticleWithImages(BaseModel):
    """Complete article with all images integrated"""
    # Article metadata
    article_title: str = Field(..., description="Article title")
    article_slug: str = Field(..., description="Article slug")
    original_content: str = Field(..., description="Original markdown content")

    # Enriched content
    markdown_with_images: str = Field(..., description="Markdown with images inserted")

    # Image results
    strategy: ImageStrategy = Field(..., description="Strategy used")
    images: List[ImageGenerationResult] = Field(default_factory=list, description="All generated images")

    # Aggregated metadata
    total_images: int = Field(default=0, description="Total images generated")
    successful_images: int = Field(default=0, description="Successfully uploaded images")
    failed_images: int = Field(default=0, description="Failed image generations")

    # SEO data
    image_metadata: Dict[str, Any] = Field(default_factory=dict, description="Schema.org metadata")
    og_image_url: Optional[str] = Field(None, description="OG image URL for social sharing")

    # CDN stats
    total_cdn_size_kb: float = Field(default=0, description="Total CDN storage used")
    cdn_urls: List[str] = Field(default_factory=list, description="All CDN URLs")

    # Processing stats
    processing_time_ms: Optional[int] = Field(None, description="Total processing time")
    processed_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('successful_images', always=True)
    def count_successful(cls, v, values):
        if 'images' in values:
            return sum(1 for img in values['images'] if img.success)
        return v

    @validator('failed_images', always=True)
    def count_failed(cls, v, values):
        if 'images' in values:
            return sum(1 for img in values['images'] if not img.success)
        return v


class ImageRobotReport(BaseModel):
    """Report for Image Robot operations"""
    report_id: str = Field(..., description="Unique report ID")
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    # Summary
    total_articles_processed: int = Field(default=0)
    total_images_generated: int = Field(default=0)
    total_images_uploaded: int = Field(default=0)

    # Performance
    average_generation_time_ms: float = Field(default=0)
    average_upload_time_ms: float = Field(default=0)
    total_cdn_storage_mb: float = Field(default=0)

    # Errors
    generation_errors: int = Field(default=0)
    upload_errors: int = Field(default=0)
    error_details: List[str] = Field(default_factory=list)

    # API usage
    robolly_api_calls: int = Field(default=0)
    bunny_api_calls: int = Field(default=0)
    estimated_cost_usd: float = Field(default=0)
