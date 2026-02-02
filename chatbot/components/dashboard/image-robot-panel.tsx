"use client";

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileImage,
	Loader2,
	RefreshCw,
	Upload,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ImageRobotPanel() {
	const [activeTab, setActiveTab] = useState("generate");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Optimizer status
	const [optimizerStatus, setOptimizerStatus] = useState<OptimizerStatus | null>(null);
	const [statusLoading, setStatusLoading] = useState(false);

	// Generate form state
	const [articleContent, setArticleContent] = useState("");
	const [articleTitle, setArticleTitle] = useState("");
	const [articleSlug, setArticleSlug] = useState("");
	const [strategyType, setStrategyType] = useState<string>("standard");
	const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);

	// History
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [historyLoading, setHistoryLoading] = useState(false);

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
		setHistoryLoading(true);
		try {
			const response = await fetch(`${API_BASE}/api/images/history?limit=10`);
			if (!response.ok) throw new Error("Failed to fetch history");
			const data = await response.json();
			setHistory(data.items || []);
		} catch (err) {
			console.error("Failed to fetch history:", err);
		} finally {
			setHistoryLoading(false);
		}
	}, []);

	// Generate images
	const handleGenerate = async () => {
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
			setError(err instanceof Error ? err.message : "Failed to generate images");
		} finally {
			setLoading(false);
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
			.replace(/[^\w\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.trim();

	// Initial fetch
	useEffect(() => {
		fetchOptimizerStatus();
		fetchHistory();
	}, [fetchOptimizerStatus, fetchHistory]);

	return (
		<div className="space-y-4">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="generate">
						<FileImage className="mr-2 h-4 w-4" />
						Generate
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
							<Select value={strategyType} onValueChange={setStrategyType} disabled={loading}>
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
						<Button onClick={handleGenerate} disabled={loading || !articleContent}>
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
									{generateResult.success ? "Generation Complete" : "Generation Failed"}
								</span>
							</div>
							<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
								<div>
									<p className="text-muted-foreground">Total Images</p>
									<p className="font-medium">{generateResult.total_images}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Successful</p>
									<p className="font-medium text-green-600">{generateResult.successful_images}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Failed</p>
									<p className="font-medium text-red-600">{generateResult.failed_images}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Processing Time</p>
									<p className="font-medium">{(generateResult.processing_time_ms / 1000).toFixed(1)}s</p>
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

				{/* Upload Tab */}
				<TabsContent value="upload" className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Upload a single image to Bunny CDN with optimization.
					</p>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Source URL</Label>
							<Input placeholder="https://example.com/image.png" disabled={loading} />
						</div>
						<div className="space-y-2">
							<Label>File Name</Label>
							<Input placeholder="my-optimized-image" disabled={loading} />
						</div>
					</div>
					<div className="space-y-2">
						<Label>Alt Text</Label>
						<Input placeholder="Descriptive alt text for accessibility" disabled={loading} />
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
						<Button variant="outline" size="sm" onClick={fetchOptimizerStatus} disabled={statusLoading}>
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
								<Badge variant={optimizerStatus.enabled ? "default" : "secondary"}>
									{optimizerStatus.enabled ? "Enabled" : "Disabled"}
								</Badge>
								{optimizerStatus.verified && (
									<Badge variant="outline" className="text-green-600 border-green-200">
										<CheckCircle2 className="mr-1 h-3 w-3" />
										Verified
									</Badge>
								)}
							</div>
							<p className="text-sm text-muted-foreground">{optimizerStatus.message}</p>
							{optimizerStatus.hostname && (
								<div className="text-sm">
									<span className="text-muted-foreground">Hostname: </span>
									<code className="bg-muted px-1 rounded">{optimizerStatus.hostname}</code>
								</div>
							)}
							<div className="text-sm">
								<span className="text-muted-foreground">Supported formats: </span>
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
						<p className="text-sm text-muted-foreground">Unable to fetch optimizer status</p>
					)}
				</TabsContent>

				{/* History Tab */}
				<TabsContent value="history" className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">Recent Generations</h4>
						<Button variant="outline" size="sm" onClick={fetchHistory} disabled={historyLoading}>
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
											<p className="font-medium text-sm">{item.article_title}</p>
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
