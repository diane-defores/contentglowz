"use client";

import { Brain, Loader2, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useProjectsContext } from "@/contexts/projects-context";
import { usePsychology, type CreatorEntry } from "@/hooks/use-psychology";
import { AngleSelector } from "./angle-selector";
import { NarrativeValidation } from "./narrative-validation";
import { PersonaEditor } from "./persona-editor";

const ENTRY_TYPES: { value: CreatorEntry["entryType"]; label: string; emoji: string }[] = [
	{ value: "reflection", label: "Reflection", emoji: "💭" },
	{ value: "win", label: "Win", emoji: "🏆" },
	{ value: "struggle", label: "Struggle", emoji: "💪" },
	{ value: "idea", label: "Idea", emoji: "💡" },
	{ value: "pivot", label: "Pivot", emoji: "🔄" },
];

export function RitualPage() {
	const { selectedProject } = useProjectsContext();
	const projectId = selectedProject?.id;

	const {
		profile,
		entries,
		pendingUpdates,
		loading,
		submitting,
		synthesisTaskId,
		submitEntry,
		reviewUpdate,
	} = usePsychology(projectId);

	const [content, setContent] = useState("");
	const [entryType, setEntryType] = useState<CreatorEntry["entryType"]>("reflection");
	const [triggerSynthesis, setTriggerSynthesis] = useState(false);

	const handleSubmit = async () => {
		if (!content.trim()) return;
		await submitEntry({
			entryType,
			content: content.trim(),
			triggerSynthesis,
		});
		setContent("");
		setTriggerSynthesis(false);
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* Header */}
			<div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto flex h-14 items-center justify-between px-4">
					<div className="flex items-center gap-2">
						<Brain className="h-5 w-5" />
						<h1 className="text-lg font-semibold">Psychology Engine</h1>
						{profile?.displayName && (
							<span className="text-sm text-muted-foreground">
								— {profile.displayName}
							</span>
						)}
					</div>
					<Button asChild variant="ghost" size="sm">
						<Link href="/dashboard">Back to Dashboard</Link>
					</Button>
				</div>
			</div>

			<div className="container mx-auto space-y-8 px-4 py-6">
				{/* Section 1: Creator Entry Form */}
				<Card className="p-6">
					<h2 className="mb-4 text-lg font-semibold">Weekly Ritual</h2>
					<p className="mb-4 text-sm text-muted-foreground">
						Share what&apos;s on your mind. Wins, struggles, ideas, pivots — everything feeds your narrative.
					</p>

					{/* Entry type selector */}
					<div className="mb-4 flex flex-wrap gap-2">
						{ENTRY_TYPES.map((t) => (
							<button
								key={t.value}
								type="button"
								onClick={() => setEntryType(t.value)}
								className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
									entryType === t.value
										? "border-primary bg-primary/10 text-primary"
										: "border-border hover:bg-muted"
								}`}
							>
								{t.emoji} {t.label}
							</button>
						))}
					</div>

					{/* Content input */}
					<Textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="What happened this week? What shifted? What are you thinking about?"
						rows={4}
						className="mb-4"
					/>

					<div className="flex items-center justify-between">
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={triggerSynthesis}
								onChange={(e) => setTriggerSynthesis(e.target.checked)}
								className="rounded border"
							/>
							<Sparkles className="h-4 w-4" />
							Trigger AI synthesis after save
						</label>

						<Button
							onClick={handleSubmit}
							disabled={!content.trim() || submitting}
							size="sm"
						>
							{submitting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Send className="mr-2 h-4 w-4" />
							)}
							Save Entry
						</Button>
					</div>

					{synthesisTaskId && (
						<div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
							<Loader2 className="h-4 w-4 animate-spin" />
							AI is synthesizing your narrative...
						</div>
					)}
				</Card>

				{/* Section 2: Narrative Validation */}
				{pendingUpdates.length > 0 && (
					<NarrativeValidation
						updates={pendingUpdates}
						currentProfile={profile}
						onReview={reviewUpdate}
					/>
				)}

				{/* Section 3: Current Narrative */}
				{profile && (profile.voice || profile.positioning) && (
					<Card className="p-6">
						<h2 className="mb-4 text-lg font-semibold">Your Narrative</h2>
						<div className="grid gap-4 md:grid-cols-2">
							{profile.voice && (
								<div>
									<h3 className="mb-2 text-sm font-medium text-muted-foreground">Voice</h3>
									{profile.voice.tone && (
										<p className="text-sm"><strong>Tone:</strong> {profile.voice.tone}</p>
									)}
									{profile.voice.vocabulary && profile.voice.vocabulary.length > 0 && (
										<p className="text-sm">
											<strong>Key words:</strong> {profile.voice.vocabulary.join(", ")}
										</p>
									)}
								</div>
							)}
							{profile.positioning && (
								<div>
									<h3 className="mb-2 text-sm font-medium text-muted-foreground">Positioning</h3>
									{profile.positioning.niche && (
										<p className="text-sm"><strong>Niche:</strong> {profile.positioning.niche}</p>
									)}
									{profile.positioning.uniqueAngle && (
										<p className="text-sm"><strong>Angle:</strong> {profile.positioning.uniqueAngle}</p>
									)}
								</div>
							)}
						</div>
					</Card>
				)}

				{/* Section 4: Recent Entries */}
				{entries.length > 0 && (
					<Card className="p-6">
						<h2 className="mb-4 text-lg font-semibold">Recent Entries</h2>
						<div className="space-y-3">
							{entries.slice(0, 5).map((entry) => (
								<div
									key={entry.id}
									className="rounded-lg border p-3"
								>
									<div className="mb-1 flex items-center gap-2">
										<span className="text-xs font-medium uppercase text-muted-foreground">
											{ENTRY_TYPES.find((t) => t.value === entry.entryType)?.emoji}{" "}
											{entry.entryType}
										</span>
										<span className="text-xs text-muted-foreground">
											{new Date(entry.createdAt).toLocaleDateString()}
										</span>
									</div>
									<p className="text-sm">{entry.content}</p>
								</div>
							))}
						</div>
					</Card>
				)}

				{/* Section 5: Customer Personas */}
				<PersonaEditor projectId={projectId} />

				{/* Section 6: Content Angles (The Bridge) */}
				<AngleSelector projectId={projectId} />
			</div>
		</div>
	);
}
