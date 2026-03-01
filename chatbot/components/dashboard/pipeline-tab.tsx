"use client";

import {
	AlertCircle,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Columns3,
	Download,
	FileSpreadsheet,
	List,
	Loader2,
	RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePipeline, type PipelineView } from "@/hooks/use-pipeline";
import { ContentFiltersBar } from "./content-filters";
import { SubTabs, type SubTab } from "./sub-tabs";
import { PipelineCalendarView } from "./pipeline-calendar-view";
import { PipelineTableView } from "./pipeline-table-view";
import { PipelineKanbanView } from "./pipeline-kanban-view";

// ─── View toggle tabs ───────────────────────────────

const VIEW_TABS: SubTab[] = [
	{ id: "calendar", label: "Calendar", icon: <CalendarDays className="h-4 w-4" /> },
	{ id: "table", label: "Table", icon: <List className="h-4 w-4" /> },
	{ id: "kanban", label: "Kanban", icon: <Columns3 className="h-4 w-4" /> },
];

// ─── Export helpers ─────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ─── Component ──────────────────────────────────────

interface PipelineTabProps {
	projectId?: string;
}

export function PipelineTab({ projectId }: PipelineTabProps) {
	const pipeline = usePipeline(projectId);
	const {
		items,
		calendarEvents,
		stats,
		view,
		setView,
		filters,
		setFilters,
		currentMonth,
		navigateMonth,
		goToToday,
		loading,
		error,
		clearError,
		refresh,
		approveContent,
		rejectContent,
		scheduleContent,
		transitionStatus,
	} = pipeline;

	// ── Compact stats line ──────────────────────────

	const statParts: string[] = [];
	for (const [key, label] of [
		["pending_review", "pending"],
		["approved", "approved"],
		["scheduled", "scheduled"],
		["published", "published"],
		["failed", "failed"],
	] as const) {
		const count = stats.byStatus?.[key] || 0;
		if (count > 0) statParts.push(`${count} ${label}`);
	}

	// ── Export handlers ─────────────────────────────

	const handleExportCSV = () => {
		const rows = (view === "calendar" ? calendarEvents : items).map((e) => {
			if ("datetime" in e) {
				return {
					Title: e.title,
					Date: e.date,
					Time: e.datetime ? format(new Date(e.datetime), "HH:mm") : "",
					Type: e.content_type,
					Status: e.status,
					Source: e.source_robot,
				};
			}
			return {
				Title: e.title,
				Date: e.scheduledFor || e.createdAt,
				Time: "",
				Type: e.contentType,
				Status: e.status,
				Source: e.sourceRobot,
			};
		});
		const csv = Papa.unparse(rows);
		downloadBlob(
			new Blob([csv], { type: "text/csv;charset=utf-8" }),
			`pipeline-${format(currentMonth, "yyyy-MM")}.csv`,
		);
	};

	const handleExportICS = () => {
		const events = view === "calendar" ? calendarEvents : items.filter((i) => i.scheduledFor);
		const lines = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//MyRobots//Pipeline//EN",
			"CALSCALE:GREGORIAN",
		];
		for (const e of events) {
			const dt = "datetime" in e ? e.datetime : (e as any).scheduledFor;
			if (!dt) continue;
			const dtStart = format(new Date(dt), "yyyyMMdd'T'HHmmss");
			const title = ("title" in e ? e.title : "").replace(/[,;\\]/g, " ");
			const type = "content_type" in e ? e.content_type : (e as any).contentType;
			const status = e.status;
			lines.push(
				"BEGIN:VEVENT",
				`UID:${e.id}@myrobots`,
				`DTSTART:${dtStart}`,
				`SUMMARY:${title}`,
				`DESCRIPTION:Type: ${type}\\nStatus: ${status}`,
				`CATEGORIES:${type}`,
				"END:VEVENT",
			);
		}
		lines.push("END:VCALENDAR");
		downloadBlob(
			new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }),
			`pipeline-${format(currentMonth, "yyyy-MM")}.ics`,
		);
	};

	// ── Loading state ───────────────────────────────

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				<span className="ml-2 text-muted-foreground">Loading pipeline...</span>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Error banner */}
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
					<div className="flex items-center gap-2">
						<AlertCircle className="h-4 w-4 text-red-500" />
						<span className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</span>
						<Button onClick={clearError} variant="ghost" size="sm" className="h-6 text-xs">
							Dismiss
						</Button>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0">
					<h2 className="text-lg font-semibold">Pipeline</h2>
					<p className="text-sm text-muted-foreground truncate">
						{stats.total} items{statParts.length > 0 ? ` — ${statParts.join(", ")}` : ""}
					</p>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					{/* Month nav — calendar view only */}
					{view === "calendar" && (
						<div className="flex items-center gap-1">
							<Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateMonth("prev")}>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="text-sm font-medium min-w-[130px] text-center">
								{format(currentMonth, "MMMM yyyy")}
							</span>
							<Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateMonth("next")}>
								<ChevronRight className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="sm" className="h-8 text-xs" onClick={goToToday}>
								Today
							</Button>
						</div>
					)}

					{/* Export */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-8">
								<Download className="h-3.5 w-3.5 mr-1" />
								Export
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleExportCSV}>
								<FileSpreadsheet className="h-4 w-4 mr-2" />
								Export as CSV
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleExportICS}>
								<CalendarDays className="h-4 w-4 mr-2" />
								Export as ICS
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<Button onClick={refresh} variant="outline" size="sm" className="h-8">
						<RefreshCw className="h-3.5 w-3.5 mr-1" />
						Refresh
					</Button>
				</div>
			</div>

			{/* Filters */}
			<ContentFiltersBar filters={filters} onFiltersChange={setFilters} />

			{/* View toggle */}
			<SubTabs
				tabs={VIEW_TABS}
				activeTab={view}
				onTabChange={(id) => setView(id as PipelineView)}
			/>

			{/* Active view */}
			{view === "calendar" && (
				<PipelineCalendarView
					currentMonth={currentMonth}
					events={calendarEvents}
					items={items}
					onSchedule={scheduleContent}
					onRefresh={refresh}
				/>
			)}

			{view === "table" && (
				<PipelineTableView
					items={items}
					onApprove={approveContent}
					onReject={rejectContent}
					onRefresh={refresh}
				/>
			)}

			{view === "kanban" && (
				<PipelineKanbanView
					items={items}
					onApprove={approveContent}
					onReject={rejectContent}
					transitionStatus={transitionStatus}
					onRefresh={refresh}
				/>
			)}
		</div>
	);
}
