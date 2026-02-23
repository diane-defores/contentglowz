"use client";

import { Check, Loader2, Sparkles, X, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
		<div className="rounded-lg border p-4">
			<div className="mb-2 flex items-start justify-between">
				<h4 className="font-medium text-sm">{angle.title}</h4>
				<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
					{angle.contentType.replace("_", " ")}
				</span>
			</div>

			{angle.hook && (
				<p className="mb-2 text-sm italic text-muted-foreground">
					&ldquo;{angle.hook}&rdquo;
				</p>
			)}

			<p className="mb-3 text-sm">{angle.angle}</p>

			<div className="mb-3 grid gap-2 text-xs md:grid-cols-2">
				{angle.narrativeThread && (
					<div>
						<span className="font-medium text-muted-foreground">Story thread: </span>
						{angle.narrativeThread}
					</div>
				)}
				{angle.painPointAddressed && (
					<div>
						<span className="font-medium text-muted-foreground">Pain point: </span>
						{angle.painPointAddressed}
					</div>
				)}
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1">
					<div className="h-1.5 w-16 rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary"
							style={{ width: `${angle.confidence ?? 70}%` }}
						/>
					</div>
					<span className="text-xs text-muted-foreground">{angle.confidence ?? 70}%</span>
				</div>

				{angle.status === "suggested" && (
					<div className="flex gap-1">
						<Button
							size="sm"
							variant="default"
							className="h-7 px-2 text-xs"
							onClick={() => onSelect(angle.id, "selected")}
						>
							<Check className="mr-1 h-3 w-3" />
							Select
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-7 px-2 text-xs"
							onClick={() => onSelect(angle.id, "dismissed")}
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
				)}

				{angle.status === "selected" && (
					<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
						Selected
					</span>
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

	return (
		<Card className="p-6">
			<div className="mb-4 flex items-center gap-2">
				<Zap className="h-5 w-5" />
				<h2 className="text-lg font-semibold">Content Angles</h2>
				<span className="text-sm text-muted-foreground">— The Bridge</span>
			</div>

			{/* Generation controls */}
			<div className="mb-4 flex flex-wrap items-end gap-3">
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
						Content Type
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

			{/* Loading state */}
			{loading && (
				<div className="flex items-center gap-2 py-4">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span className="text-sm text-muted-foreground">Loading angles...</span>
				</div>
			)}

			{/* Suggested angles */}
			{suggestedAngles.length > 0 && (
				<div className="mb-4">
					<h3 className="mb-2 text-sm font-medium text-muted-foreground">
						Suggested ({suggestedAngles.length})
					</h3>
					<div className="grid gap-3 md:grid-cols-2">
						{suggestedAngles.map((angle) => (
							<AngleCard key={angle.id} angle={angle} onSelect={handleSelect} />
						))}
					</div>
				</div>
			)}

			{/* Selected angles */}
			{selectedAngles.length > 0 && (
				<div>
					<h3 className="mb-2 text-sm font-medium text-muted-foreground">
						Selected ({selectedAngles.length})
					</h3>
					<div className="grid gap-3 md:grid-cols-2">
						{selectedAngles.map((angle) => (
							<AngleCard key={angle.id} angle={angle} onSelect={handleSelect} />
						))}
					</div>
				</div>
			)}

			{!loading && angles.length === 0 && (
				<p className="text-sm text-muted-foreground">
					No angles yet. Select a persona and generate content angles.
				</p>
			)}
		</Card>
	);
}
