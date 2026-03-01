"use client";

import {
	CalendarDays,
	Check,
	Clock,
	Edit2,
	ExternalLink,
	X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ContentItem } from "@/hooks/use-content-review";
import { ContentEditorModal } from "./content-editor-modal";
import { ContentStatusBadge } from "./content-status-badge";
import { ScheduleContentModal } from "./schedule-content-modal";

interface ContentReviewCardProps {
	item: ContentItem;
	onApprove: (id: string, note?: string) => Promise<void>;
	onReject: (id: string, note: string) => Promise<void>;
	onRefresh?: () => void;
}

const EDITABLE_STATUSES = ["generated", "pending_review", "approved"];
const FUNNEL_LABELS = {
	tofu: "ToFu",
	mofu: "MoFu",
	bofu: "BoFu",
	retention: "Retention",
} as const;

export function ContentReviewCard({
	item,
	onApprove,
	onReject,
	onRefresh,
}: ContentReviewCardProps) {
	const [rejectNote, setRejectNote] = useState("");
	const [showRejectInput, setShowRejectInput] = useState(false);
	const [acting, setActing] = useState(false);
	const [editorOpen, setEditorOpen] = useState(false);
	const [scheduleOpen, setScheduleOpen] = useState(false);

	const handleSchedule = useCallback(
		async (contentId: string, scheduledFor: string) => {
			try {
				const res = await fetch(
					`/api/seo/api/status/content/${contentId}/schedule`,
					{
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							scheduled_for: scheduledFor,
							changed_by: "user",
						}),
					},
				);
				if (!res.ok) return false;
				onRefresh?.();
				return true;
			} catch {
				return false;
			}
		},
		[onRefresh],
	);

	const handleApprove = async () => {
		setActing(true);
		try {
			await onApprove(item.id);
		} finally {
			setActing(false);
		}
	};

	const handleReject = async () => {
		if (!rejectNote.trim()) return;
		setActing(true);
		try {
			await onReject(item.id, rejectNote);
			setShowRejectInput(false);
			setRejectNote("");
		} finally {
			setActing(false);
		}
	};

	const robotLabel: Record<string, string> = {
		seo: "SEO",
		newsletter: "Newsletter",
		article: "Article",
		images: "Images",
		manual: "Manual",
	};

	const typeLabel: Record<string, string> = {
		article: "Article",
		newsletter: "Newsletter",
		"seo-content": "SEO",
		image: "Image",
		manual: "Manual",
	};

	const createdAt = new Date(item.createdAt);
	const timeAgo = getTimeAgo(createdAt);

	return (
		<Card className="p-4 space-y-3">
			{/* Header */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-sm truncate">{item.title}</h3>
					<div className="flex items-center gap-2 mt-1">
						<ContentStatusBadge status={item.status} />
						<span className="text-xs text-muted-foreground">
							{typeLabel[item.contentType] || item.contentType}
						</span>
						<span className="text-xs text-muted-foreground">
							{robotLabel[item.sourceRobot] || item.sourceRobot}
						</span>
					</div>
				</div>
				{item.priority > 3 && (
					<span className="text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded dark:bg-orange-900/30 dark:text-orange-400">
						P{item.priority}
					</span>
				)}
			</div>

			{/* Preview */}
			{item.contentPreview && (
				<p className="text-xs text-muted-foreground line-clamp-3">
					{item.contentPreview}
				</p>
			)}

			{/* Tags */}
			{item.tags && item.tags.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{item.tags.slice(0, 5).map((tag) => (
						<span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">
							{tag}
						</span>
					))}
					{item.tags.length > 5 && (
						<span className="text-xs text-muted-foreground">
							+{item.tags.length - 5}
						</span>
					)}
				</div>
			)}

			{/* Metadata tracking */}
			{item.normalizedMetadata && item.metadataAudit && (
				<div className="rounded-md border bg-muted/20 p-2 space-y-1">
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<span className="rounded bg-muted px-1.5 py-0.5 font-medium">
							{FUNNEL_LABELS[item.normalizedMetadata.funnelStage]}
						</span>
						<span className="rounded bg-muted px-1.5 py-0.5">
							SEO score {item.metadataAudit.score}/100
						</span>
						<span className="rounded bg-muted px-1.5 py-0.5">
							Workflow {item.normalizedMetadata.contentStatus}
						</span>
					</div>
					<div className="text-xs text-muted-foreground">
						Robots: {item.metadataAudit.robotProgress.done}/
						{item.metadataAudit.robotProgress.total} done
						{item.metadataAudit.robotProgress.failed > 0
							? `, ${item.metadataAudit.robotProgress.failed} failed`
							: ""}
						{item.metadataAudit.errorCount > 0
							? `, ${item.metadataAudit.errorCount} metadata errors`
							: ""}
					</div>
				</div>
			)}

			{/* Meta */}
			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				<span className="flex items-center gap-1">
					<Clock className="h-3 w-3" />
					{timeAgo}
				</span>
				{item.targetUrl && (
					<a
						href={item.targetUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1 hover:text-foreground"
					>
						<ExternalLink className="h-3 w-3" />
						View
					</a>
				)}
			</div>

			{/* Reviewer note */}
			{item.reviewerNote && (
				<div className="text-xs bg-muted/50 rounded p-2">
					<span className="font-medium">Review note:</span> {item.reviewerNote}
					{item.reviewedBy && (
						<span className="text-muted-foreground"> - {item.reviewedBy}</span>
					)}
				</div>
			)}

			{/* Actions */}
			<div className="space-y-2 pt-1">
				{/* Edit + Schedule row for editable statuses */}
				{EDITABLE_STATUSES.includes(item.status) && (
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => setEditorOpen(true)}
							className="h-8 flex-1"
						>
							<Edit2 className="h-3.5 w-3.5 mr-1" />
							Edit
						</Button>
						{item.status === "approved" && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => setScheduleOpen(true)}
								className="h-8 flex-1"
							>
								<CalendarDays className="h-3.5 w-3.5 mr-1" />
								Schedule
							</Button>
						)}
					</div>
				)}

				{/* Approve/Reject for pending_review */}
				{item.status === "pending_review" &&
					(showRejectInput ? (
						<div className="flex gap-2">
							<input
								type="text"
								value={rejectNote}
								onChange={(e) => setRejectNote(e.target.value)}
								placeholder="Reason for rejection..."
								className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
								onKeyDown={(e) => {
									if (e.key === "Enter") handleReject();
									if (e.key === "Escape") setShowRejectInput(false);
								}}
							/>
							<Button
								size="sm"
								variant="destructive"
								disabled={acting || !rejectNote.trim()}
								onClick={handleReject}
								className="h-8"
							>
								Confirm
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setShowRejectInput(false)}
								className="h-8"
							>
								Cancel
							</Button>
						</div>
					) : (
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="default"
								disabled={acting}
								onClick={handleApprove}
								className="h-8 flex-1"
							>
								<Check className="h-3.5 w-3.5 mr-1" />
								Approve
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={acting}
								onClick={() => setShowRejectInput(true)}
								className="h-8 flex-1"
							>
								<X className="h-3.5 w-3.5 mr-1" />
								Reject
							</Button>
						</div>
					))}
			</div>

			{/* Editor Modal */}
			<ContentEditorModal
				item={item}
				open={editorOpen}
				onClose={() => setEditorOpen(false)}
				onApprove={item.status === "pending_review" ? onApprove : undefined}
				onRefresh={onRefresh}
			/>

			{/* Schedule Modal */}
			<ScheduleContentModal
				item={item}
				open={scheduleOpen}
				onClose={() => setScheduleOpen(false)}
				onSchedule={handleSchedule}
			/>
		</Card>
	);
}

function getTimeAgo(date: Date): string {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}
