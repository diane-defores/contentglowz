"use client";

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileImage,
	Layers,
	Loader2,
	RefreshCw,
	Upload,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useProjectsContext } from "@/contexts/projects-context";

interface OptimizerStatus {
	enabled: boolean;
	config_enabled: boolean;
	verified?: boolean;
	hostname?: string;
	message: string;
	supported_formats: string[];
	default_quality: number;
}

interface HistoryItem {
	workflow_id: string;
	timestamp: string;
	article_title: string;
	article_slug: string;
	total_images: number;
	successful_images: number;
	failed_images: number;
	processing_time_ms: number;
	cdn_urls_count: number;
	total_cdn_size_kb: number;
}

interface GenerateResult {
	success: boolean;
	total_images: number;
	successful_images: number;
	failed_images: number;
	markdown_with_images: string;
	og_image_url?: string;
	processing_time_ms: number;
}

type ProfileImageType =
	| "hero_image"
	| "section_image"
	| "og_card"
	| "thumbnail";
type ProfilePathType = "articles" | "newsletter" | "social" | "thumbnails";
type ImageProvider = "robolly" | "openai";

interface ImageProfile {
	profile_id: string;
	name: string;
	description: string;
	image_type: ProfileImageType;
	style_guide: string;
	path_type: ProfilePathType;
	image_provider: ImageProvider;
	template_id: string | null;
	default_alt_text: string | null;
	base_prompt: string | null;
	tags: string[];
	is_system: boolean;
}

interface ProfileGenerationResult {
	success: boolean;
	primary_url: string | null;
	cdn_url: string | null;
	render_id: string | null;
	file_name: string | null;
	alt_text: string | null;
	provider_used: string | null;
	prompt_used: string | null;
	error: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ImageRobotPanel() {
	const { selectedProject } = useProjectsContext();
	const [activeTab, setActiveTab] = useState("generate");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Optimizer status
	const [optimizerStatus, setOptimizerStatus] =
		useState<OptimizerStatus | null>(null);
	const [statusLoading, setStatusLoading] = useState(false);

	// Generate form state
	const [articleContent, setArticleContent] = useState("");
	const [articleTitle, setArticleTitle] = useState("");
	const [articleSlug, setArticleSlug] = useState("");
	const [strategyType, setStrategyType] = useState<
		"minimal" | "standard" | "hero+sections" | "rich"
	>("standard");
	const [generateResult, setGenerateResult] = useState<GenerateResult | null>(
		null,
	);

	// History
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [historyLoading, setHistoryLoading] = useState(false);

	// Profiles
	const [profiles, setProfiles] = useState<ImageProfile[]>([]);
	const [profilesLoading, setProfilesLoading] = useState(false);
	const [profileActionLoading, setProfileActionLoading] = useState(false);
	const [selectedProfileId, setSelectedProfileId] = useState("");
	const [profileTitleText, setProfileTitleText] = useState("");
	const [profileSubtitleText, setProfileSubtitleText] = useState("");
	const [profileAltText, setProfileAltText] = useState("");
	const [profileCustomPrompt, setProfileCustomPrompt] = useState("");
	const [profileProviderOverride, setProfileProviderOverride] = useState<
		"default" | ImageProvider
	>("default");
	const [profileGenerationResult, setProfileGenerationResult] =
		useState<ProfileGenerationResult | null>(null);

	// Custom profile form
	const [customProfileId, setCustomProfileId] = useState("");
	const [customProfileName, setCustomProfileName] = useState("");
	const [customProfileDescription, setCustomProfileDescription] = useState("");
	const [customProfileImageType, setCustomProfileImageType] =
		useState<ProfileImageType>("hero_image");
	const [customProfileStyleGuide, setCustomProfileStyleGuide] =
		useState("brand_primary");
	const [customProfilePathType, setCustomProfilePathType] =
		useState<ProfilePathType>("articles");
	const [customProfileTemplateId, setCustomProfileTemplateId] = useState("");
	const [customProfileAltText, setCustomProfileAltText] = useState("");
	const [customProfileTags, setCustomProfileTags] = useState("");
	const [customProfileProvider, setCustomProfileProvider] =
		useState<ImageProvider>("robolly");
	const [customProfileBasePrompt, setCustomProfileBasePrompt] = useState("");

	// Fetch optimizer status
	const fetchOptimizerStatus = useCallback(async () => {
		setStatusLoading(true);
		setError(null);
		try {
			const response = await fetch(`${API_BASE}/api/images/optimizer/status`);
			if (!response.ok) throw new Error("Failed to fetch optimizer status");
			const data = await response.json();
			setOptimizerStatus(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch status");
		} finally {
			setStatusLoading(false);
		}
	}, []);

	// Fetch history
	const fetchHistory = useCallback(async () => {
		if (!selectedProject?.id) {
			setHistory([]);
			return;
		}
		setHistoryLoading(true);
		try {
			const params = new URLSearchParams({
				limit: "10",
				project_id: selectedProject.id,
			});
			const response = await fetch(
				`${API_BASE}/api/images/history?${params.toString()}`,
			);
			if (!response.ok) throw new Error("Failed to fetch history");
			const data = await response.json();
			setHistory(data.items || []);
		} catch (err) {
			console.error("Failed to fetch history:", err);
		} finally {
			setHistoryLoading(false);
		}
	}, [selectedProject?.id]);

	// Fetch profiles
	const fetchProfiles = useCallback(async () => {
		if (!selectedProject?.id) {
			setProfiles([]);
			setSelectedProfileId("");
			return;
		}
		setProfilesLoading(true);
		try {
			const response = await fetch(
				`${API_BASE}/api/images/profiles?project_id=${encodeURIComponent(selectedProject.id)}`,
			);
			if (!response.ok) throw new Error("Failed to fetch profiles");
			const data = await response.json();
			const items = Array.isArray(data.items) ? data.items : [];
			setProfiles(items);
			setSelectedProfileId((current) => {
				if (current) return current;
				if (items.length > 0 && typeof items[0]?.profile_id === "string") {
					return items[0].profile_id;
				}
				return "";
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch profiles");
		} finally {
			setProfilesLoading(false);
		}
	}, [selectedProject?.id]);

	// Generate images
	const handleGenerate = async () => {
		if (!selectedProject?.id) {
			setError("Select a project before generating images");
			return;
		}
		if (!articleContent || !articleTitle || !articleSlug) {
			setError("Please fill in all required fields");
			return;
		}

		setLoading(true);
		setError(null);
		setGenerateResult(null);

		try {
			const response = await fetch(`${API_BASE}/api/images/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					project_id: selectedProject.id,
					article_content: articleContent,
					article_title: articleTitle,
					article_slug: articleSlug,
					strategy_type: strategyType,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.detail || "Failed to generate images");
			}

			const data = await response.json();
			setGenerateResult(data);
			fetchHistory(); // Refresh history after generation
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to generate images",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleGenerateFromProfile = async () => {
		if (!selectedProject?.id) {
			setError("Select a project before generating from profile");
			return;
		}
		if (!selectedProfileId || !profileTitleText) {
			setError("Select a profile and add title text");
			return;
		}

		setError(null);
		setProfileActionLoading(true);
		setProfileGenerationResult(null);

		try {
			const response = await fetch(
				`${API_BASE}/api/images/generate-from-profile`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						project_id: selectedProject.id,
						profile_id: selectedProfileId,
						title_text: profileTitleText,
						subtitle_text: profileSubtitleText || null,
						alt_text: profileAltText || null,
						custom_prompt: profileCustomPrompt || null,
						provider_override:
							profileProviderOverride === "default"
								? null
								: profileProviderOverride,
					}),
				},
			);

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.detail || "Failed to generate from profile");
			}

			setProfileGenerationResult({
				success: Boolean(data.success),
				primary_url: data.primary_url ?? null,
				cdn_url: data.cdn_url ?? null,
				render_id: data.render_id ?? null,
				file_name: data.file_name ?? null,
				alt_text: data.alt_text ?? null,
				provider_used: data.provider_used ?? null,
				prompt_used: data.prompt_used ?? null,
				error: data.error ?? null,
			});
			fetchHistory();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to generate from profile",
			);
		} finally {
			setProfileActionLoading(false);
		}
	};

	const handleSaveCustomProfile = async () => {
		if (!selectedProject?.id) {
			setError("Select a project before saving a profile");
			return;
		}
		if (!customProfileId || !customProfileName) {
			setError("Profile ID and name are required");
			return;
		}

		const normalizedProfileId = slugify(customProfileId);
		if (!normalizedProfileId) {
			setError("Profile ID is invalid");
			return;
		}

		setError(null);
		setProfileActionLoading(true);

		try {
			const response = await fetch(
				`${API_BASE}/api/images/profiles?project_id=${encodeURIComponent(selectedProject.id)}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						profile_id: normalizedProfileId,
						name: customProfileName,
						description: customProfileDescription,
						image_type: customProfileImageType,
						style_guide: customProfileStyleGuide,
						path_type: customProfilePathType,
						image_provider: customProfileProvider,
						template_id: customProfileTemplateId || null,
						default_alt_text: customProfileAltText || null,
						base_prompt: customProfileBasePrompt || null,
						tags: customProfileTags
							.split(",")
							.map((tag) => tag.trim())
							.filter((tag) => tag.length > 0),
					}),
				},
			);

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.detail || "Failed to save profile");
			}

			setCustomProfileId("");
			setCustomProfileName("");
			setCustomProfileDescription("");
			setCustomProfileTemplateId("");
			setCustomProfileAltText("");
			setCustomProfileTags("");
			setCustomProfileProvider("robolly");
			setCustomProfileBasePrompt("");
			await fetchProfiles();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save profile");
		} finally {
			setProfileActionLoading(false);
		}
	};

	const handleDeleteCustomProfile = async (profileId: string) => {
		if (!selectedProject?.id) {
			setError("Select a project before deleting a profile");
			return;
		}
		setError(null);
		setProfileActionLoading(true);
		try {
			const response = await fetch(
				`${API_BASE}/api/images/profiles/${encodeURIComponent(profileId)}?project_id=${encodeURIComponent(selectedProject.id)}`,
				{
					method: "DELETE",
				},
			);
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.detail || "Failed to delete profile");
			}
			if (selectedProfileId === profileId) {
				setSelectedProfileId("");
			}
			await fetchProfiles();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete profile");
		} finally {
			setProfileActionLoading(false);
		}
	};

	// Auto-generate slug from title
	const handleTitleChange = (title: string) => {
		setArticleTitle(title);
		if (!articleSlug || articleSlug === slugify(articleTitle)) {
			setArticleSlug(slugify(title));
		}
	};

	const slugify = (text: string) =>
		text
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.trim();

	// Initial fetch
	useEffect(() => {
		fetchOptimizerStatus();
		fetchHistory();
		fetchProfiles();
	}, [fetchOptimizerStatus, fetchHistory, fetchProfiles]);

	return (
		<div className="space-y-4">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="generate">
						<FileImage className="mr-2 h-4 w-4" />
						Generate
					</TabsTrigger>
					<TabsTrigger value="profiles">
						<Layers className="mr-2 h-4 w-4" />
						Profiles
					</TabsTrigger>
					<TabsTrigger value="upload">
						<Upload className="mr-2 h-4 w-4" />
						Upload
					</TabsTrigger>
					<TabsTrigger value="status">
						<Zap className="mr-2 h-4 w-4" />
						Status
					</TabsTrigger>
					<TabsTrigger value="history">
						<Clock className="mr-2 h-4 w-4" />
						History
					</TabsTrigger>
				</TabsList>

				{/* Generate Tab */}
				<TabsContent value="generate" className="space-y-4">
					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
							<AlertCircle className="mr-2 inline h-4 w-4" />
							{error}
						</div>
					)}

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="title">Article Title</Label>
							<Input
								id="title"
								placeholder="Getting Started with AI Agents"
								value={articleTitle}
								onChange={(e) => handleTitleChange(e.target.value)}
								disabled={loading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="slug">URL Slug</Label>
							<Input
								id="slug"
								placeholder="getting-started-ai-agents"
								value={articleSlug}
								onChange={(e) => setArticleSlug(e.target.value)}
								disabled={loading}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="content">Article Content (Markdown)</Label>
						<Textarea
							id="content"
							placeholder="# My Article\n\nPaste your article markdown here..."
							value={articleContent}
							onChange={(e) => setArticleContent(e.target.value)}
							disabled={loading}
							rows={8}
							className="font-mono text-sm"
						/>
					</div>

					<div className="flex items-end gap-4">
						<div className="space-y-2">
							<Label>Strategy</Label>
							<Select
								value={strategyType}
								onValueChange={(v) => setStrategyType(v as "minimal" | "standard" | "hero+sections" | "rich")}
								disabled={loading}
							>
								<SelectTrigger className="w-48">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="minimal">Minimal (Hero only)</SelectItem>
									<SelectItem value="standard">Standard (Hero + OG)</SelectItem>
									<SelectItem value="hero+sections">Hero + Sections</SelectItem>
									<SelectItem value="rich">Rich (All types)</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Button
							onClick={handleGenerate}
							disabled={loading || !articleContent || !selectedProject?.id}
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<FileImage className="mr-2 h-4 w-4" />
									Generate Images
								</>
							)}
						</Button>
					</div>

					{generateResult && (
						<Card className="p-4">
							<div className="flex items-center gap-2 mb-3">
								{generateResult.success ? (
									<CheckCircle2 className="h-5 w-5 text-green-500" />
								) : (
									<AlertCircle className="h-5 w-5 text-red-500" />
								)}
								<span className="font-medium">
									{generateResult.success
										? "Generation Complete"
										: "Generation Failed"}
								</span>
							</div>
							<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
								<div>
									<p className="text-muted-foreground">Total Images</p>
									<p className="font-medium">{generateResult.total_images}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Successful</p>
									<p className="font-medium text-green-600">
										{generateResult.successful_images}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Failed</p>
									<p className="font-medium text-red-600">
										{generateResult.failed_images}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Processing Time</p>
									<p className="font-medium">
										{(generateResult.processing_time_ms / 1000).toFixed(1)}s
									</p>
								</div>
							</div>
							{generateResult.og_image_url && (
								<div className="mt-3 pt-3 border-t">
									<p className="text-sm text-muted-foreground mb-1">OG Image</p>
									<a
										href={generateResult.og_image_url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-blue-600 hover:underline break-all"
									>
										{generateResult.og_image_url}
									</a>
								</div>
							)}
						</Card>
					)}
				</TabsContent>

				{/* Profiles Tab */}
				<TabsContent value="profiles" className="space-y-4">
					{!selectedProject?.id && (
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
							<AlertCircle className="mr-2 inline h-4 w-4" />
							Select a project first. Profiles are scoped per project.
						</div>
					)}
					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
							<AlertCircle className="mr-2 inline h-4 w-4" />
							{error}
						</div>
					)}

					<Card className="p-4 space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium">Generate From Profile</h4>
							<Button
								variant="outline"
								size="sm"
								onClick={fetchProfiles}
								disabled={profilesLoading || !selectedProject?.id}
							>
								{profilesLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<RefreshCw className="h-4 w-4" />
								)}
							</Button>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Profile</Label>
								<Select
									value={selectedProfileId || undefined}
									onValueChange={setSelectedProfileId}
									disabled={
										!selectedProject?.id ||
										profilesLoading ||
										profiles.length === 0 ||
										profileActionLoading
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select a profile" />
									</SelectTrigger>
									<SelectContent>
										{profiles.map((profile) => (
											<SelectItem
												key={profile.profile_id}
												value={profile.profile_id}
											>
												{profile.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Title Text</Label>
								<Input
									placeholder="Main overlay text"
									value={profileTitleText}
									onChange={(event) => setProfileTitleText(event.target.value)}
									disabled={profileActionLoading}
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Subtitle (optional)</Label>
								<Input
									placeholder="Secondary text"
									value={profileSubtitleText}
									onChange={(event) =>
										setProfileSubtitleText(event.target.value)
									}
									disabled={profileActionLoading}
								/>
							</div>
							<div className="space-y-2">
								<Label>Alt text (optional)</Label>
								<Input
									placeholder="Accessibility alt text"
									value={profileAltText}
									onChange={(event) => setProfileAltText(event.target.value)}
									disabled={profileActionLoading}
								/>
							</div>
							<div className="space-y-2">
								<Label>Provider Override (optional)</Label>
								<Select
									value={profileProviderOverride}
									onValueChange={(value) =>
										setProfileProviderOverride(
											value as "default" | ImageProvider,
										)
									}
									disabled={profileActionLoading}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="default">Profile default</SelectItem>
										<SelectItem value="robolly">Robolly</SelectItem>
										<SelectItem value="openai">OpenAI</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Custom AI Prompt (optional)</Label>
							<Textarea
								placeholder="Overrides profile base prompt for AI providers"
								value={profileCustomPrompt}
								onChange={(event) => setProfileCustomPrompt(event.target.value)}
								disabled={profileActionLoading}
								rows={3}
							/>
						</div>

						<Button
							onClick={handleGenerateFromProfile}
							disabled={
								!selectedProject?.id ||
								!selectedProfileId ||
								!profileTitleText ||
								profileActionLoading
							}
						>
							{profileActionLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<FileImage className="mr-2 h-4 w-4" />
									Generate One Image
								</>
							)}
						</Button>

						{profileGenerationResult && (
							<Card className="p-3">
								<div className="flex items-center gap-2">
									{profileGenerationResult.success ? (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									) : (
										<AlertCircle className="h-5 w-5 text-red-500" />
									)}
									<span className="text-sm font-medium">
										{profileGenerationResult.success
											? "Image generated"
											: "Generation failed"}
									</span>
								</div>
								{profileGenerationResult.primary_url && (
									<a
										href={profileGenerationResult.primary_url}
										target="_blank"
										rel="noopener noreferrer"
										className="mt-2 block break-all text-sm text-blue-600 hover:underline"
									>
										{profileGenerationResult.primary_url}
									</a>
								)}
								{profileGenerationResult.error && (
									<p className="mt-2 text-sm text-red-600">
										{profileGenerationResult.error}
									</p>
								)}
								{profileGenerationResult.provider_used && (
									<p className="mt-2 text-xs text-muted-foreground">
										Provider: {profileGenerationResult.provider_used}
									</p>
								)}
								{profileGenerationResult.prompt_used && (
									<p className="mt-1 text-xs text-muted-foreground">
										Prompt: {profileGenerationResult.prompt_used}
									</p>
								)}
							</Card>
						)}
					</Card>

					<Card className="p-4 space-y-4">
						<h4 className="font-medium">Create Or Update Custom Profile</h4>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Profile ID</Label>
								<Input
									placeholder="youtube-clips-bold"
									value={customProfileId}
									onChange={(event) => setCustomProfileId(event.target.value)}
									disabled={profileActionLoading}
								/>
							</div>
							<div className="space-y-2">
								<Label>Name</Label>
								<Input
									placeholder="YouTube Clips Bold"
									value={customProfileName}
									onChange={(event) => setCustomProfileName(event.target.value)}
									disabled={profileActionLoading}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Description</Label>
							<Input
								placeholder="Bold thumbnail style for short videos"
								value={customProfileDescription}
								onChange={(event) =>
									setCustomProfileDescription(event.target.value)
								}
								disabled={profileActionLoading}
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<Label>Image Type</Label>
								<Select
									value={customProfileImageType}
									onValueChange={(value) =>
										setCustomProfileImageType(value as ProfileImageType)
									}
									disabled={profileActionLoading}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="hero_image">Hero</SelectItem>
										<SelectItem value="section_image">Section</SelectItem>
										<SelectItem value="og_card">OG Card</SelectItem>
										<SelectItem value="thumbnail">Thumbnail</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Path Type</Label>
								<Select
									value={customProfilePathType}
									onValueChange={(value) =>
										setCustomProfilePathType(value as ProfilePathType)
									}
									disabled={profileActionLoading}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="articles">articles</SelectItem>
										<SelectItem value="newsletter">newsletter</SelectItem>
										<SelectItem value="social">social</SelectItem>
										<SelectItem value="thumbnails">thumbnails</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Style Guide</Label>
								<Input
									placeholder="brand_primary"
									value={customProfileStyleGuide}
									onChange={(event) =>
										setCustomProfileStyleGuide(event.target.value)
									}
									disabled={profileActionLoading}
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Image Provider</Label>
								<Select
									value={customProfileProvider}
									onValueChange={(value) =>
										setCustomProfileProvider(value as ImageProvider)
									}
									disabled={profileActionLoading}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="robolly">Robolly</SelectItem>
										<SelectItem value="openai">OpenAI</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Base AI Prompt (optional)</Label>
								<Input
									placeholder="Editorial, high contrast, modern composition..."
									value={customProfileBasePrompt}
									onChange={(event) =>
										setCustomProfileBasePrompt(event.target.value)
									}
									disabled={profileActionLoading}
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Template ID (optional)</Label>
								<Input
									placeholder="rbly_template_123"
									value={customProfileTemplateId}
									onChange={(event) =>
										setCustomProfileTemplateId(event.target.value)
									}
									disabled={profileActionLoading}
								/>
							</div>
							<div className="space-y-2">
								<Label>Default Alt Text (optional)</Label>
								<Input
									placeholder="YouTube thumbnail"
									value={customProfileAltText}
									onChange={(event) =>
										setCustomProfileAltText(event.target.value)
									}
									disabled={profileActionLoading}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Tags (comma separated)</Label>
							<Input
								placeholder="youtube, thumbnail, bold"
								value={customProfileTags}
								onChange={(event) => setCustomProfileTags(event.target.value)}
								disabled={profileActionLoading}
							/>
						</div>

						<Button
							onClick={handleSaveCustomProfile}
							disabled={profileActionLoading || !selectedProject?.id}
						>
							{profileActionLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Custom Profile"
							)}
						</Button>
					</Card>

					<Card className="p-4 space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="font-medium">Available Profiles</h4>
							<Badge variant="outline">{profiles.length}</Badge>
						</div>

						{profiles.length > 0 ? (
							<div className="space-y-2">
								{profiles.map((profile) => (
									<Card key={profile.profile_id} className="p-3">
										<div className="flex items-start justify-between gap-3">
											<div className="space-y-1">
												<p className="text-sm font-medium">{profile.name}</p>
												<p className="text-xs text-muted-foreground">
													{profile.profile_id}
												</p>
												<p className="text-xs text-muted-foreground">
													{profile.image_type} • {profile.style_guide} •{" "}
													{profile.path_type}
												</p>
												<p className="text-xs text-muted-foreground">
													Provider: {profile.image_provider}
												</p>
											</div>
											<div className="flex gap-2">
												<Badge
													variant={profile.is_system ? "secondary" : "outline"}
												>
													{profile.is_system ? "System" : "Custom"}
												</Badge>
												{!profile.is_system && (
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															handleDeleteCustomProfile(profile.profile_id)
														}
														disabled={
															profileActionLoading || !selectedProject?.id
														}
													>
														Delete
													</Button>
												)}
											</div>
										</div>
									</Card>
								))}
							</div>
						) : profilesLoading ? (
							<div className="flex items-center justify-center py-6">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								No profiles available
							</p>
						)}
					</Card>
				</TabsContent>

				{/* Upload Tab */}
				<TabsContent value="upload" className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Upload a single image to Bunny CDN with optimization.
					</p>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Source URL</Label>
							<Input
								placeholder="https://example.com/image.png"
								disabled={loading}
							/>
						</div>
						<div className="space-y-2">
							<Label>File Name</Label>
							<Input placeholder="my-optimized-image" disabled={loading} />
						</div>
					</div>
					<div className="space-y-2">
						<Label>Alt Text</Label>
						<Input
							placeholder="Descriptive alt text for accessibility"
							disabled={loading}
						/>
					</div>
					<Button disabled={loading}>
						<Upload className="mr-2 h-4 w-4" />
						Upload Image
					</Button>
				</TabsContent>

				{/* Status Tab */}
				<TabsContent value="status" className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">Bunny Optimizer Status</h4>
						<Button
							variant="outline"
							size="sm"
							onClick={fetchOptimizerStatus}
							disabled={statusLoading}
						>
							{statusLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<RefreshCw className="h-4 w-4" />
							)}
						</Button>
					</div>

					{optimizerStatus ? (
						<Card className="p-4 space-y-3">
							<div className="flex items-center gap-2">
								<Badge
									variant={optimizerStatus.enabled ? "default" : "secondary"}
								>
									{optimizerStatus.enabled ? "Enabled" : "Disabled"}
								</Badge>
								{optimizerStatus.verified && (
									<Badge
										variant="outline"
										className="text-green-600 border-green-200"
									>
										<CheckCircle2 className="mr-1 h-3 w-3" />
										Verified
									</Badge>
								)}
							</div>
							<p className="text-sm text-muted-foreground">
								{optimizerStatus.message}
							</p>
							{optimizerStatus.hostname && (
								<div className="text-sm">
									<span className="text-muted-foreground">Hostname: </span>
									<code className="bg-muted px-1 rounded">
										{optimizerStatus.hostname}
									</code>
								</div>
							)}
							<div className="text-sm">
								<span className="text-muted-foreground">
									Supported formats:{" "}
								</span>
								{optimizerStatus.supported_formats.join(", ")}
							</div>
							<div className="text-sm">
								<span className="text-muted-foreground">Default quality: </span>
								{optimizerStatus.default_quality}%
							</div>
						</Card>
					) : statusLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							Unable to fetch optimizer status
						</p>
					)}
				</TabsContent>

				{/* History Tab */}
				<TabsContent value="history" className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">Recent Generations</h4>
						<Button
							variant="outline"
							size="sm"
							onClick={fetchHistory}
							disabled={historyLoading}
						>
							{historyLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<RefreshCw className="h-4 w-4" />
							)}
						</Button>
					</div>

					{history.length > 0 ? (
						<div className="space-y-2">
							{history.map((item) => (
								<Card key={item.workflow_id} className="p-3">
									<div className="flex items-start justify-between">
										<div>
											<p className="font-medium text-sm">
												{item.article_title}
											</p>
											<p className="text-xs text-muted-foreground">
												{new Date(item.timestamp).toLocaleString()}
											</p>
										</div>
										<div className="flex gap-2">
											<Badge variant="outline">
												{item.successful_images}/{item.total_images} images
											</Badge>
											<Badge variant="secondary">
												{(item.processing_time_ms / 1000).toFixed(1)}s
											</Badge>
										</div>
									</div>
								</Card>
							))}
						</div>
					) : historyLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : (
						<p className="text-sm text-muted-foreground text-center py-8">
							No generation history yet
						</p>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
