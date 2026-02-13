"use client";

import {
	Calendar,
	Clock,
	Loader2,
	Pause,
	Pencil,
	Play,
	Plus,
	Sparkles,
	Trash2,
	Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsletterGenerator } from "@/lib/db/schema";
import type { NewsletterJobStatus } from "@/hooks/use-newsletter";

interface GeneratorsListProps {
	generators: NewsletterGenerator[];
	loading: boolean;
	generatingId: string | null;
	jobStatus: NewsletterJobStatus | null;
	onGenerateNow: (generator: NewsletterGenerator) => void;
	onEdit: (generator: NewsletterGenerator) => void;
	onDelete: (id: string) => void;
	onToggleStatus: (generator: NewsletterGenerator) => void;
	onCreateNew: () => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatSchedule(generator: NewsletterGenerator): string {
	if (generator.schedule === "manual") return "Manual";
	const time = generator.scheduleTime || "09:00";
	if (generator.schedule === "daily") return `Daily at ${time}`;
	if (generator.schedule === "weekly") {
		const day = WEEKDAYS[generator.scheduleDay ?? 0] || "Mon";
		return `Weekly · ${day} ${time}`;
	}
	if (generator.schedule === "monthly") {
		const day = generator.scheduleDay ?? 1;
		return `Monthly · Day ${day} ${time}`;
	}
	return generator.schedule;
}

function formatLastRun(generator: NewsletterGenerator): string | null {
	if (!generator.lastRunAt) return null;
	return new Date(generator.lastRunAt).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function GeneratorsList({
	generators,
	loading,
	generatingId,
	jobStatus,
	onGenerateNow,
	onEdit,
	onDelete,
	onToggleStatus,
	onCreateNew,
}: GeneratorsListProps) {
	if (loading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-9 w-40" />
				</div>
				{Array.from({ length: 2 }).map((_, i) => (
					<Skeleton key={i} className="h-28 w-full" />
				))}
			</div>
		);
	}

	const total = generators.length;
	const active = generators.filter((g) => g.status === "active").length;
	const paused = generators.filter((g) => g.status === "paused").length;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h3 className="font-semibold">Generators</h3>
					{total > 0 && (
						<div className="flex gap-2 text-xs">
							<Badge variant="secondary">{total} total</Badge>
							<Badge
								variant="outline"
								className="text-green-600 border-green-200"
							>
								{active} active
							</Badge>
							{paused > 0 && (
								<Badge
									variant="outline"
									className="text-yellow-600 border-yellow-200"
								>
									{paused} paused
								</Badge>
							)}
						</div>
					)}
				</div>
				<Button size="sm" onClick={onCreateNew}>
					<Plus className="mr-1.5 h-3.5 w-3.5" />
					Register Generator
				</Button>
			</div>

			{/* Empty state */}
			{total === 0 && (
				<Card className="p-8 text-center">
					<Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
					<p className="text-sm text-muted-foreground">
						No newsletter generators yet. Register one to get
						started.
					</p>
				</Card>
			)}

			{/* Generator cards */}
			{generators.map((gen) => {
				const isGenerating = generatingId === gen.id;
				const lastRun = formatLastRun(gen);
				const scheduleLabel = formatSchedule(gen);

				return (
					<Card key={gen.id} className="p-4">
						<div className="flex items-start justify-between gap-3">
							{/* Left: Info */}
							<div className="min-w-0 flex-1 space-y-2">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="font-medium text-sm">
										{gen.name}
									</span>
									<Badge
										variant={
											gen.status === "active"
												? "default"
												: "secondary"
										}
										className={
											gen.status === "active"
												? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
												: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
										}
									>
										{gen.status}
									</Badge>
									<Badge
										variant="outline"
										className="gap-1 text-xs"
									>
										<Calendar className="h-3 w-3" />
										{scheduleLabel}
									</Badge>
								</div>

								{/* Topics */}
								{gen.topics && gen.topics.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{gen.topics.map((topic) => (
											<Badge
												key={topic}
												variant="secondary"
												className="text-xs"
											>
												{topic}
											</Badge>
										))}
									</div>
								)}

								{/* Last run */}
								{lastRun && (
									<p className="text-xs text-muted-foreground flex items-center gap-1">
										<Clock className="h-3 w-3" />
										Last run: {lastRun}
										{gen.lastRunStatus && (
											<Badge
												variant="outline"
												className={`text-xs ml-1 ${
													gen.lastRunStatus ===
													"completed"
														? "text-green-600 border-green-200"
														: "text-red-600 border-red-200"
												}`}
											>
												{gen.lastRunStatus}
											</Badge>
										)}
									</p>
								)}

								{/* Generation progress */}
								{isGenerating && jobStatus && (
									<div className="space-y-1 pt-1">
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<Loader2 className="h-3 w-3 animate-spin" />
											{jobStatus.message ||
												"Generating..."}
										</div>
										<Progress
											value={jobStatus.progress || 0}
											className="h-1.5"
										/>
									</div>
								)}
							</div>

							{/* Right: Actions */}
							<div className="flex items-center gap-1 shrink-0">
								<Button
									variant="default"
									size="sm"
									onClick={() => onGenerateNow(gen)}
									disabled={isGenerating || generatingId !== null}
								>
									{isGenerating ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<>
											<Zap className="mr-1 h-3.5 w-3.5" />
											Generate
										</>
									)}
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={() => onEdit(gen)}
								>
									<Pencil className="h-3.5 w-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={() => onToggleStatus(gen)}
								>
									{gen.status === "active" ? (
										<Pause className="h-3.5 w-3.5" />
									) : (
										<Play className="h-3.5 w-3.5" />
									)}
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-destructive hover:text-destructive"
									onClick={() => onDelete(gen.id)}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
					</Card>
				);
			})}
		</div>
	);
}
