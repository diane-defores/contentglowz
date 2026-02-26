"use client";

import { Check, Loader2, Pencil, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CreatorProfile, NarrativeUpdate } from "@/hooks/use-psychology";

interface NarrativeValidationProps {
	updates: NarrativeUpdate[];
	currentProfile: CreatorProfile | null;
	onReview: (updateId: string, approved: boolean, edits?: Record<string, unknown>) => Promise<unknown>;
}

interface EditableFields {
	tone: string;
	vocabulary: string[];
	niche: string;
	uniqueAngle: string;
}

function extractFields(
	voiceDelta: Record<string, unknown> | null,
	positioningDelta: Record<string, unknown> | null,
	current: CreatorProfile | null,
): EditableFields {
	return {
		tone:
			(voiceDelta?.tone as string) ||
			current?.voice?.tone ||
			"",
		vocabulary:
			(voiceDelta?.vocabulary as string[]) ||
			current?.voice?.vocabulary ||
			[],
		niche:
			(positioningDelta?.niche as string) ||
			current?.positioning?.niche ||
			"",
		uniqueAngle:
			(positioningDelta?.uniqueAngle as string) ||
			current?.positioning?.uniqueAngle ||
			"",
	};
}

function InlineUpdateCard({
	update,
	currentProfile,
	onReview,
}: {
	update: NarrativeUpdate;
	currentProfile: CreatorProfile | null;
	onReview: NarrativeValidationProps["onReview"];
}) {
	const [reviewing, setReviewing] = useState(false);
	const [editing, setEditing] = useState(false);
	const [fields, setFields] = useState<EditableFields>(() =>
		extractFields(update.voiceDelta, update.positioningDelta, currentProfile),
	);
	const [vocabInput, setVocabInput] = useState("");

	const hasVoiceChanges = update.voiceDelta && Object.keys(update.voiceDelta).length > 0;
	const hasPositioningChanges = update.positioningDelta && Object.keys(update.positioningDelta).length > 0;

	const handleApprove = useCallback(async () => {
		setReviewing(true);
		try {
			const edits = editing
				? {
						voiceDelta: {
							...(update.voiceDelta || {}),
							tone: fields.tone || undefined,
							vocabulary: fields.vocabulary.length > 0 ? fields.vocabulary : undefined,
						},
						positioningDelta: {
							...(update.positioningDelta || {}),
							niche: fields.niche || undefined,
							uniqueAngle: fields.uniqueAngle || undefined,
						},
					}
				: undefined;
			await onReview(update.id, true, edits);
		} finally {
			setReviewing(false);
		}
	}, [update, fields, editing, onReview]);

	const handleReject = useCallback(async () => {
		setReviewing(true);
		try {
			await onReview(update.id, false);
		} finally {
			setReviewing(false);
		}
	}, [update.id, onReview]);

	const addVocab = () => {
		if (vocabInput.trim()) {
			setFields((f) => ({ ...f, vocabulary: [...f.vocabulary, vocabInput.trim()] }));
			setVocabInput("");
		}
	};

	const removeVocab = (idx: number) => {
		setFields((f) => ({ ...f, vocabulary: f.vocabulary.filter((_, i) => i !== idx) }));
	};

	return (
		<div className="rounded-lg border bg-background p-4">
			{/* AI summary — conversational tone */}
			{update.narrativeSummary && (
				<p className="mb-3 text-sm leading-relaxed">
					{update.narrativeSummary}
				</p>
			)}

			{/* Proposed changes as readable fields */}
			<div className="space-y-3">
				{hasVoiceChanges && (
					<div className="rounded-md border border-primary/20 bg-primary/5 p-3">
						<h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
							Voice Evolution
						</h4>
						<div className="space-y-2">
							{fields.tone && (
								<div className="flex items-start gap-2">
									<span className="shrink-0 text-xs font-medium text-muted-foreground w-16">Tone</span>
									{editing ? (
										<Input
											value={fields.tone}
											onChange={(e) => setFields((f) => ({ ...f, tone: e.target.value }))}
											className="h-7 text-sm"
										/>
									) : (
										<span className="text-sm">{fields.tone}</span>
									)}
								</div>
							)}
							{fields.vocabulary.length > 0 && (
								<div className="flex items-start gap-2">
									<span className="shrink-0 text-xs font-medium text-muted-foreground w-16">Words</span>
									<div className="flex flex-wrap gap-1">
										{fields.vocabulary.map((word, i) => (
											<Badge key={i} variant="secondary" className="text-xs">
												{word}
												{editing && (
													<button
														type="button"
														onClick={() => removeVocab(i)}
														className="ml-1 hover:text-destructive"
													>
														<X className="h-2.5 w-2.5" />
													</button>
												)}
											</Badge>
										))}
										{editing && (
											<Input
												value={vocabInput}
												onChange={(e) => setVocabInput(e.target.value)}
												onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVocab(); } }}
												placeholder="+ add"
												className="h-6 w-20 text-xs"
											/>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{hasPositioningChanges && (
					<div className="rounded-md border border-primary/20 bg-primary/5 p-3">
						<h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
							Positioning Shift
						</h4>
						<div className="space-y-2">
							{fields.niche && (
								<div className="flex items-start gap-2">
									<span className="shrink-0 text-xs font-medium text-muted-foreground w-16">Niche</span>
									{editing ? (
										<Input
											value={fields.niche}
											onChange={(e) => setFields((f) => ({ ...f, niche: e.target.value }))}
											className="h-7 text-sm"
										/>
									) : (
										<span className="text-sm">{fields.niche}</span>
									)}
								</div>
							)}
							{fields.uniqueAngle && (
								<div className="flex items-start gap-2">
									<span className="shrink-0 text-xs font-medium text-muted-foreground w-16">Angle</span>
									{editing ? (
										<Input
											value={fields.uniqueAngle}
											onChange={(e) => setFields((f) => ({ ...f, uniqueAngle: e.target.value }))}
											className="h-7 text-sm"
										/>
									) : (
										<span className="text-sm">{fields.uniqueAngle}</span>
									)}
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="mt-3 flex items-center gap-2">
				<Button
					size="sm"
					onClick={handleApprove}
					disabled={reviewing}
				>
					{reviewing ? (
						<Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
					) : (
						<Check className="mr-1 h-3.5 w-3.5" />
					)}
					{editing ? "Save & Apply" : "Apply"}
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleReject}
					disabled={reviewing}
				>
					<X className="mr-1 h-3.5 w-3.5" />
					Dismiss
				</Button>
				<div className="flex-1" />
				<Button
					size="sm"
					variant="outline"
					onClick={() => setEditing(!editing)}
					className="text-xs"
				>
					<Pencil className="mr-1 h-3 w-3" />
					{editing ? "Done editing" : "Edit first"}
				</Button>
			</div>
		</div>
	);
}

export function NarrativeValidation({
	updates,
	currentProfile,
	onReview,
}: NarrativeValidationProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
				<h3 className="text-sm font-semibold">
					{updates.length} narrative {updates.length === 1 ? "update" : "updates"} to review
				</h3>
			</div>
			<p className="text-xs text-muted-foreground">
				Your AI companion synthesized recent entries. Review and edit before applying to your profile.
			</p>
			{updates.map((update) => (
				<InlineUpdateCard
					key={update.id}
					update={update}
					currentProfile={currentProfile}
					onReview={onReview}
				/>
			))}
		</div>
	);
}
