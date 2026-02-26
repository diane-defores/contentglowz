"use client";

import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAngles, type ContentAngle } from "@/hooks/use-angles";
import { usePersonas } from "@/hooks/use-personas";

interface AngleSelectorProps {
	projectId?: string;
}

const CONTENT_TYPES = [
	{ value: "", label: "Any format" },
	{ value: "article", label: "Article" },
	{ value: "newsletter", label: "Newsletter" },
	{ value: "video_script", label: "Video Script" },
	{ value: "social_post", label: "Social Post" },
];

function AngleCard({
	angle,
	onSelect,
}: {
	angle: ContentAngle;
	onSelect: (id: string, status: "selected" | "dismissed") => void;
}) {
	return (
		<div className="group rounded-lg border p-3 transition-all hover:border-primary/30 hover:bg-primary/5">
			<div className="mb-1.5 flex items-start justify-between gap-2">
				<h4 className="font-medium text-sm leading-tight">{angle.title}</h4>
				<Badge variant="outline" className="shrink-0 text-[10px]">
					{angle.contentType.replace("_", " ")}
				</Badge>
			</div>

			{angle.hook && (
				<p className="mb-2 text-sm italic text-muted-foreground leading-snug">
					&ldquo;{angle.hook}&rdquo;
				</p>
			)}

			<p className="mb-2 text-xs leading-relaxed">{angle.angle}</p>

			{/* Connection threads — showing how creator + audience connect */}
			<div className="mb-2 space-y-1">
				{angle.narrativeThread && (
					<div className="flex items-start gap-1.5 text-[11px]">
						<span className="shrink-0 text-primary">Your story:</span>
						<span className="text-muted-foreground">{angle.narrativeThread}</span>
					</div>
				)}
				{angle.painPointAddressed && (
					<div className="flex items-start gap-1.5 text-[11px]">
						<span className="shrink-0 text-primary">Their pain:</span>
						<span className="text-muted-foreground">{angle.painPointAddressed}</span>
					</div>
				)}
			</div>

			<div className="flex items-center justify-between">
				{/* Confidence */}
				<div className="flex items-center gap-1.5">
					<div className="h-1 w-12 rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{ width: `${angle.confidence ?? 70}%` }}
						/>
					</div>
					<span className="text-[10px] text-muted-foreground">{angle.confidence ?? 70}%</span>
				</div>

				{angle.status === "suggested" && (
					<div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						<Button
							size="sm"
							className="h-6 px-2 text-[11px]"
							onClick={() => onSelect(angle.id, "selected")}
						>
							<Check className="mr-1 h-3 w-3" />
							Use this
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-6 w-6 p-0"
							onClick={() => onSelect(angle.id, "dismissed")}
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
				)}

				{angle.status === "selected" && (
					<Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[10px]">
						Selected
					</Badge>
				)}
			</div>
		</div>
	);
}

export function AngleSelector({ projectId }: AngleSelectorProps) {
	const { angles, loading, generating, generateAngles, selectAngle } = useAngles(projectId);
	const { personas } = usePersonas(projectId);

	const [selectedPersonaId, setSelectedPersonaId] = useState("");
	const [contentType, setContentType] = useState("");
	const [count, setCount] = useState(5);

	const handleGenerate = () => {
		if (!selectedPersonaId) return;
		generateAngles({
			personaId: selectedPersonaId,
			contentType: contentType || undefined,
			count,
		});
	};

	const handleSelect = async (id: string, status: "selected" | "dismissed") => {
		await selectAngle(id, status);
	};

	const suggestedAngles = angles.filter((a) => a.status === "suggested");
	const selectedAngles = angles.filter((a) => a.status === "selected");
	const hasPersonas = personas.length > 0;

	return (
		<div className="space-y-4">
			{/* Generation controls */}
			{hasPersonas ? (
				<div className="flex flex-wrap items-end gap-3">
					<div>
						<label className="mb-1 block text-xs font-medium text-muted-foreground">
							Target Persona
						</label>
						<select
							value={selectedPersonaId}
							onChange={(e) => setSelectedPersonaId(e.target.value)}
							className="h-8 rounded-md border bg-background px-2 text-sm"
						>
							<option value="">Select persona...</option>
							{personas.map((p) => (
								<option key={p.id} value={p.id}>
									{p.avatar || "👤"} {p.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-muted-foreground">
							Format
						</label>
						<select
							value={contentType}
							onChange={(e) => setContentType(e.target.value)}
							className="h-8 rounded-md border bg-background px-2 text-sm"
						>
							{CONTENT_TYPES.map((t) => (
								<option key={t.value} value={t.value}>
									{t.label}
								</option>
							))}
						</select>
					</div>

					<Button
						size="sm"
						onClick={handleGenerate}
						disabled={!selectedPersonaId || generating}
					>
						{generating ? (
							<Loader2 className="mr-1 h-4 w-4 animate-spin" />
						) : (
							<Sparkles className="mr-1 h-4 w-4" />
						)}
						Generate Angles
					</Button>
				</div>
			) : (
				<div className="rounded-lg border border-dashed p-4 text-center">
					<Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
					<p className="text-xs text-muted-foreground">
						Add a persona first — the bridge connects your story to their needs.
					</p>
				</div>
			)}

			{/* Loading */}
			{loading && (
				<div className="flex items-center gap-2 py-2">
					<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					<span className="text-xs text-muted-foreground">Loading angles...</span>
				</div>
			)}

			{/* Suggested angles */}
			{suggestedAngles.length > 0 && (
				<div>
					<h4 className="mb-2 text-xs font-medium text-muted-foreground">
						Suggested ({suggestedAngles.length})
					</h4>
					<div className="grid gap-2 sm:grid-cols-2">
						{suggestedAngles.map((angle) => (
							<AngleCard key={angle.id} angle={angle} onSelect={handleSelect} />
						))}
					</div>
				</div>
			)}

			{/* Selected angles */}
			{selectedAngles.length > 0 && (
				<div>
					<h4 className="mb-2 text-xs font-medium text-muted-foreground">
						Selected ({selectedAngles.length})
					</h4>
					<div className="grid gap-2 sm:grid-cols-2">
						{selectedAngles.map((angle) => (
							<AngleCard key={angle.id} angle={angle} onSelect={handleSelect} />
						))}
					</div>
				</div>
			)}

			{!loading && angles.length === 0 && hasPersonas && (
				<p className="text-xs text-muted-foreground text-center py-2">
					No angles yet. Pick a persona and generate content angles.
				</p>
			)}
		</div>
	);
}
