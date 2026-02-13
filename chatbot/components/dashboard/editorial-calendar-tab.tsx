"use client";

import {
	AlertCircle,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Loader2,
	RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useEditorialCalendar } from "@/hooks/use-editorial-calendar";
import { CalendarGrid } from "./calendar-grid";

interface EditorialCalendarTabProps {
	projectId?: string;
}

export function EditorialCalendarTab({
	projectId,
}: EditorialCalendarTabProps) {
	const {
		currentMonth,
		events,
		loading,
		error,
		navigateMonth,
		goToToday,
		refresh,
		clearError,
	} = useEditorialCalendar(projectId);

	// Count events by type for summary
	const contentCount = events.filter((e) => e.type === "content").length;
	const scheduleCount = events.filter((e) => e.type === "schedule").length;

	return (
		<div className="space-y-6">
			{/* Error banner */}
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
					<div className="flex items-center gap-2">
						<AlertCircle className="h-4 w-4 text-red-500" />
						<span className="flex-1 text-sm text-red-700 dark:text-red-300">
							{error}
						</span>
						<Button
							onClick={clearError}
							variant="ghost"
							size="sm"
							className="h-6 text-xs"
						>
							Dismiss
						</Button>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<CalendarDays className="h-5 w-5" />
						Editorial Calendar
					</h2>
					<p className="text-sm text-muted-foreground">
						{contentCount} content items, {scheduleCount} scheduled jobs this month
					</p>
				</div>
				<Button
					onClick={refresh}
					variant="outline"
					size="sm"
					className="h-8"
				>
					<RefreshCw className="h-3.5 w-3.5 mr-1" />
					Refresh
				</Button>
			</div>

			{/* Month navigation */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => navigateMonth("prev")}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<h3 className="text-base font-medium min-w-[160px] text-center">
						{format(currentMonth, "MMMM yyyy")}
					</h3>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => navigateMonth("next")}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 text-xs"
					onClick={goToToday}
				>
					Today
				</Button>
			</div>

			{/* Calendar grid */}
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					<span className="ml-2 text-muted-foreground">
						Loading calendar...
					</span>
				</div>
			) : (
				<CalendarGrid
					currentMonth={currentMonth}
					events={events}
				/>
			)}

			{/* Legend */}
			<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
				<span className="flex items-center gap-1">
					<span className="h-2 w-2 rounded-full bg-blue-500" />
					Newsletter
				</span>
				<span className="flex items-center gap-1">
					<span className="h-2 w-2 rounded-full bg-green-500" />
					SEO
				</span>
				<span className="flex items-center gap-1">
					<span className="h-2 w-2 rounded-full bg-purple-500" />
					Article
				</span>
				<span className="flex items-center gap-1">
					<span className="h-2 w-2 rounded-full bg-pink-500" />
					Image
				</span>
			</div>
		</div>
	);
}
