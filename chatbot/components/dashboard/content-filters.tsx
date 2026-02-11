"use client";

import type { ContentFilters } from "@/hooks/use-content-review";

const STATUS_OPTIONS = [
	{ value: "", label: "All Statuses" },
	{ value: "pending_review", label: "Pending Review" },
	{ value: "approved", label: "Approved" },
	{ value: "rejected", label: "Rejected" },
	{ value: "todo", label: "To Do" },
	{ value: "in_progress", label: "In Progress" },
	{ value: "generated", label: "Generated" },
	{ value: "scheduled", label: "Scheduled" },
	{ value: "publishing", label: "Publishing" },
	{ value: "published", label: "Published" },
	{ value: "failed", label: "Failed" },
	{ value: "archived", label: "Archived" },
];

const TYPE_OPTIONS = [
	{ value: "", label: "All Types" },
	{ value: "article", label: "Article" },
	{ value: "newsletter", label: "Newsletter" },
	{ value: "seo-content", label: "SEO Content" },
	{ value: "image", label: "Image" },
	{ value: "manual", label: "Manual" },
];

const ROBOT_OPTIONS = [
	{ value: "", label: "All Robots" },
	{ value: "seo", label: "SEO" },
	{ value: "newsletter", label: "Newsletter" },
	{ value: "article", label: "Article" },
	{ value: "images", label: "Images" },
	{ value: "manual", label: "Manual" },
];

interface ContentFiltersBarProps {
	filters: ContentFilters;
	onFiltersChange: (filters: ContentFilters) => void;
}

export function ContentFiltersBar({
	filters,
	onFiltersChange,
}: ContentFiltersBarProps) {
	const handleChange = (key: keyof ContentFilters, value: string) => {
		onFiltersChange({
			...filters,
			[key]: value || undefined,
		});
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			<select
				value={filters.status || ""}
				onChange={(e) => handleChange("status", e.target.value)}
				className="h-8 rounded-md border border-input bg-background px-2 text-sm"
			>
				{STATUS_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>

			<select
				value={filters.contentType || ""}
				onChange={(e) => handleChange("contentType", e.target.value)}
				className="h-8 rounded-md border border-input bg-background px-2 text-sm"
			>
				{TYPE_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>

			<select
				value={filters.sourceRobot || ""}
				onChange={(e) => handleChange("sourceRobot", e.target.value)}
				className="h-8 rounded-md border border-input bg-background px-2 text-sm"
			>
				{ROBOT_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>

			{(filters.status || filters.contentType || filters.sourceRobot) && (
				<button
					type="button"
					onClick={() => onFiltersChange({})}
					className="h-8 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
				>
					Clear filters
				</button>
			)}
		</div>
	);
}
