"use client";

import { AlertCircle, BarChart3, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface PostHogProject {
	id: number;
	name: string;
	uuid: string;
}

interface PostHogProjectPickerProps {
	value: string;
	onChange: (projectId: string) => void;
}

export function PostHogProjectPicker({ value, onChange }: PostHogProjectPickerProps) {
	const [projects, setProjects] = useState<PostHogProject[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchProjects = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/analytics/posthog/projects");
			if (res.status === 400) {
				// API key not configured — not an error, just no key yet
				setProjects([]);
				return;
			}
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || "Failed to fetch PostHog projects");
			}
			const data = await res.json();
			setProjects(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	if (loading) {
		return (
			<div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
				<Loader2 className="h-3 w-3 animate-spin" />
				Loading PostHog projects...
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center gap-2 py-2 text-xs text-destructive">
				<AlertCircle className="h-3 w-3" />
				{error}
			</div>
		);
	}

	if (projects.length === 0) {
		return (
			<p className="text-xs text-muted-foreground py-1">
				Add your PostHog API key in Settings &rarr; API Keys to auto-detect projects.
			</p>
		);
	}

	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select a PostHog project..." />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="none">None</SelectItem>
				{projects.map((p) => (
					<SelectItem key={p.id} value={String(p.id)}>
						<span className="flex items-center gap-2">
							<BarChart3 className="h-3 w-3" />
							{p.name}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
