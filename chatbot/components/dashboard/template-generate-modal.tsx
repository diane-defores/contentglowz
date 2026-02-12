"use client";

import { CheckCircle2, Loader2, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateWithSections, GenerationJob } from "@/hooks/use-templates";

interface TemplateGenerateModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	template: TemplateWithSections;
	generating: boolean;
	generationJob: GenerationJob | null;
	onGenerate: (
		context: Record<string, any>,
		userInputs: Record<string, any>,
	) => void;
}

export function TemplateGenerateModal({
	open,
	onOpenChange,
	template,
	generating,
	generationJob,
	onGenerate,
}: TemplateGenerateModalProps) {
	const [topic, setTopic] = useState("");
	const [audience, setAudience] = useState("");
	const [tone, setTone] = useState("professional");
	const [keywords, setKeywords] = useState("");
	const [userInputs, setUserInputs] = useState<Record<string, string>>({});

	const handleGenerate = () => {
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
			userInputs,
		);
	};

	const isCompleted = generationJob?.status === "completed";
	const isFailed = generationJob?.status === "failed";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Zap className="h-5 w-5" />
						Generate: {template.name}
					</DialogTitle>
					<DialogDescription>
						Fill in the context below. Sections you pre-fill will
						skip AI generation.
					</DialogDescription>
				</DialogHeader>

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
								<ScrollArea className="h-64 rounded border p-3">
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
								</ScrollArea>
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

						{/* Section pre-fills */}
						<div className="space-y-3">
							<p className="text-sm font-medium">
								Pre-fill Sections{" "}
								<span className="font-normal text-muted-foreground">
									(optional — skip AI for these)
								</span>
							</p>
							<div className="space-y-2">
								{template.sections.map((section) => (
									<div
										key={section.id}
										className="space-y-1"
									>
										<div className="flex items-center gap-2">
											<Label className="text-xs">
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
										</div>
										{section.fieldType === "markdown" ||
										section.fieldType === "list" ? (
											<Textarea
												value={
													userInputs[
														section.name
													] || ""
												}
												onChange={(e) =>
													setUserInputs((prev) => ({
														...prev,
														[section.name]:
															e.target.value,
													}))
												}
												placeholder={
													section.placeholder ||
													`Leave empty for AI generation`
												}
												rows={2}
												className="text-xs"
											/>
										) : (
											<Input
												value={
													userInputs[
														section.name
													] || ""
												}
												onChange={(e) =>
													setUserInputs((prev) => ({
														...prev,
														[section.name]:
															e.target.value,
													}))
												}
												placeholder={
													section.placeholder ||
													`Leave empty for AI generation`
												}
												className="text-xs h-8"
											/>
										)}
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
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
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
