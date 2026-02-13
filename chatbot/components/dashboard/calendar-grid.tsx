"use client";

import {
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	isToday,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CalendarEvent } from "@/hooks/use-editorial-calendar";

interface CalendarGridProps {
	currentMonth: Date;
	events: CalendarEvent[];
	onDayClick?: (date: Date, dayEvents: CalendarEvent[]) => void;
}

const STATUS_COLORS: Record<string, string> = {
	todo: "bg-gray-400",
	in_progress: "bg-blue-400",
	generated: "bg-indigo-400",
	pending_review: "bg-amber-400",
	approved: "bg-green-400",
	scheduled: "bg-purple-400",
	publishing: "bg-cyan-400",
	published: "bg-emerald-500",
	failed: "bg-red-400",
};

const TYPE_COLORS: Record<string, string> = {
	newsletter: "bg-blue-500",
	seo: "bg-green-500",
	article: "bg-purple-500",
	image: "bg-pink-500",
	manual: "bg-gray-500",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarGrid({
	currentMonth,
	events,
	onDayClick,
}: CalendarGridProps) {
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(currentMonth);
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

	const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

	const getEventsForDay = (date: Date): CalendarEvent[] => {
		const dateStr = format(date, "yyyy-MM-dd");
		return events.filter((e) => e.date === dateStr);
	};

	const handleDayClick = (date: Date) => {
		const dayEvents = getEventsForDay(date);
		setSelectedDate(date);
		onDayClick?.(date, dayEvents);
	};

	return (
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

			{/* Day cells */}
			<div className="grid grid-cols-7 gap-1">
				{days.map((day) => {
					const dayEvents = getEventsForDay(day);
					const inMonth = isSameMonth(day, currentMonth);
					const today = isToday(day);
					const selected =
						selectedDate && isSameDay(day, selectedDate);

					return (
						<button
							key={day.toISOString()}
							type="button"
							onClick={() => handleDayClick(day)}
							className={`
								relative min-h-[70px] sm:min-h-[80px] rounded-md border p-1 text-left transition-colors
								cursor-pointer
								${!inMonth ? "opacity-40" : ""}
								${today ? "border-primary bg-primary/5" : "border-border"}
								${selected ? "ring-2 ring-primary" : ""}
								hover:bg-muted/50
							`}
						>
							{/* Day number */}
							<span
								className={`
									text-xs font-medium
									${today ? "text-primary" : "text-foreground"}
								`}
							>
								{format(day, "d")}
							</span>

							{/* Event dots */}
							{dayEvents.length > 0 && (
								<div className="mt-0.5 space-y-0.5">
									{dayEvents.slice(0, 3).map((event) => (
										<div
											key={event.id}
											className="flex items-center gap-1"
										>
											<span
												className={`h-1.5 w-1.5 rounded-full shrink-0 ${
													TYPE_COLORS[event.content_type] || "bg-gray-400"
												}`}
											/>
											<span className="text-[10px] truncate leading-tight text-muted-foreground">
												{event.title}
											</span>
										</div>
									))}
									{dayEvents.length > 3 && (
										<span className="text-[10px] text-muted-foreground">
											+{dayEvents.length - 3} more
										</span>
									)}
								</div>
							)}
						</button>
					);
				})}
			</div>

			{/* Selected day detail */}
			{selectedDate && (
				<DayDetail
					date={selectedDate}
					events={getEventsForDay(selectedDate)}
					onClose={() => setSelectedDate(null)}
				/>
			)}
		</div>
	);
}

// ─── Day Detail Popover ──────────────────────────────

interface DayDetailProps {
	date: Date;
	events: CalendarEvent[];
	onClose: () => void;
}

function DayDetail({ date, events, onClose }: DayDetailProps) {
	return (
		<Card className="p-4 space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">
					{format(date, "EEEE, MMMM d, yyyy")}
				</h3>
				<button
					type="button"
					onClick={onClose}
					className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
				>
					Close
				</button>
			</div>

			{events.length === 0 ? (
				<p className="text-xs text-muted-foreground">
					No content scheduled for this day
				</p>
			) : (
				<div className="space-y-2">
					{events.map((event) => (
						<div
							key={event.id}
							className="flex items-center gap-2 rounded-md border p-2"
						>
							<span
								className={`h-2 w-2 rounded-full shrink-0 ${
									STATUS_COLORS[event.status] || "bg-gray-400"
								}`}
							/>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium truncate">
									{event.title}
								</p>
								<div className="flex items-center gap-1 mt-0.5">
									<Badge variant="outline" className="text-[10px] h-4 px-1">
										{event.content_type}
									</Badge>
									<Badge variant="outline" className="text-[10px] h-4 px-1">
										{event.status}
									</Badge>
								</div>
							</div>
							{event.datetime && (
								<span className="text-[10px] text-muted-foreground shrink-0">
									{format(new Date(event.datetime), "HH:mm")}
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</Card>
	);
}
