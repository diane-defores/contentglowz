import { tool } from "ai";
import { z } from "zod";
import { seoApi } from "@/lib/seo-api-client";

export const generateArticleImagesTool = tool({
	description:
		"Generate optimized images for a blog article. Creates hero images, OG cards, and section images based on the selected strategy. Returns CDN URLs with responsive variants via Bunny Optimizer.",
	inputSchema: z.object({
		articleContent: z
			.string()
			.describe("The full markdown content of the article"),
		articleTitle: z
			.string()
			.describe("The title of the article"),
		articleSlug: z
			.string()
			.describe("The URL slug for the article (e.g., 'getting-started-ai-agents')"),
		strategyType: z
			.enum(["minimal", "standard", "hero+sections", "rich"])
			.optional()
			.describe(
				"Image strategy: 'minimal' (hero only), 'standard' (hero + OG card), 'hero+sections' (hero + section images), 'rich' (all image types). Defaults to 'standard'.",
			),
	}),
	execute: async (input) => {
		try {
			const result = await seoApi.generateImages(
				input.articleContent,
				input.articleTitle,
				input.articleSlug,
				{
					strategyType: input.strategyType,
				},
			);

			// Format images for easy consumption
			const formattedImages = result.images.map((img) => ({
				type: img.image_type,
				url: img.primary_url,
				altText: img.alt_text,
				responsiveUrls: img.responsive_urls,
				success: img.success,
				error: img.error,
			}));

			return {
				success: result.success,
				totalImages: result.total_images,
				successfulImages: result.successful_images,
				failedImages: result.failed_images,
				images: formattedImages,
				ogImageUrl: result.og_image_url,
				markdownWithImages: result.markdown_with_images,
				processingTimeSeconds: result.processing_time_ms / 1000,
				strategyUsed: result.strategy_used,
				cdnSizeKb: result.total_cdn_size_kb,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to generate images",
			};
		}
	},
});

export const uploadImageTool = tool({
	description:
		"Upload a single image to Bunny CDN with automatic optimization. Use this to upload custom images or images from external URLs.",
	inputSchema: z.object({
		sourceUrl: z
			.string()
			.url()
			.describe("The URL of the image to upload"),
		fileName: z
			.string()
			.describe("SEO-friendly filename for the image (without extension)"),
		altText: z
			.string()
			.describe("Descriptive alt text for accessibility and SEO"),
		imageType: z
			.enum(["hero", "section", "thumbnail", "og"])
			.optional()
			.describe("Type of image: 'hero', 'section', 'thumbnail', or 'og'. Defaults to 'hero'."),
	}),
	execute: async (input) => {
		try {
			const result = await seoApi.uploadImage(
				input.sourceUrl,
				input.fileName,
				input.altText,
				{
					imageType: input.imageType,
				},
			);

			return {
				success: result.success,
				cdnUrl: result.cdn_url,
				optimizerUrl: result.optimizer_url,
				responsiveUrls: result.responsive_urls,
				fileSizeKb: result.file_size_kb,
				contentType: result.content_type,
				error: result.error,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to upload image",
			};
		}
	},
});

export const checkOptimizerStatusTool = tool({
	description:
		"Check the status of the Bunny CDN Optimizer. Use this to verify image optimization is working before generating images.",
	inputSchema: z.object({
		testUrl: z
			.string()
			.url()
			.optional()
			.describe("Optional URL to test optimizer transformation"),
	}),
	execute: async (input) => {
		try {
			const result = await seoApi.getOptimizerStatus(input.testUrl);

			return {
				enabled: result.enabled,
				verified: result.verified,
				hostname: result.hostname,
				message: result.message,
				supportedFormats: result.supported_formats,
				defaultQuality: result.default_quality,
				testUrl: result.test_url,
				transformedUrl: result.transformed_url,
			};
		} catch (error) {
			return {
				enabled: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to check optimizer status",
			};
		}
	},
});
