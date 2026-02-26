"use client";

import { Brain, ChevronDown, Loader2, Network, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

/* ---------- Creator Brain Panel (left) ---------- */
function CreatorBrainPanel({
	profile,
	entries,
	pendingUpdates,
	submitting,
	synthesisTaskId,
	content,
	setContent,
	entryType,
	setEntryType,
	triggerSynthesis,
	setTriggerSynthesis,
	onSubmit,
	onReviewUpdate,
}: {
	profile: ReturnType<typeof usePsychology>["profile"];
	entries: ReturnType<typeof usePsychology>["entries"];
	pendingUpdates: ReturnType<typeof usePsychology>["pendingUpdates"];
	submitting: boolean;
	synthesisTaskId: string | null;
	content: string;
	setContent: (v: string) => void;
	entryType: CreatorEntry["entryType"];
	setEntryType: (v: CreatorEntry["entryType"]) => void;
	triggerSynthesis: boolean;
	setTriggerSynthesis: (v: boolean) => void;
	onSubmit: () => void;
	onReviewUpdate: ReturnType<typeof usePsychology>["reviewUpdate"];
}) {
	const hasNarrative = profile && (profile.voice || profile.positioning);
	const hasEntries = entries.length > 0;
	const [showEntries, setShowEntries] = useState(false);

	return (
		<div className="space-y-4">
			{/* Panel header */}
			<div className="flex items-center gap-2">
				<Brain className="h-4 w-4 text-primary" />
				<h2 className="text-sm font-semibold">Creator Brain</h2>
				{profile?.displayName && (
					<span className="text-xs text-muted-foreground">
						{profile.displayName}
					</span>
				)}
			</div>

			{/* Entry form */}
			<Card className="p-4">
				<p className="mb-3 text-xs text-muted-foreground">
					{hasNarrative
						? "What's new this week? Your narrative evolves with each entry."
						: "Start your first entry — wins, struggles, ideas, pivots. Everything shapes your narrative."
					}
				</p>

				{/* Entry type pills */}
				<div className="mb-3 flex flex-wrap gap-1.5">
					{ENTRY_TYPES.map((t) => (
						<button
							key={t.value}
							type="button"
							onClick={() => setEntryType(t.value)}
							className={`rounded-full border px-2.5 py-1 text-xs transition-all ${
								entryType === t.value
									? "border-primary bg-primary/10 text-primary"
									: "border-border hover:bg-muted"
							}`}
						>
							{t.emoji} {t.label}
						</button>
					))}
				</div>

				<Textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="What happened? What shifted? What are you thinking about?"
					rows={3}
					className="mb-3 text-sm"
				/>

				<div className="flex items-center justify-between">
					<label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
						<input
							type="checkbox"
							checked={triggerSynthesis}
							onChange={(e) => setTriggerSynthesis(e.target.checked)}
							className="rounded border"
						/>
						<Sparkles className="h-3 w-3" />
						Synthesize
					</label>

					<Button
						onClick={onSubmit}
						disabled={!content.trim() || submitting}
						size="sm"
						className="h-7 text-xs"
					>
						{submitting ? (
							<Loader2 className="mr-1 h-3 w-3 animate-spin" />
						) : (
							<Send className="mr-1 h-3 w-3" />
						)}
						Save Entry
					</Button>
				</div>

				{synthesisTaskId && (
					<div className="mt-3 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-xs text-primary">
						<Loader2 className="h-3 w-3 animate-spin" />
						Synthesizing your narrative...
					</div>
				)}
			</Card>

			{/* Pending narrative updates (inline editing) */}
			{pendingUpdates.length > 0 && (
				<NarrativeValidation
					updates={pendingUpdates}
					currentProfile={profile}
					onReview={onReviewUpdate}
				/>
			)}

			{/* Current narrative — adaptive: hidden when empty */}
			{hasNarrative && (
				<Card className="p-4">
					<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Your Narrative
					</h3>
					<div className="space-y-2">
						{profile.voice && (
							<div>
								{profile.voice.tone && (
									<p className="text-sm">
										<span className="text-muted-foreground">Voice:</span>{" "}
										{profile.voice.tone}
									</p>
								)}
								{profile.voice.vocabulary && profile.voice.vocabulary.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-1">
										{profile.voice.vocabulary.map((w, i) => (
											<Badge key={i} variant="secondary" className="text-[10px]">
												{w}
											</Badge>
										))}
									</div>
								)}
							</div>
						)}
						{profile.positioning && (
							<div>
								{profile.positioning.niche && (
									<p className="text-sm">
										<span className="text-muted-foreground">Niche:</span>{" "}
										{profile.positioning.niche}
									</p>
								)}
								{profile.positioning.uniqueAngle && (
									<p className="text-sm">
										<span className="text-muted-foreground">Angle:</span>{" "}
										{profile.positioning.uniqueAngle}
									</p>
								)}
							</div>
						)}
					</div>
				</Card>
			)}

			{/* Recent entries — collapsible, adaptive */}
			{hasEntries && (
				<Collapsible open={showEntries} onOpenChange={setShowEntries}>
					<CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
						<ChevronDown className={`h-3 w-3 transition-transform ${showEntries ? "rotate-0" : "-rotate-90"}`} />
						Recent entries ({entries.length})
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="mt-2 space-y-2">
							{entries.slice(0, 5).map((entry) => (
								<div
									key={entry.id}
									className="rounded-md border px-3 py-2"
								>
									<div className="mb-0.5 flex items-center gap-2">
										<span className="text-xs">
											{ENTRY_TYPES.find((t) => t.value === entry.entryType)?.emoji}
										</span>
										<span className="text-[10px] font-medium uppercase text-muted-foreground">
											{entry.entryType}
										</span>
										<span className="text-[10px] text-muted-foreground">
											{new Date(entry.createdAt).toLocaleDateString()}
										</span>
									</div>
									<p className="text-xs leading-relaxed">{entry.content}</p>
								</div>
							))}
						</div>
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
}

/* ---------- Customer Brain Panel (right) ---------- */
function CustomerBrainPanel({ projectId }: { projectId?: string }) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Network className="h-4 w-4 text-primary" />
				<h2 className="text-sm font-semibold">Customer Brain</h2>
			</div>

			<Card className="p-4">
				<PersonaEditor projectId={projectId} />
			</Card>
		</div>
	);
}

/* ---------- The Bridge (bottom, full-width) ---------- */
function BridgePanel({ projectId }: { projectId?: string }) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Sparkles className="h-4 w-4 text-primary" />
				<h2 className="text-sm font-semibold">The Bridge</h2>
				<span className="text-xs text-muted-foreground">
					— where your story meets their needs
				</span>
			</div>

			<Card className="p-4">
				<AngleSelector projectId={projectId} />
			</Card>
		</div>
	);
}

/* ---------- Main Ritual Page ---------- */
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
				<div className="flex items-center gap-3">
					<Brain className="h-6 w-6 animate-pulse text-primary" />
					<span className="text-sm text-muted-foreground">Loading your brain...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* Header */}
			<div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto flex h-12 items-center justify-between px-4">
					<div className="flex items-center gap-2">
						<Brain className="h-4 w-4 text-primary" />
						<h1 className="text-sm font-semibold">Psychology Engine</h1>
					</div>
					<Button asChild variant="ghost" size="sm" className="h-7 text-xs">
						<Link href="/dashboard">Dashboard</Link>
					</Button>
				</div>
			</div>

			<div className="container mx-auto px-4 py-6">
				{/* Side-by-side: Creator Brain (left) + Customer Brain (right) */}
				<div className="grid gap-6 lg:grid-cols-2">
					<CreatorBrainPanel
						profile={profile}
						entries={entries}
						pendingUpdates={pendingUpdates}
						submitting={submitting}
						synthesisTaskId={synthesisTaskId}
						content={content}
						setContent={setContent}
						entryType={entryType}
						setEntryType={setEntryType}
						triggerSynthesis={triggerSynthesis}
						setTriggerSynthesis={setTriggerSynthesis}
						onSubmit={handleSubmit}
						onReviewUpdate={reviewUpdate}
					/>

					<CustomerBrainPanel projectId={projectId} />
				</div>

				{/* The Bridge — full width below */}
				<div className="mt-6">
					<BridgePanel projectId={projectId} />
				</div>
			</div>
		</div>
	);
}
