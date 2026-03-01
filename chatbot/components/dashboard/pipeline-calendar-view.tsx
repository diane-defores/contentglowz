"use client";

import { useState, useCallback } from "react";
import {
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isBefore,
	isSameDay,
	isSameMonth,
	isToday,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import {
	DndContext,
	DragOverlay,
	useDraggable,
	useDroppable,
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, GripVertical, Clock } from "lucide-react";
import type { CalendarEvent } from "@/hooks/use-pipeline";
import type { ContentItem } from "@/hooks/use-content-review";
import {
	TYPE_HEX_COLORS,
	STATUS_COLORS,
	TYPE_LABELS,
	STATUS_LABELS,
} from "@/hooks/use-pipeline";
import { ContentStatusBadge } from "./content-status-badge";

// ─── Props ──────────────────────────────────────────

interface PipelineCalendarViewProps {
	currentMonth: Date;
	events: CalendarEvent[];
	items: ContentItem[];
	onSchedule: (contentId: string, scheduledFor: string) => Promise<boolean>;
	onRefresh: () => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Draggable Event Chip ───────────────────────────

function EventChip({
	event,
	isDragging,
}: {
	event: CalendarEvent;
	isDragging?: boolean;
}) {
	const canDrag = ["approved", "scheduled"].includes(event.status);
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: event.id,
		data: { event },
		disabled: !canDrag,
	});

	const borderColor = TYPE_HEX_COLORS[event.content_type] || "#6b7280";
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
				flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] leading-tight
				bg-card border transition-shadow
				${canDrag ? "cursor-grab hover:shadow-sm" : "cursor-default"}
				${isDragging ? "opacity-50" : ""}
			`}
		>
			<span
				className="w-[3px] self-stretch rounded-full shrink-0"
				style={{ backgroundColor: borderColor }}
			/>
			{canDrag && (
				<GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
			)}
			<span className="truncate flex-1 font-medium">{event.title}</span>
			{event.datetime && (
				<span className="text-muted-foreground shrink-0">
					{format(new Date(event.datetime), "HH:mm")}
				</span>
			)}
			<span
				className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_COLORS[event.status] || "bg-gray-400"}`}
			/>
		</div>
	);
}

// ─── Ghost chip for drag overlay ────────────────────

function DragGhostChip({ event }: { event: CalendarEvent }) {
	const borderColor = TYPE_HEX_COLORS[event.content_type] || "#6b7280";
	return (
		<div className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] leading-tight bg-card border shadow-lg opacity-90 w-[180px]">
			<span
				className="w-[3px] self-stretch rounded-full shrink-0"
				style={{ backgroundColor: borderColor }}
			/>
			<span className="truncate flex-1 font-medium">{event.title}</span>
			<span
				className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_COLORS[event.status] || "bg-gray-400"}`}
			/>
		</div>
	);
}

// ─── Droppable Day Cell ─────────────────────────────

function DayCell({
	day,
	currentMonth,
	dayEvents,
	selectedDate,
	onSelect,
	onScheduleExisting,
}: {
	day: Date;
	currentMonth: Date;
	dayEvents: CalendarEvent[];
	selectedDate: Date | null;
	onSelect: (date: Date) => void;
	onScheduleExisting: (date: Date) => void;
}) {
	const inMonth = isSameMonth(day, currentMonth);
	const today = isToday(day);
	const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
	const selected = selectedDate && isSameDay(day, selectedDate);

	const { isOver, setNodeRef } = useDroppable({
		id: `day-${format(day, "yyyy-MM-dd")}`,
		data: { date: day },
		disabled: isPast,
	});

	return (
		<div
			ref={setNodeRef}
			onClick={() => onSelect(day)}
			className={`
				group relative min-h-[100px] rounded-md border p-1 text-left transition-colors cursor-pointer
				${!inMonth ? "opacity-40" : ""}
				${today ? "border-primary bg-primary/5" : "border-border"}
				${selected ? "ring-2 ring-primary" : ""}
				${isOver && !isPast ? "bg-primary/10 border-primary" : ""}
				hover:bg-muted/50
			`}
		>
			{/* Day number + add button */}
			<div className="flex items-center justify-between">
				<span
					className={`text-xs font-medium ${today ? "text-primary" : "text-foreground"}`}
				>
					{format(day, "d")}
				</span>
				{inMonth && !isPast && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onScheduleExisting(day);
						}}
						className="opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 rounded flex items-center justify-center hover:bg-muted"
					>
						<Plus className="h-3 w-3 text-muted-foreground" />
					</button>
				)}
			</div>

			{/* Event chips */}
			{dayEvents.length > 0 && (
				<div className="mt-1 space-y-0.5">
					{dayEvents.slice(0, 3).map((event) => (
						<EventChip key={event.id} event={event} />
					))}
					{dayEvents.length > 3 && (
						<span className="text-[10px] text-muted-foreground pl-1">
							+{dayEvents.length - 3} more
						</span>
					)}
				</div>
			)}
		</div>
	);
}

// ─── Day Detail Panel ───────────────────────────────

function DayDetail({
	date,
	events,
	onClose,
}: {
	date: Date;
	events: CalendarEvent[];
	onClose: () => void;
}) {
	return (
		<Card className="p-4 space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">
					{format(date, "EEEE, MMMM d, yyyy")}
				</h3>
				<button
					type="button"
					onClick={onClose}
					className="text-muted-foreground hover:text-foreground cursor-pointer"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{events.length === 0 ? (
				<p className="text-xs text-muted-foreground">
					No content scheduled for this day.
				</p>
			) : (
				<div className="space-y-2">
					{events.map((event) => {
						const borderColor =
							TYPE_HEX_COLORS[event.content_type] || "#6b7280";
						return (
							<div
								key={event.id}
								className="flex items-center gap-3 rounded-md border p-2.5"
							>
								<span
									className="w-1 self-stretch rounded-full shrink-0"
									style={{ backgroundColor: borderColor }}
								/>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">
										{event.title}
									</p>
									<div className="flex items-center gap-1.5 mt-1">
										<Badge
											variant="outline"
											className="text-[10px] h-4 px-1.5"
										>
											{TYPE_LABELS[event.content_type] || event.content_type}
										</Badge>
										<ContentStatusBadge status={event.status} size="sm" />
										{event.source_robot && (
											<span className="text-[10px] text-muted-foreground">
												{event.source_robot}
											</span>
										)}
									</div>
								</div>
								{event.datetime && (
									<div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
										<Clock className="h-3 w-3" />
										{format(new Date(event.datetime), "HH:mm")}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</Card>
	);
}

// ─── Schedule Existing Picker ───────────────────────

function ScheduleExistingPicker({
	date,
	items,
	onSchedule,
	onClose,
}: {
	date: Date;
	items: ContentItem[];
	onSchedule: (contentId: string, scheduledFor: string) => Promise<boolean>;
	onClose: () => void;
}) {
	const unscheduled = items.filter(
		(i) => i.status === "approved" && !i.scheduledFor,
	);

	const handlePick = async (item: ContentItem) => {
		const scheduledFor = `${format(date, "yyyy-MM-dd")}T09:00:00`;
		await onSchedule(item.id, scheduledFor);
		onClose();
	};

	return (
		<Card className="p-4 space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">
					Schedule content for {format(date, "MMM d")}
				</h3>
				<button
					type="button"
					onClick={onClose}
					className="text-muted-foreground hover:text-foreground cursor-pointer"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
			{unscheduled.length === 0 ? (
				<p className="text-xs text-muted-foreground">
					No approved unscheduled content available.
				</p>
			) : (
				<div className="space-y-1 max-h-[200px] overflow-y-auto">
					{unscheduled.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => handlePick(item)}
							className="w-full text-left rounded-md border p-2 hover:bg-muted/50 transition-colors cursor-pointer"
						>
							<p className="text-xs font-medium truncate">{item.title}</p>
							<span className="text-[10px] text-muted-foreground">
								{TYPE_LABELS[item.contentType] || item.contentType}
								{item.sourceRobot ? ` · ${item.sourceRobot}` : ""}
							</span>
						</button>
					))}
				</div>
			)}
		</Card>
	);
}

// ─── Main Calendar View ─────────────────────────────

export function PipelineCalendarView({
	currentMonth,
	events,
	items,
	onSchedule,
	onRefresh,
}: PipelineCalendarViewProps) {
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [schedulingDate, setSchedulingDate] = useState<Date | null>(null);
	const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(currentMonth);
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
	const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

	const getEventsForDay = useCallback(
		(date: Date): CalendarEvent[] => {
			const dateStr = format(date, "yyyy-MM-dd");
			return events.filter((e) => e.date === dateStr);
		},
		[events],
	);

	// ── DnD handlers ────────────────────────────────

	const handleDragStart = useCallback(
		(e: DragStartEvent) => {
			const event = e.active.data.current?.event as CalendarEvent | undefined;
			if (event) setActiveEvent(event);
		},
		[],
	);

	const handleDragEnd = useCallback(
		async (e: DragEndEvent) => {
			setActiveEvent(null);
			const { active, over } = e;
			if (!over) return;

			const event = active.data.current?.event as CalendarEvent | undefined;
			const targetDate = over.data.current?.date as Date | undefined;
			if (!event || !targetDate) return;

			// Don't drop on past dates
			if (isBefore(startOfDay(targetDate), startOfDay(new Date()))) return;

			// Don't drop on same date
			if (event.date === format(targetDate, "yyyy-MM-dd")) return;

			// Preserve original time, change date
			const originalTime = event.datetime
				? format(new Date(event.datetime), "HH:mm:ss")
				: "09:00:00";
			const newDatetime = `${format(targetDate, "yyyy-MM-dd")}T${originalTime}`;

			const success = await onSchedule(event.id, newDatetime);
			if (success) onRefresh();
		},
		[onSchedule, onRefresh],
	);

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<div className="space-y-2">
				{/* Weekday headers */}
				<div className="grid grid-cols-7 gap-1">
					{WEEKDAYS.map((day) => (
						<div
							key={day}
							className="text-center text-xs font-medium text-muted-foreground py-1"
						>
							{day}
						</div>
					))}
				</div>

				{/* Day grid */}
				<div className="grid grid-cols-7 gap-1">
					{days.map((day) => (
						<DayCell
							key={day.toISOString()}
							day={day}
							currentMonth={currentMonth}
							dayEvents={getEventsForDay(day)}
							selectedDate={selectedDate}
							onSelect={(d) => {
								setSelectedDate(d);
								setSchedulingDate(null);
							}}
							onScheduleExisting={(d) => {
								setSchedulingDate(d);
								setSelectedDate(null);
							}}
						/>
					))}
				</div>

				{/* Schedule picker */}
				{schedulingDate && (
					<ScheduleExistingPicker
						date={schedulingDate}
						items={items}
						onSchedule={onSchedule}
						onClose={() => setSchedulingDate(null)}
					/>
				)}

				{/* Day detail */}
				{selectedDate && !schedulingDate && (
					<DayDetail
						date={selectedDate}
						events={getEventsForDay(selectedDate)}
						onClose={() => setSelectedDate(null)}
					/>
				)}
			</div>

			{/* Drag overlay */}
			<DragOverlay>
				{activeEvent ? <DragGhostChip event={activeEvent} /> : null}
			</DragOverlay>
		</DndContext>
	);
}
