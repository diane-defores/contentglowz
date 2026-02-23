"use client";

import { ArrowLeft, CheckCircle2, Loader2, XCircle, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateWithSections, GenerationJob } from "@/hooks/use-templates";

type SectionMode = "ai" | "manual" | "merge";

interface TemplateGenerateProps {
	template: TemplateWithSections;
	generating: boolean;
	generationJob: GenerationJob | null;
	onGenerate: (
		context: Record<string, any>,
		userInputs: Record<string, any>,
		promptOverrides: Record<string, string>,
	) => void;
	onBack: () => void;
}

export function TemplateGenerate({
	template,
	generating,
	generationJob,
	onGenerate,
	onBack,
}: TemplateGenerateProps) {
	const [topic, setTopic] = useState("");
	const [audience, setAudience] = useState("");
	const [tone, setTone] = useState("professional");
	const [keywords, setKeywords] = useState("");
	const [userInputs, setUserInputs] = useState<Record<string, string>>({});
	const [promptOverrides, setPromptOverrides] = useState<Record<string, string>>({});
	const [sectionModes, setSectionModes] = useState<Record<string, SectionMode>>({});

	// Initialize prompt overrides and modes from template sections
	useEffect(() => {
		const initialPrompts: Record<string, string> = {};
		const initialModes: Record<string, SectionMode> = {};
		for (const section of template.sections) {
			const prompt = section.userPrompt || section.defaultPrompt;
			if (prompt) {
				initialPrompts[section.name] = prompt;
			}
			initialModes[section.name] = "ai";
		}
		setPromptOverrides(initialPrompts);
		setSectionModes(initialModes);
	}, [template]);

	const handleGenerate = () => {
		// Build final userInputs and promptOverrides based on section modes
		const finalUserInputs: Record<string, string> = {};
		const finalPromptOverrides: Record<string, string> = {};

		for (const section of template.sections) {
			const mode = sectionModes[section.name] || "ai";
			const prompt = promptOverrides[section.name] || "";
			const content = userInputs[section.name] || "";

			switch (mode) {
				case "ai":
					// AI generates using the prompt, no user content
					if (prompt) finalPromptOverrides[section.name] = prompt;
					break;
				case "manual":
					// User content as-is, skip AI
					if (content) finalUserInputs[section.name] = content;
					break;
				case "merge":
					// Inject user content into the prompt so AI merges both
					if (content && prompt) {
						finalPromptOverrides[section.name] =
							`${prompt}\n\n---\nUse the following user-provided content as a base. Enhance, restructure, and complete it while following the prompt above:\n\n${content}`;
					} else if (content) {
						finalPromptOverrides[section.name] =
							`Enhance, restructure, and complete the following content:\n\n${content}`;
					} else if (prompt) {
						// No user content to merge — fall back to AI-only
						finalPromptOverrides[section.name] = prompt;
					}
					break;
			}
		}

		onGenerate(
			{
				topic,
				audience,
				tone,
				keywords: keywords
					.split(",")
					.map((k) => k.trim())
					.filter(Boolean),
			},
			finalUserInputs,
			finalPromptOverrides,
		);
	};

	const isCompleted = generationJob?.status === "completed";
	const isFailed = generationJob?.status === "failed";

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="icon" onClick={onBack}>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<Zap className="h-5 w-5" />
					<h3 className="text-lg font-semibold">
						Generate: {template.name}
					</h3>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={onBack}>
						{isCompleted ? "Close" : "Cancel"}
					</Button>
					{!isCompleted && (
						<Button
							onClick={handleGenerate}
							disabled={generating || !topic}
						>
							{generating ? (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							) : (
								<Zap className="mr-1.5 h-3.5 w-3.5" />
							)}
							Generate Content
						</Button>
					)}
				</div>
			</div>

			{/* Generation progress / result */}
			{generationJob && (
				<div className="space-y-3 rounded-lg border p-4">
					{generating && (
						<>
							<div className="flex items-center gap-2 text-sm">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span>
									{generationJob.message ||
										"Generating..."}
								</span>
							</div>
							<Progress
								value={generationJob.progress || 0}
								className="h-2"
							/>
						</>
					)}
					{isCompleted && (
						<div className="space-y-3">
							<div className="flex items-center gap-2 text-sm text-green-600">
								<CheckCircle2 className="h-4 w-4" />
								Content generated successfully
							</div>
							{generationJob.result
								?.content_record_id && (
								<p className="text-xs text-muted-foreground">
									Content record created. Check the
									Content tab for review.
								</p>
							)}
							<div className="rounded border p-3">
								<div className="space-y-4">
									{generationJob.result?.sections &&
										Object.entries(
											generationJob.result.sections,
										).map(([key, value]) => (
											<div
												key={key}
												className="space-y-1"
											>
												<p className="text-xs font-medium text-muted-foreground uppercase">
													{key.replace(
														/_/g,
														" ",
													)}
												</p>
												<div className="text-sm whitespace-pre-wrap">
													{typeof value ===
													"string"
														? value
														: JSON.stringify(
																value,
																null,
																2,
															)}
												</div>
											</div>
										))}
								</div>
							</div>
						</div>
					)}
					{isFailed && (
						<div className="flex items-center gap-2 text-sm text-red-600">
							<XCircle className="h-4 w-4" />
							{generationJob.message || "Generation failed"}
						</div>
					)}
				</div>
			)}

			{/* Context form — hide when showing results */}
			{!isCompleted && (
				<div className="space-y-4">
					{/* Global context */}
					<div className="space-y-3">
						<p className="text-sm font-medium">Context</p>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-1">
								<Label className="text-xs">Topic</Label>
								<Input
									value={topic}
									onChange={(e) =>
										setTopic(e.target.value)
									}
									placeholder="e.g. AI-powered SEO tools"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs">Audience</Label>
								<Input
									value={audience}
									onChange={(e) =>
										setAudience(e.target.value)
									}
									placeholder="e.g. SaaS marketers"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs">Tone</Label>
								<Input
									value={tone}
									onChange={(e) =>
										setTone(e.target.value)
									}
									placeholder="e.g. professional, casual"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs">
									Keywords (comma separated)
								</Label>
								<Input
									value={keywords}
									onChange={(e) =>
										setKeywords(e.target.value)
									}
									placeholder="e.g. seo tools, ai content"
								/>
							</div>
						</div>
					</div>

					{/* Sections */}
					<div className="space-y-3">
						<p className="text-sm font-medium">Sections</p>
						<div className="space-y-3">
							{template.sections.map((section) => {
								const mode = sectionModes[section.name] || "ai";
								return (
									<div
										key={section.id}
										className="space-y-1.5 rounded-lg border p-3"
									>
										<div className="flex items-center gap-2">
											<Label className="text-xs font-medium flex-1">
												{section.label}
											</Label>
											<Badge
												variant="outline"
												className="text-[10px]"
											>
												{section.fieldType}
											</Badge>
											{!section.required && (
												<Badge
													variant="secondary"
													className="text-[10px]"
												>
													optional
												</Badge>
											)}
											<Select
												value={mode}
												onValueChange={(v) =>
													setSectionModes(
														(prev) => ({
															...prev,
															[section.name]:
																v as SectionMode,
														}),
													)
												}
											>
												<SelectTrigger className="h-7 w-28 text-[10px]">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="ai">
														AI only
													</SelectItem>
													<SelectItem value="manual">
														Manual
													</SelectItem>
													<SelectItem value="merge">
														Merge
													</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{/* Prompt — shown for AI and Merge modes */}
										{mode !== "manual" && (
											<div className="space-y-1">
												<Label className="text-[10px] text-muted-foreground">
													Prompt
												</Label>
												<Textarea
													value={
														promptOverrides[section.name] || ""
													}
													onChange={(e) =>
														setPromptOverrides(
															(prev) => ({
																...prev,
																[section.name]:
																	e.target.value,
															}),
														)
													}
													placeholder="No prompt — AI will generate freely"
													className="text-xs field-sizing-content min-h-[2lh]"
												/>
											</div>
										)}

										{/* Content input — shown for Manual and Merge modes */}
										{mode !== "ai" && (
											<div className="space-y-1">
												<Label className="text-[10px] text-muted-foreground">
													{mode === "merge"
														? "Your content (AI will enhance)"
														: "Content"}
												</Label>
												{section.fieldType ===
													"markdown" ||
												section.fieldType === "list" ? (
													<Textarea
														value={
															userInputs[
																section.name
															] || ""
														}
														onChange={(e) =>
															setUserInputs(
																(prev) => ({
																	...prev,
																	[section.name]:
																		e.target
																			.value,
																}),
															)
														}
														placeholder={
															mode === "merge"
																? "Paste your draft — AI will merge with prompt"
																: "Your final content"
														}
														className="text-xs field-sizing-content min-h-[3lh]"
													/>
												) : (
													<Input
														value={
															userInputs[
																section.name
															] || ""
														}
														onChange={(e) =>
															setUserInputs(
																(prev) => ({
																	...prev,
																	[section.name]:
																		e.target
																			.value,
																}),
															)
														}
														placeholder={
															mode === "merge"
																? "Paste your draft — AI will merge with prompt"
																: "Your final content"
														}
														className="text-xs h-8"
													/>
												)}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
