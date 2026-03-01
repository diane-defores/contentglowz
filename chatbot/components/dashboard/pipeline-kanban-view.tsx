"use client";

import { useCallback, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
	DndContext,
	DragOverlay,
	useDraggable,
	useDroppable,
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import type { ContentItem } from "@/hooks/use-content-review";
import {
	STATUS_COLORS,
	STATUS_LABELS,
	TYPE_LABELS,
	VALID_TRANSITIONS,
} from "@/hooks/use-pipeline";

// ─── Types ──────────────────────────────────────────

interface PipelineKanbanViewProps {
	items: ContentItem[];
	onApprove: (id: string, note?: string) => Promise<void>;
	onReject: (id: string, note: string) => Promise<void>;
	transitionStatus: (contentId: string, toStatus: string) => Promise<boolean>;
	onRefresh: () => void;
}

// ─── Column config ──────────────────────────────────

const KANBAN_COLUMNS = [
	"todo",
	"in_progress",
	"generated",
	"pending_review",
	"approved",
	"scheduled",
	"published",
] as const;

const ARCHIVE_STATUSES = ["rejected", "failed", "archived"];

// ─── Draggable Card ─────────────────────────────────

function KanbanCard({
	item,
	isDragging,
}: {
	item: ContentItem;
	isDragging?: boolean;
}) {
	const canDrag = VALID_TRANSITIONS[item.status] !== undefined;
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: item.id,
		data: { item },
		disabled: !canDrag,
	});

	const style = transform
		? { transform: `translate(${transform.x}px, ${transform.y}px)` }
		: undefined;

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={`
				rounded-lg border bg-card p-2.5 space-y-1.5 transition-shadow
				${canDrag ? "cursor-grab hover:shadow-sm" : "cursor-default"}
				${isDragging ? "opacity-50" : ""}
			`}
		>
			<div className="flex items-start gap-1.5">
				{canDrag && (
					<GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
				)}
				<p className="text-xs font-medium leading-snug line-clamp-2 flex-1">
					{item.title}
				</p>
			</div>
			<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
				<span>{TYPE_LABELS[item.contentType] || item.contentType}</span>
				{item.sourceRobot && (
					<>
						<span>·</span>
						<span>{item.sourceRobot}</span>
					</>
				)}
				<span>·</span>
				<span>
					{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
				</span>
			</div>
			{item.priority > 0 && (
				<span className="inline-block text-[10px] font-mono bg-muted rounded px-1 py-0.5">
					P{item.priority}
				</span>
			)}
		</div>
	);
}

// ─── Ghost card for drag overlay ────────────────────

function DragGhostCard({ item }: { item: ContentItem }) {
	return (
		<div className="rounded-lg border bg-card p-2.5 space-y-1 shadow-lg opacity-90 w-[200px]">
			<p className="text-xs font-medium leading-snug line-clamp-2">
				{item.title}
			</p>
			<div className="text-[10px] text-muted-foreground">
				{TYPE_LABELS[item.contentType] || item.contentType}
			</div>
		</div>
	);
}

// ─── Droppable Column ───────────────────────────────

function KanbanColumn({
	status,
	items,
	activeItem,
}: {
	status: string;
	items: ContentItem[];
	activeItem: ContentItem | null;
}) {
	const { isOver, setNodeRef } = useDroppable({
		id: `col-${status}`,
		data: { status },
	});

	// Highlight if this is a valid drop target
	const isValidTarget =
		activeItem && VALID_TRANSITIONS[activeItem.status]?.includes(status);

	return (
		<div
			ref={setNodeRef}
			className={`
				flex flex-col min-w-[200px] w-[200px] shrink-0 rounded-lg border bg-muted/20 transition-colors
				${isOver && isValidTarget ? "bg-primary/10 border-primary" : ""}
				${isOver && !isValidTarget && activeItem ? "bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-800" : ""}
			`}
		>
			{/* Column header */}
			<div className="flex items-center gap-2 px-3 py-2 border-b">
				<span
					className={`h-2.5 w-2.5 rounded-full shrink-0 ${STATUS_COLORS[status] || "bg-gray-400"}`}
				/>
				<span className="text-xs font-medium truncate">
					{STATUS_LABELS[status] || status}
				</span>
				<span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
					{items.length}
				</span>
			</div>

			{/* Cards */}
			<div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto max-h-[500px]">
				{items.length === 0 ? (
					<p className="text-[10px] text-muted-foreground text-center py-4">
						No items
					</p>
				) : (
					items.map((item) => <KanbanCard key={item.id} item={item} />)
				)}
			</div>
		</div>
	);
}

// ─── Main Kanban View ───────────────────────────────

export function PipelineKanbanView({
	items,
	onApprove,
	onReject,
	transitionStatus,
	onRefresh,
}: PipelineKanbanViewProps) {
	const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
	const [showArchived, setShowArchived] = useState(false);

	// Group items by status
	const byStatus: Record<string, ContentItem[]> = {};
	for (const col of KANBAN_COLUMNS) {
		byStatus[col] = [];
	}
	const archivedItems: ContentItem[] = [];

	for (const item of items) {
		if (ARCHIVE_STATUSES.includes(item.status)) {
			archivedItems.push(item);
		} else if (byStatus[item.status]) {
			byStatus[item.status].push(item);
		}
	}

	// ── DnD handlers ────────────────────────────────

	const handleDragStart = useCallback(
		(e: DragStartEvent) => {
			const item = e.active.data.current?.item as ContentItem | undefined;
			if (item) setActiveItem(item);
		},
		[],
	);

	const handleDragEnd = useCallback(
		async (e: DragEndEvent) => {
			setActiveItem(null);
			const { active, over } = e;
			if (!over) return;

			const item = active.data.current?.item as ContentItem | undefined;
			const targetStatus = over.data.current?.status as string | undefined;
			if (!item || !targetStatus) return;

			// Same status — no-op
			if (item.status === targetStatus) return;

			// Validate transition
			const allowed = VALID_TRANSITIONS[item.status];
			if (!allowed?.includes(targetStatus)) return;

			// Special cases: use approve/reject for pending_review transitions
			if (item.status === "pending_review" && targetStatus === "approved") {
				await onApprove(item.id);
				return;
			}
			if (item.status === "pending_review" && targetStatus === "rejected") {
				await onReject(item.id, "Rejected via kanban");
				return;
			}

			await transitionStatus(item.id, targetStatus);
		},
		[onApprove, onReject, transitionStatus],
	);

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<div className="space-y-3">
				{/* Columns */}
				<div className="flex gap-2 overflow-x-auto pb-2">
					{KANBAN_COLUMNS.map((status) => (
						<KanbanColumn
							key={status}
							status={status}
							items={byStatus[status]}
							activeItem={activeItem}
						/>
					))}
				</div>

				{/* Archived/Failed section */}
				{archivedItems.length > 0 && (
					<div className="border rounded-lg">
						<button
							type="button"
							onClick={() => setShowArchived((v) => !v)}
							className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
						>
							<span>
								Rejected / Failed / Archived ({archivedItems.length})
							</span>
							<span>{showArchived ? "▲" : "▼"}</span>
						</button>
						{showArchived && (
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 p-2 border-t">
								{archivedItems.map((item) => (
									<div
										key={item.id}
										className="rounded-lg border bg-muted/30 p-2 opacity-60"
									>
										<p className="text-xs font-medium truncate">
											{item.title}
										</p>
										<div className="text-[10px] text-muted-foreground mt-0.5">
											{STATUS_LABELS[item.status] || item.status}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Drag overlay */}
			<DragOverlay>
				{activeItem ? <DragGhostCard item={activeItem} /> : null}
			</DragOverlay>
		</DndContext>
	);
}
