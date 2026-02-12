"use client";

import {
	ArrowDown,
	ArrowUp,
	ChevronDown,
	Loader2,
	Plus,
	Sparkles,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
	TemplateWithSections,
	TemplateFormData,
	TemplateSectionFormData,
} from "@/hooks/use-templates";

interface TemplateEditorModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	template?: TemplateWithSections | null;
	onSubmit: (data: TemplateFormData) => Promise<void>;
	onGeneratePrompt: (context: {
		templateName: string;
		contentType: string;
		sectionName: string;
		sectionLabel: string;
		sectionFieldType: string;
		sectionDescription?: string;
		otherSections: Array<{
			name: string;
			label: string;
			fieldType: string;
		}>;
	}) => Promise<{ prompt: string; reasoning: string } | null>;
}

const EMPTY_SECTION: TemplateSectionFormData = {
	name: "",
	label: "",
	fieldType: "text",
	required: true,
	order: 0,
	promptStrategy: "auto_generate",
};

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export function TemplateEditorModal({
	open,
	onOpenChange,
	template,
	onSubmit,
	onGeneratePrompt,
}: TemplateEditorModalProps) {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [contentType, setContentType] = useState<string>("article");
	const [description, setDescription] = useState("");
	const [sections, setSections] = useState<TemplateSectionFormData[]>([]);
	const [saving, setSaving] = useState(false);
	const [generatingPromptIdx, setGeneratingPromptIdx] = useState<
		number | null
	>(null);

	const isEdit = !!template;

	useEffect(() => {
		if (open) {
			if (template) {
				setName(template.name);
				setSlug(template.slug);
				setContentType(template.contentType);
				setDescription(template.description || "");
				setSections(
					(template.sections || []).map((s) => ({
						id: s.id,
						name: s.name,
						label: s.label,
						fieldType: s.fieldType,
						required: s.required,
						order: s.order,
						description: s.description || undefined,
						placeholder: s.placeholder || undefined,
						defaultPrompt: s.defaultPrompt || undefined,
						userPrompt: s.userPrompt || undefined,
						promptStrategy: s.promptStrategy,
						generationHints: s.generationHints || undefined,
					})),
				);
			} else {
				setName("");
				setSlug("");
				setContentType("article");
				setDescription("");
				setSections([]);
			}
		}
	}, [open, template]);

	const handleNameChange = (value: string) => {
		setName(value);
		if (!isEdit) {
			setSlug(slugify(value));
		}
	};

	const addSection = () => {
		setSections((prev) => [
			...prev,
			{ ...EMPTY_SECTION, order: prev.length },
		]);
	};

	const removeSection = (idx: number) => {
		setSections((prev) => {
			const next = prev.filter((_, i) => i !== idx);
			return next.map((s, i) => ({ ...s, order: i }));
		});
	};

	const moveSection = (idx: number, direction: "up" | "down") => {
		setSections((prev) => {
			const next = [...prev];
			const target = direction === "up" ? idx - 1 : idx + 1;
			if (target < 0 || target >= next.length) return prev;
			[next[idx], next[target]] = [next[target], next[idx]];
			return next.map((s, i) => ({ ...s, order: i }));
		});
	};

	const updateSection = (
		idx: number,
		updates: Partial<TemplateSectionFormData>,
	) => {
		setSections((prev) =>
			prev.map((s, i) => (i === idx ? { ...s, ...updates } : s)),
		);
	};

	const handleGeneratePrompt = async (idx: number) => {
		const section = sections[idx];
		if (!section.name || !section.label) return;

		setGeneratingPromptIdx(idx);
		try {
			const result = await onGeneratePrompt({
				templateName: name || "Untitled Template",
				contentType,
				sectionName: section.name,
				sectionLabel: section.label,
				sectionFieldType: section.fieldType,
				sectionDescription: section.description,
				otherSections: sections
					.filter((_, i) => i !== idx)
					.map((s) => ({
						name: s.name,
						label: s.label,
						fieldType: s.fieldType,
					})),
			});
			if (result) {
				updateSection(idx, { defaultPrompt: result.prompt });
			}
		} finally {
			setGeneratingPromptIdx(null);
		}
	};

	const handleSubmit = async () => {
		if (!name || !slug || sections.length === 0) return;

		setSaving(true);
		try {
			await onSubmit({
				name,
				slug,
				contentType: contentType as TemplateFormData["contentType"],
				description: description || undefined,
				sections,
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Template" : "New Template"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update your content template and sections."
							: "Define a reusable content template with structured sections."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Template metadata */}
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="tmpl-name">Name</Label>
							<Input
								id="tmpl-name"
								value={name}
								onChange={(e) =>
									handleNameChange(e.target.value)
								}
								placeholder="My SEO Article"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="tmpl-type">Content Type</Label>
							<Select
								value={contentType}
								onValueChange={setContentType}
							>
								<SelectTrigger id="tmpl-type">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="article">
										Article
									</SelectItem>
									<SelectItem value="newsletter">
										Newsletter
									</SelectItem>
									<SelectItem value="video_script">
										Video Script
									</SelectItem>
									<SelectItem value="seo_brief">
										SEO Brief
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="tmpl-desc">Description</Label>
						<Textarea
							id="tmpl-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What this template is for..."
							rows={2}
						/>
					</div>

					{/* Sections */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">
								Sections ({sections.length})
							</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addSection}
							>
								<Plus className="mr-1 h-3.5 w-3.5" />
								Add Section
							</Button>
						</div>

						{sections.length === 0 && (
							<p className="text-center text-xs text-muted-foreground py-4">
								No sections yet. Add one to define your template
								structure.
							</p>
						)}

						{sections.map((section, idx) => (
							<Collapsible key={idx}>
								<Card className="p-3 space-y-3">
									{/* Section header */}
									<div className="flex items-center gap-2">
										<Badge
											variant="secondary"
											className="text-xs shrink-0"
										>
											{idx + 1}
										</Badge>
										<span className="text-sm font-medium flex-1 truncate">
											{section.label ||
												section.name ||
												"Untitled Section"}
										</span>
										<Badge
											variant="outline"
											className="text-xs"
										>
											{section.fieldType}
										</Badge>
										<div className="flex items-center gap-0.5">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-7 w-7"
												onClick={() =>
													moveSection(idx, "up")
												}
												disabled={idx === 0}
											>
												<ArrowUp className="h-3 w-3" />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-7 w-7"
												onClick={() =>
													moveSection(idx, "down")
												}
												disabled={
													idx === sections.length - 1
												}
											>
												<ArrowDown className="h-3 w-3" />
											</Button>
											<CollapsibleTrigger asChild>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-7 w-7"
												>
													<ChevronDown className="h-3 w-3" />
												</Button>
											</CollapsibleTrigger>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-7 w-7 text-destructive hover:text-destructive"
												onClick={() =>
													removeSection(idx)
												}
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									</div>

									{/* Collapsed: basic fields */}
									<div className="grid gap-2 sm:grid-cols-3">
										<Input
											placeholder="name (slug)"
											value={section.name}
											onChange={(e) =>
												updateSection(idx, {
													name: slugify(
														e.target.value,
													),
												})
											}
											className="text-xs h-8"
										/>
										<Input
											placeholder="Label"
											value={section.label}
											onChange={(e) =>
												updateSection(idx, {
													label: e.target.value,
												})
											}
											className="text-xs h-8"
										/>
										<Select
											value={section.fieldType}
											onValueChange={(v) =>
												updateSection(idx, {
													fieldType:
														v as TemplateSectionFormData["fieldType"],
												})
											}
										>
											<SelectTrigger className="text-xs h-8">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="text">
													Text
												</SelectItem>
												<SelectItem value="markdown">
													Markdown
												</SelectItem>
												<SelectItem value="list">
													List
												</SelectItem>
												<SelectItem value="number">
													Number
												</SelectItem>
												<SelectItem value="url">
													URL
												</SelectItem>
												<SelectItem value="tags">
													Tags
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Expanded content */}
									<CollapsibleContent className="space-y-3 pt-1">
										<div className="grid gap-2 sm:grid-cols-2">
											<div className="space-y-1">
												<Label className="text-xs">
													Description
												</Label>
												<Input
													value={
														section.description ||
														""
													}
													onChange={(e) =>
														updateSection(idx, {
															description:
																e.target.value,
														})
													}
													placeholder="What this section is for"
													className="text-xs h-8"
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">
													Placeholder
												</Label>
												<Input
													value={
														section.placeholder ||
														""
													}
													onChange={(e) =>
														updateSection(idx, {
															placeholder:
																e.target.value,
														})
													}
													placeholder="Example value"
													className="text-xs h-8"
												/>
											</div>
										</div>

										<div className="flex items-center gap-4">
											<div className="flex items-center gap-2">
												<Switch
													checked={
														section.required ??
														true
													}
													onCheckedChange={(v) =>
														updateSection(idx, {
															required: v,
														})
													}
												/>
												<Label className="text-xs">
													Required
												</Label>
											</div>
											<div className="flex items-center gap-2">
												<Label className="text-xs">
													Prompt Strategy
												</Label>
												<Select
													value={
														section.promptStrategy ||
														"auto_generate"
													}
													onValueChange={(v) =>
														updateSection(idx, {
															promptStrategy:
																v as TemplateSectionFormData["promptStrategy"],
														})
													}
												>
													<SelectTrigger className="text-xs h-7 w-32">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="auto_generate">
															Auto
														</SelectItem>
														<SelectItem value="user_defined">
															Manual
														</SelectItem>
														<SelectItem value="hybrid">
															Hybrid
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>

										{/* Prompt editor */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label className="text-xs">
													Default Prompt
												</Label>
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="h-7 text-xs"
													onClick={() =>
														handleGeneratePrompt(
															idx,
														)
													}
													disabled={
														generatingPromptIdx !==
															null ||
														!section.name ||
														!section.label
													}
												>
													{generatingPromptIdx ===
													idx ? (
														<Loader2 className="mr-1 h-3 w-3 animate-spin" />
													) : (
														<Sparkles className="mr-1 h-3 w-3" />
													)}
													Generate AI Prompt
												</Button>
											</div>
											<Textarea
												value={
													section.defaultPrompt || ""
												}
												onChange={(e) =>
													updateSection(idx, {
														defaultPrompt:
															e.target.value,
													})
												}
												placeholder="AI will use this prompt to generate content for this section..."
												rows={3}
												className="text-xs"
												readOnly={
													!!section.userPrompt
												}
											/>
										</div>

										<div className="space-y-1">
											<Label className="text-xs">
												User Prompt Override (optional)
											</Label>
											<Textarea
												value={
													section.userPrompt || ""
												}
												onChange={(e) =>
													updateSection(idx, {
														userPrompt:
															e.target.value ||
															undefined,
													})
												}
												placeholder="Override the default prompt with your own..."
												rows={2}
												className="text-xs"
											/>
										</div>

										{/* Generation hints */}
										<Collapsible>
											<CollapsibleTrigger asChild>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="h-7 text-xs text-muted-foreground"
												>
													<ChevronDown className="mr-1 h-3 w-3" />
													Generation Hints
												</Button>
											</CollapsibleTrigger>
											<CollapsibleContent className="space-y-2 pt-2">
												<div className="grid gap-2 sm:grid-cols-3">
													<div className="space-y-1">
														<Label className="text-xs">
															Temperature
														</Label>
														<Input
															type="number"
															min={0}
															max={2}
															step={0.1}
															value={
																section
																	.generationHints
																	?.temperature ??
																""
															}
															onChange={(e) =>
																updateSection(
																	idx,
																	{
																		generationHints:
																			{
																				...section.generationHints,
																				temperature:
																					e
																						.target
																						.value
																						? Number(
																								e
																									.target
																									.value,
																							)
																						: undefined,
																			},
																	},
																)
															}
															className="text-xs h-7"
														/>
													</div>
													<div className="space-y-1">
														<Label className="text-xs">
															Max Tokens
														</Label>
														<Input
															type="number"
															min={100}
															max={8000}
															step={100}
															value={
																section
																	.generationHints
																	?.maxTokens ??
																""
															}
															onChange={(e) =>
																updateSection(
																	idx,
																	{
																		generationHints:
																			{
																				...section.generationHints,
																				maxTokens:
																					e
																						.target
																						.value
																						? Number(
																								e
																									.target
																									.value,
																							)
																						: undefined,
																			},
																	},
																)
															}
															className="text-xs h-7"
														/>
													</div>
													<div className="space-y-1">
														<Label className="text-xs">
															Style
														</Label>
														<Input
															value={
																section
																	.generationHints
																	?.style ??
																""
															}
															onChange={(e) =>
																updateSection(
																	idx,
																	{
																		generationHints:
																			{
																				...section.generationHints,
																				style:
																					e
																						.target
																						.value ||
																					undefined,
																			},
																	},
																)
															}
															placeholder="conversational, formal..."
															className="text-xs h-7"
														/>
													</div>
												</div>
											</CollapsibleContent>
										</Collapsible>
									</CollapsibleContent>
								</Card>
							</Collapsible>
						))}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={
							saving ||
							!name ||
							!slug ||
							sections.length === 0
						}
					>
						{saving && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						{isEdit ? "Update Template" : "Create Template"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
